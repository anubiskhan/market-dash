# Market Dash

Stock market analytics and display platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────┐        │
│  │ Pages (React)│────▶│ Workers (API)│────▶│  D1 + KV │        │
│  └──────────────┘     └──────────────┘     └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FLY.IO                                     │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │   Market Ingestor (Go) │    │   News Analyzer (Py)   │      │
│  └────────────────────────┘    └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Go 1.22+
- Python 3.12+
- Docker (optional)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env and add your POLYGON_API_KEY

# Start frontend dev server
pnpm dev

# In another terminal, start the API gateway
pnpm dev:worker
```

### Running Backend Services

#### With Docker

```bash
docker compose up
```

#### Without Docker

```bash
# Market ingestor (Go)
cd services/market-ingestor
go run .

# News analyzer (Python)
cd services/news-analyzer
pip install -e .
python -m uvicorn news_analyzer.main:app --reload --port 8081
```

## Project Structure

```
market-dash/
├── apps/
│   └── web/                 # Vite + React frontend
├── services/
│   ├── market-ingestor/     # Go - EOD data ingestion
│   └── news-analyzer/       # Python - News + sentiment
├── workers/
│   └── api-gateway/         # Cloudflare Worker
├── infra/
│   └── pulumi/              # Infrastructure as Code
└── docker-compose.yml       # Local development
```

## API Endpoints

### API Gateway (port 8787)

- `GET /api/dashboard` - Aggregated dashboard data
- `GET /api/market/summary` - Market summary
- `GET /api/market/indices` - Index ETF data
- `GET /api/market/gainers` - Top gainers
- `GET /api/market/losers` - Top losers
- `GET /api/news` - Latest news
- `GET /api/news/summary` - News with sentiment

### Market Ingestor (port 8080)

- `GET /api/v1/summary` - Full market summary
- `GET /api/v1/indices` - Index ETF data
- `GET /api/v1/gainers` - Top gaining stocks
- `GET /api/v1/losers` - Top losing stocks
- `GET /api/v1/active` - Most active by volume

### News Analyzer (port 8081)

- `GET /api/v1/news` - Latest articles
- `GET /api/v1/news/summary` - Aggregated sentiment
- `GET /api/v1/news/ticker/{ticker}` - News for ticker
- `POST /api/v1/news/refresh` - Force refresh

## License

MIT
