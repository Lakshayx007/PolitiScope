"""NLP pipeline — TF-IDF + LDA with specificity-aware topic labeling."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np

# ---------------------------------------------------------------------------
# HIGH-SPECIFICITY ANCHORS
# If any of these appear in top keywords → assign that label immediately.
# These are proper nouns / unique terms that unambiguously identify a topic.
# ---------------------------------------------------------------------------
SPECIFIC_ANCHORS = {
    "Iran & Middle East": [
        "iran", "tehran", "hormuz", "israel", "gaza", "hamas", "hezbollah",
        "sanctions", "nuclear deal", "middle east", "ceasefire", "lebanon",
        "saudi", "qatar", "yemen", "persian gulf"
    ],
    "State Politics: Kerala": [
        "kerala", "pinarayi", "vijayan", "thiruvananthapuram", "kochi",
        "kozhikode", "ldf", "udf", "dharmadom"
    ],
    "State Politics: Bengal": [
        "bengal", "mamata", "banerjee", "kolkata", "tmc", "trinamool",
        "howrah", "west bengal"
    ],
    "State Politics: UP": [
        "uttar pradesh", "lucknow", "yogi", "adityanath", "varanasi",
        "allahabad", "prayagraj", "agra", "kanpur"
    ],
    "State Politics: Gujarat": [
        "gujarat", "ahmedabad", "surat", "vadodara", "gandhinagar"
    ],
    "State Politics: Maharashtra": [
        "maharashtra", "mumbai", "pune", "nagpur", "thackeray", "shiv sena",
        "ncp", "maha vikas aghadi"
    ],
    "State Politics: Rajasthan": [
        "rajasthan", "jaipur", "gehlot", "pilot", "jodhpur", "udaipur"
    ],
    "State Politics: Bihar": [
        "bihar", "patna", "nitish", "kumar", "tejashwi", "lalu", "prasad"
    ],
    "Agriculture & Farmers": [
        "farmer protest", "msp", "kisan", "farm law", "agricultural",
        "crop failure", "debt waiver", "agri"
    ],
    "Ambedkar & Dalit Issues": [
        "ambedkar", "dalit", "scheduled caste", "atrocity", "sc st",
        "untouchability", "reservation sc"
    ],
    "Trump & US Relations": [
        "trump", "white house", "tariff", "us india", "washington dc",
        "american president", "biden", "harris"
    ],
    "Russia-Ukraine War": [
        "ukraine", "zelensky", "moscow", "putin", "russia ukraine",
        "kyiv", "nato ukraine"
    ],
    "China-India Relations": [
        "doklam", "galwan", "arunachal", "lac standoff", "china border",
        "pla", "sino india"
    ],
    "Pakistan Relations": [
        "islamabad", "imran khan", "shehbaz", "pakistan army", "isi",
        "kashmir pakistan", "cross border"
    ],
    "Cricket & Sports": [
        "ipl", "bcci", "cricket", "virat kohli", "rohit sharma",
        "indian team", "test match", "world cup cricket"
    ],
}

# ---------------------------------------------------------------------------
# GENERAL TOPIC DICTIONARY — used when no specific anchor matches
# ---------------------------------------------------------------------------
GENERAL_LABELS = {
    "Elections & Democracy": [
        "election", "vote", "poll", "ballot", "campaign", "bjp", "congress",
        "aap", "candidate", "rally", "seat", "win", "loss", "assembly",
        "ec", "evm", "manifesto", "coalition", "bypolls", "lok sabha"
    ],
    "National Security": [
        "security", "military", "army", "border", "terror", "attack",
        "defence", "weapon", "soldier", "force", "militant", "naxal",
        "encounter", "bsf", "crpf", "lac", "loc", "maoist", "insurgent"
    ],
    "Economy & Finance": [
        "economy", "gdp", "inflation", "rupee", "budget", "trade", "market",
        "growth", "fiscal", "rbi", "tax", "invest", "crore", "lakh", "bank",
        "loan", "export", "import", "revenue", "deficit", "subsidy", "upi"
    ],
    "Diplomacy & Foreign Policy": [
        "diplomacy", "bilateral", "summit", "g20", "treaty", "ambassador",
        "foreign", "visit", "relation", "talks", "quad", "brics", "sco",
        "asean", "un", "imf", "world bank", "delegation", "geopolitics"
    ],
    "Legal & Governance": [
        "court", "law", "constitution", "police", "justice", "bill",
        "parliament", "arrest", "charge", "case", "crime", "judge",
        "verdict", "cbi", "ed", "fir", "bail", "supreme court", "ordinance"
    ],
    "Social Welfare": [
        "women", "reservation", "quota", "caste", "education", "health",
        "welfare", "scheme", "youth", "student", "poor", "rural", "dalit",
        "obc", "pension", "ration", "ayushman", "tribal", "adivasi"
    ],
    "Communal & Religious": [
        "hindu", "muslim", "mosque", "temple", "riot", "communal",
        "religion", "minority", "cow", "beef", "conversion", "waqf",
        "madrasa", "mandir", "ucc", "ayodhya", "ram"
    ],
    "Infrastructure & Development": [
        "highway", "rail", "project", "development", "energy", "road",
        "build", "power", "airport", "metro", "bridge", "dam", "solar",
        "renewable", "smart city", "expressway", "5g"
    ],
    "Media & Public Image": [
        "media", "interview", "statement", "speech", "viral",
        "controversy", "fake news", "narrative", "press", "twitter"
    ],
    "Health & Environment": [
        "hospital", "disease", "covid", "vaccine", "pollution", "climate",
        "environment", "flood", "drought", "water", "forest", "cancer"
    ],
}

# ---------------------------------------------------------------------------
# Stopwords
# ---------------------------------------------------------------------------
CUSTOM_STOPWORDS = {
    "said", "says", "say", "told", "tell", "asked", "added", "noted",
    "stated", "claimed", "alleged", "reported", "announced", "declared",
    "government", "minister", "political", "party", "india", "indian",
    "pm", "chief", "national", "state", "central", "federal", "leader",
    "leadership", "official", "officials", "administration", "policy",
    "policies", "spokesperson", "press", "conference",
    "also", "would", "could", "new", "year", "time", "day", "week",
    "month", "today", "yesterday", "recently", "latest", "now",
    "earlier", "later", "soon", "ago", "still", "yet",
    "people", "country", "world", "news", "report", "source",
    "issue", "issues", "matter", "situation", "event", "events",
    "move", "step", "way", "part", "place", "point", "level",
    "like", "just", "make", "made", "take", "taken", "given",
    "come", "came", "went", "going", "get", "got",
    "know", "want", "need", "use", "used", "look", "seen",
}


def _auto_label(keywords: list[str], politician_name: str = "") -> str:
    """
    Two-pass labeling:
    Pass 1 — Check for high-specificity anchor terms.
             If found, return specific label immediately.
    Pass 2 — Fall back to general dictionary scoring.
    """
    keyword_words = set()
    keyword_phrases = set()
    for kw in keywords:
        kw_lower = kw.lower()
        keyword_phrases.add(kw_lower)
        for word in kw_lower.split():
            keyword_words.add(word)

    # --- Pass 1: Specificity anchors ---
    anchor_scores = {}
    for label, anchors in SPECIFIC_ANCHORS.items():
        score = 0
        for anchor in anchors:
            if anchor in keyword_phrases:
                score += 4          # exact bigram/phrase = strong signal
            elif anchor in keyword_words:
                score += 2          # single word match
        if score > 0:
            anchor_scores[label] = score

    if anchor_scores:
        best_anchor = max(anchor_scores, key=anchor_scores.get)
        # Only use anchor if score is meaningful (≥2)
        if anchor_scores[best_anchor] >= 2:
            return best_anchor

    # --- Pass 2: General dictionary scoring ---
    general_scores = {}
    for label, label_kws in GENERAL_LABELS.items():
        score = 0
        for lk in label_kws:
            if lk in keyword_phrases:
                score += 3
            elif lk in keyword_words:
                score += 1
        general_scores[label] = score

    best_label = max(general_scores, key=general_scores.get)
    return best_label if general_scores[best_label] >= 2 else "General Politics"


def _merge_same_labels(topics: list[dict]) -> list[dict]:
    """
    Merge all topics sharing the same label into one.
    Combined topic gets all articles + union of top keywords.
    """
    merged: dict[str, dict] = {}
    for t in topics:
        label = t["label"]
        if label not in merged:
            merged[label] = {
                "id": t["id"],
                "label": label,
                "keywords": list(t["keywords"]),
                "article_count": t["article_count"],
                "percentage": 0.0,
                "articles": list(t["articles"]),
                "coherence": t.get("coherence", 0.0),
                "stable": t.get("stable", False),
            }
        else:
            merged[label]["articles"].extend(t["articles"])
            merged[label]["article_count"] += t["article_count"]
            existing = merged[label]["keywords"]
            new_kw = [k for k in t["keywords"] if k not in existing]
            merged[label]["keywords"] = (existing + new_kw)[:15]

    return list(merged.values())


def run_topic_modeling(
    articles: list[dict],
    n_topics: int = 8,
    politician_name: str = "",
) -> list[dict]:
    """
    Run LDA + two-pass labeling.
    Specific topics (Iran, Kerala, Trump etc.) get their own label
    when enough signal is present. Generic topics get merged.
    """
    if not articles:
        return []

    pol_name_words = set(politician_name.lower().split())
    documents = []

    for a in articles:
        text = f"{a.get('title', '')} {a.get('description', '')}".lower()
        words = text.split()
        cleaned = [
            w for w in words
            if w not in CUSTOM_STOPWORDS
            and w not in pol_name_words
            and len(w) > 2
            and not w.isdigit()
        ]
        documents.append(" ".join(cleaned))

    valid_indices = [i for i, d in enumerate(documents) if len(d.split()) > 5]

    if len(valid_indices) < 3:
        return [{
            "id": 0,
            "label": "General Coverage",
            "keywords": [],
            "article_count": len(articles),
            "percentage": 100.0,
            "articles": [
                {
                    "title": a["title"],
                    "url": a["url"],
                    "source": a["source"],
                    "published_at": a["published_at"],
                    "snippet": (a.get("description") or "")[:200],
                    "image_url": a.get("image_url", ""),
                }
                for a in articles
            ],
        }]

    valid_docs = [documents[i] for i in valid_indices]
    valid_articles = [articles[i] for i in valid_indices]

    # 8 LDA topics — specific ones get unique labels,
    # generic ones collapse via merging
    n_topics = min(8, max(2, len(valid_docs) // 4))

    vectorizer = TfidfVectorizer(
        max_df=0.5,
        min_df=2,
        max_features=2000,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True,
    )
    tfidf_matrix = vectorizer.fit_transform(valid_docs)
    feature_names = vectorizer.get_feature_names_out()

    lda = LatentDirichletAllocation(
        n_components=n_topics,
        max_iter=50,
        learning_method="batch",
        random_state=42,
        doc_topic_prior=0.05,
        topic_word_prior=0.005,
    )
    doc_topic_matrix = lda.fit_transform(tfidf_matrix)

    # --- IMPROVEMENT 1: Topic Coherence (optional — requires gensim) ---
    tokenized_docs = [doc.split() for doc in valid_docs]

    topics_words = []
    for topic_idx in range(n_topics):
        top_indices = lda.components_[topic_idx].argsort()[-10:][::-1]
        words = [str(feature_names[i]) for i in top_indices]
        topics_words.append(words)

    coherence_scores = [0.0] * n_topics
    try:
        from gensim.models.coherencemodel import CoherenceModel
        from gensim.corpora import Dictionary

        dictionary = Dictionary(tokenized_docs)
        cm = CoherenceModel(
            topics=topics_words,
            texts=tokenized_docs,
            dictionary=dictionary,
            coherence='c_v'
        )
        coherence_scores = cm.get_coherence_per_topic()
    except Exception:
        # gensim not installed or coherence calc failed — fall back to zeros
        pass

    # --- IMPROVEMENT 5: Topic Stability Badge ---
    lda_check = LatentDirichletAllocation(
        n_components=n_topics,
        max_iter=30,
        learning_method="batch",
        random_state=123,
        doc_topic_prior=0.05,
        topic_word_prior=0.005,
    )
    lda_check.fit(tfidf_matrix)

    check_labels = set()
    for topic_idx in range(n_topics):
        top_indices = lda_check.components_[topic_idx].argsort()[-15:][::-1]
        keywords = [str(feature_names[i]) for i in top_indices]
        check_labels.add(_auto_label(keywords, politician_name))

    topics_dict = []
    primary_labels = []
    for topic_idx in range(n_topics):
        top_indices = lda.components_[topic_idx].argsort()[-15:][::-1]
        keywords = [str(feature_names[i]) for i in top_indices]
        label = _auto_label(keywords, politician_name)
        primary_labels.append(label)

    stable_labels = set(primary_labels).intersection(check_labels)

    for topic_idx in range(n_topics):
        top_indices = lda.components_[topic_idx].argsort()[-15:][::-1]
        keywords = [str(feature_names[i]) for i in top_indices]
        label = _auto_label(keywords, politician_name)
        
        topics_dict.append({
            "id": topic_idx,
            "label": label,
            "keywords": keywords,
            "article_count": 0,
            "percentage": 0.0,
            "articles": [],
            "coherence": round(float(coherence_scores[topic_idx]), 2),
            "stable": label in stable_labels,
        })

    for doc_idx, article in enumerate(valid_articles):
        dominant = int(np.argmax(doc_topic_matrix[doc_idx]))
        topics_dict[dominant]["articles"].append({
            "title": article["title"],
            "url": article["url"],
            "source": article["source"],
            "published_at": article["published_at"],
            "snippet": (article.get("description") or "")[:200],
            "image_url": article.get("image_url", ""),
        })
        topics_dict[dominant]["article_count"] += 1

    # Remove empty
    active_topics = [t for t in topics_dict if t["article_count"] > 0]

    # Merge tiny (<3 articles) into largest
    if len(active_topics) > 1:
        active_topics.sort(key=lambda x: x["article_count"], reverse=True)
        largest = active_topics[0]
        surviving = []
        for t in active_topics:
            if t["article_count"] < 3 and t is not largest:
                largest["articles"].extend(t["articles"])
                largest["article_count"] += t["article_count"]
                merged_kw = list(dict.fromkeys(
                    largest["keywords"] + t["keywords"]
                ))[:15]
                largest["keywords"] = merged_kw
            else:
                surviving.append(t)
        active_topics = surviving

    # Re-label after merging
    for t in active_topics:
        t["label"] = _auto_label(t["keywords"], politician_name)

    # Merge topics with same label
    active_topics = _merge_same_labels(active_topics)

    total = len(valid_articles)
    for t in active_topics:
        t["percentage"] = (
            round((t["article_count"] / total) * 100, 1) if total > 0 else 0.0
        )

    active_topics.sort(key=lambda t: t["article_count"], reverse=True)
    return active_topics