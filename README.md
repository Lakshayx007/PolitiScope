# PolitiScope

**Live demo:** [politi-scope.vercel.app](https://politi-scope.vercel.app/)

A political intelligence dashboard that tracks what politicians stand for, using topic analysis over live news coverage.

**Stack:** React + Vite + Tailwind CSS, FastAPI, scikit-learn LDA, Recharts, Google News RSS.

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

No API keys are required. PolitiScope uses free public RSS feeds (Google News) and Wikipedia's REST API, so there's no `.env` to configure.

Backend runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` with an API proxy to the backend.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/politician/{name}` | Fetch news and LDA topic analysis for a politician |
| `GET /api/compare?a={name1}&b={name2}` | Compare two politicians side-by-side |
| `GET /api/ticker` | Latest political headlines for the ticker |
| `GET /api/politician-image/{name}` | Fetch politician headshot from Wikipedia |

---

## Architecture & Data Flow

1. **Aggregation.** The backend makes async HTTP requests to Google News RSS to pull real-time articles for the requested politician.
2. **NLP engine.** TF-IDF vectorization and Latent Dirichlet Allocation (LDA) via `scikit-learn` cluster articles into dominant topics.
3. **Auto-labeling.** Extracted keywords are matched against a taxonomy of political topics (Economy, National Security, Diplomacy, etc.) to label clusters automatically.
4. **Analytics.** Computes metrics including volume over time, source distribution, publication frequency, and recency scores.
5. **Caching.** Results are held in an in-memory TTL cache for 30 minutes to keep loads fast and reduce external API calls.

---

## UI / UX Design

The app uses an editorial aesthetic, drawing inspiration from data-journalism platforms like Bloomberg and FiveThirtyEight.

- **Colors.** A calibrated warm editorial palette over a near-black foundation.
  - Background: `#0D0B08`
  - Deep Card: `#151210`
  - Primary Accent: Burnt Orange `#C8763A`
  - Data Highlights: Warm Gold `#C8A96E`
- **Typography.** `Source Serif 4` for authoritative, newspaper-like headings, `Inter` for body copy and data labels, `JetBrains Mono` for numeric displays.
- **Charts.** A 10-color warm qualitative scale for contrast and accessibility, with rich tooltips and no overlapping labels.
- **Layout.** `rounded-xl` and `rounded-2xl` corners throughout, subtle scale transforms, and coordinated entrance animations on page load.
