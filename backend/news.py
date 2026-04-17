"""Google News RSS client — fetches political news via multiple queries."""

import httpx
import xml.etree.ElementTree as ET
from html import unescape
import re
from email.utils import parsedate_to_datetime

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"


def _clean_html(raw_html: str) -> str:
    clean = re.sub(r"<[^>]+>", "", raw_html)
    return unescape(clean).strip()


def _clean_title(title: str, source: str) -> str:
    if source and title.endswith(f" - {source}"):
        return title[: -(len(source) + 3)].strip()
    return title.strip()


def _parse_pub_date(date_str: str) -> str:
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return date_str


def _build_query_variations(name: str) -> list[str]:
    """
    Build multiple search query variations for the same politician
    to maximize article coverage. Each RSS query returns ~10-20 articles;
    combined across 5 queries gives 60-80 unique articles.
    """
    parts = name.strip().split()
    last_name = parts[-1] if parts else name
    first_name = parts[0] if len(parts) > 1 else ""

    return [
        name,
        f"{name} politics",
        f"{name} government",
        f"{name} speech",
        f"{last_name} India" if first_name else f"{name} news",
    ]


async def _fetch_rss(client: httpx.AsyncClient, query: str) -> list[dict]:
    """Fetch and parse a single Google News RSS feed."""
    params = {
        "q": query,
        "hl": "en-US",
        "gl": "IN",
        "ceid": "IN:en",
    }

    try:
        response = await client.get(GOOGLE_NEWS_RSS, params=params)
        response.raise_for_status()
    except Exception:
        return []

    try:
        root = ET.fromstring(response.text)
    except ET.ParseError:
        return []

    channel = root.find("channel")
    if channel is None:
        return []

    articles = []
    for item in channel.findall("item"):
        title_raw = item.findtext("title", "")
        link = item.findtext("link", "")
        pub_date = item.findtext("pubDate", "")
        description_raw = item.findtext("description", "")
        source_el = item.find("source")
        source_name = source_el.text if source_el is not None else ""

        title = _clean_title(title_raw, source_name)
        description = _clean_html(description_raw)

        if not title or not link:
            continue

        articles.append({
            "title": title,
            "description": description,
            "url": link,
            "image_url": "",
            "source": source_name,
            "published_at": _parse_pub_date(pub_date),
        })

    return articles


async def fetch_articles(name: str, limit: int = 80) -> list[dict]:
    """
    Fetch news articles via multiple Google News RSS queries.
    Deduplicates by URL to maximize unique article count.
    """
    query_variations = _build_query_variations(name)
    seen_urls = set()
    all_articles = []

    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (compatible; PolitiScope/1.0)"},
    ) as client:
        for query in query_variations:
            if len(all_articles) >= limit:
                break
            batch = await _fetch_rss(client, query)
            for article in batch:
                if len(all_articles) >= limit:
                    break
                if article["url"] not in seen_urls:
                    seen_urls.add(article["url"])
                    all_articles.append(article)

    return all_articles


async def fetch_ticker_headlines(limit: int = 10) -> list[dict]:
    """Fetch latest Indian political headlines for the news ticker."""
    params = {
        "q": "India politics",
        "hl": "en-US",
        "gl": "IN",
        "ceid": "IN:en",
    }

    try:
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; PolitiScope/1.0)"},
        ) as client:
            response = await client.get(GOOGLE_NEWS_RSS, params=params)
            response.raise_for_status()
            root = ET.fromstring(response.text)
    except Exception:
        return []

    channel = root.find("channel")
    if channel is None:
        return []

    headlines = []
    for item in channel.findall("item"):
        if len(headlines) >= limit:
            break
        title_raw = item.findtext("title", "")
        link = item.findtext("link", "")
        pub_date = item.findtext("pubDate", "")
        source_el = item.find("source")
        source_name = source_el.text if source_el is not None else ""
        if title_raw:
            headlines.append({
                "title": _clean_title(title_raw, source_name),
                "source": source_name,
                "published_at": _parse_pub_date(pub_date),
                "url": link,
            })

    return headlines