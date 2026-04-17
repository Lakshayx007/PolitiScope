# PolitiScope — Political Intelligence Dashboard

A full-stack political intelligence web application that tracks what politicians stand for through AI-powered topic analysis of global news coverage.

**Stack:** React + Vite + Tailwind CSS • FastAPI • scikit-learn LDA • Recharts • Google News RSS

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

No API keys are required! PolitiScope uses free public RSS feeds (Google News) and Wikipedia's REST API. No `.env` configuration is needed.

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

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
| `GET /api/politician/{name}` | Fetch news + LDA topic analysis for a politician |
| `GET /api/compare?a={name1}&b={name2}` | Compare two politicians side-by-side |
| `GET /api/ticker` | Get latest political headlines for the ticker |
| `GET /api/politician-image/{name}` | Fetch politician headshot from Wikipedia |

---

## Architecture & Data Flow

1. **Aggregation**: The backend makes async HTTP requests to Google News RSS to pull real-time articles for the requested politician.
2. **NLP Engine**: Uses TF-IDF vectorization and Latent Dirichlet Allocation (LDA) via `scikit-learn` to cluster articles into 6 dominant topics.
3. **Auto-labeling**: Extracted keywords are matched against a taxonomy of political topics (Economy, National Security, Diplomacy, etc.) to automatically label clusters.
4. **Analytics Generation**: Computes metrics including volume over time, source distribution, publication frequency, and recency scores.
5. **Caching**: Results are held in an in-memory TTL cache for 30 minutes to ensure fast loading and reduce external API calls.

---

## UI / UX Design System

The application uses a sophisticated **Editorial** aesthetic, drawing inspiration from premium data-journalism platforms (like Bloomberg and FiveThirtyEight).

- **Colors**: A highly calibrated "Warm Editorial" palette over a near-black foundation.
  - Background: `#0D0B08`
  - Deep Card: `#151210`
  - Primary Accent: Burnt Orange `#C8763A`
  - Data Highlights: Warm Gold `#C8A96E`.
- **Typography**: `Source Serif 4` for authoritative, newspaper-like headings, balanced by `Inter` for highly legible data labels and body copy. `JetBrains Mono` handles quantitative numeric displays.
- **Charts**: Comprehensive data visualizations avoiding monotonous palettes — using a 10-color warm qualitative scale for strong contrast and accessibility. No overlapping labels, rich tooltips.
- **Cards & Layout**: Organic, organic feel utilizing heavy use of modern `rounded-xl` and `rounded-2xl` corners to eliminate rigid "boxiness." Subtle scale transforms and entrance animations coordinate page loads.

---

*Architected and developed by Lakshay Malik — MBA Business Analytics*
