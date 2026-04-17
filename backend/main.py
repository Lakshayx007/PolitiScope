"""PolitiScope — FastAPI backend for political intelligence."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
import httpx
import asyncio

from news import fetch_articles, fetch_ticker_headlines
from nlp import run_topic_modeling
import cache

app = FastAPI(title="PolitiScope API", version="1.0.0")

# CORS — allow all origins for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_analytics(articles: list[dict], topics: list[dict]) -> dict:
    """Build analytics data from articles and topics."""

    # --- Source distribution ---
    source_counts = Counter(a["source"] for a in articles if a.get("source"))
    source_distribution = [
        {"name": name, "count": count}
        for name, count in source_counts.most_common(10)
    ]

    # --- Weekly coverage volume ---
    from datetime import datetime, timedelta
    weekly = Counter()
    for a in articles:
        if not a.get("published_at"):
            continue
        try:
            dt = datetime.fromisoformat(a["published_at"].replace("Z", "+00:00"))
            week_start = dt - timedelta(days=dt.weekday())
            week_key = week_start.strftime("%Y-%m-%d")
            weekly[week_key] += 1
        except Exception:
            continue

    coverage_timeline = [
        {"week": k, "articles": v}
        for k, v in sorted(weekly.items())
    ]

    # --- Topic distribution (for donut chart) ---
    topic_distribution = [
        {"name": t["label"], "value": t["article_count"], "percentage": t["percentage"]}
        for t in topics
    ]

    # --- Top keywords across all topics ---
    all_keywords = []
    for t in topics:
        for kw in t["keywords"]:
            all_keywords.append({"word": kw, "topic": t["label"]})
    keyword_cloud = all_keywords[:30]

    # --- Day-of-week distribution ---
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_counts = Counter()
    for a in articles:
        if not a.get("published_at"):
            continue
        try:
            dt = datetime.fromisoformat(a["published_at"].replace("Z", "+00:00"))
            day_counts[day_names[dt.weekday()]] += 1
        except Exception:
            continue

    day_distribution = [
        {"day": d, "count": day_counts.get(d, 0)}
        for d in day_names
    ]

    # --- Recency score (% of articles in last 7 days) ---
    now = datetime.utcnow()
    recent = 0
    for a in articles:
        if not a.get("published_at"):
            continue
        try:
            dt = datetime.fromisoformat(a["published_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            if (now - dt).days <= 7:
                recent += 1
        except Exception:
            continue
    recency_pct = round((recent / len(articles)) * 100, 1) if articles else 0

    topic_timeline = {}
    for topic in topics:
        label = topic["label"]
        weekly_counts = Counter()
        for article in topic["articles"]:
            if not article.get("published_at"):
                continue
            try:
                # Ensure dt is offset-naive or handle timezones consistently
                dt_str = article["published_at"].replace("Z", "+00:00")
                dt = datetime.fromisoformat(dt_str)
                day_key = dt.strftime("%Y-%m-%d")
                weekly_counts[day_key] += 1
            except Exception:
                continue
        topic_timeline[label] = dict(weekly_counts)

    return {
        "source_distribution": source_distribution,
        "coverage_timeline": coverage_timeline,
        "topic_distribution": topic_distribution,
        "keyword_cloud": keyword_cloud,
        "day_distribution": day_distribution,
        "recency_percentage": recency_pct,
        "unique_sources": len(source_counts),
        "topic_timeline": topic_timeline,        "unique_sources": len(source_counts),
    }


@app.get("/api/politician/{name}")
async def get_politician(name: str):
    """
    Fetch news about a politician and run LDA topic modeling.
    Results are cached for 30 minutes.
    """
    cache_key = f"politician:{name.lower().strip()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    # 1. Fetch articles from Google News RSS
    try:
        articles = await fetch_articles(name)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"News fetch error: {str(e)}")

    if not articles:
        raise HTTPException(
            status_code=404,
            detail=f"No significant coverage found for {name}",
        )

    # 2. Run LDA topic modeling
    loop = asyncio.get_event_loop()
    topics = await loop.run_in_executor(
        None, lambda: run_topic_modeling(articles, n_topics=8, politician_name=name)
    )

    # 3. Compute date range
    dates = [a["published_at"] for a in articles if a.get("published_at")]
    date_from = min(dates) if dates else ""
    date_to = max(dates) if dates else ""

    # 4. Build analytics
    analytics = _build_analytics(articles, topics)

    result = {
        "name": name,
        "articles_count": len(articles),
        "date_range": {"from": date_from, "to": date_to},
        "topics": topics,
        "analytics": analytics,
    }

    # 5. Cache the result
    cache.set(cache_key, result)

    return result


@app.get("/api/compare")
async def compare_politicians(a: str, b: str):
    """Fetch and compare topic distributions for two politicians."""
    if not a or not b:
        raise HTTPException(status_code=400, detail="Both 'a' and 'b' query params are required")

    result_a = await get_politician(a)
    result_b = await get_politician(b)

    return {
        "politician_a": result_a,
        "politician_b": result_b,
    }


@app.get("/api/ticker")
async def get_ticker():
    """Return latest headlines for the animated news ticker."""
    cache_key = "ticker:headlines"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        headlines = await fetch_ticker_headlines(limit=10)
    except Exception:
        headlines = []

    result = {"headlines": headlines}
    cache.set(cache_key, result)
    return result


@app.get("/api/politician-image/{name}")
async def get_politician_image(name: str):
    """
    Fetch politician photo from Wikipedia REST API.
    Returns { image_url: str } or { image_url: null } if not found.
    """
    wiki_name = name.strip().replace(" ", "_")
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_name}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers={"User-Agent": "PolitiScope/1.0"})
            if resp.status_code != 200:
                return {"image_url": None}
            data = resp.json()
            thumbnail = data.get("thumbnail", {})
            image_url = thumbnail.get("source")
            return {"image_url": image_url}
    except Exception:
        return {"image_url": None}