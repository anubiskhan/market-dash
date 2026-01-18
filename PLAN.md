# Market Dashboard - Implementation Plan

## Executive Summary

A comprehensive stock market dashboard with multiple analysis tools that share a common data layer. The system ingests market data from Polygon.io and options flow data from Unusual Whales API, providing sector analysis, ticker strength rankings, and customizable watchlists.

---

## Current Status (2025-12-24)

### Completed
- [x] API client layer with React Query hooks
- [x] Loading, error, and empty state UI components
- [x] Stock chart components (StockChart, MiniChart)
- [x] Database schema migrations designed
- [x] Dashboard connected to live Polygon API
- [x] Screener connected to live API
- [x] Fixed Polygon API struct parsing (T vs t field conflict)
- [x] Fixed Vite config for path aliases

### In Progress
- [ ] Database persistence (schemas ready, need to wire up services)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MARKET DASHBOARD SUITE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│  │ Options     │   │ Sector      │   │ Strength    │   │ News        │        │
│  │ Flow        │   │ Analyzer    │   │ Analyzer    │   │ Analyzer    │        │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘        │
│         │                 │                 │                 │                │
│         ▼                 ▼                 ▼                 ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         SHARED DATA LAYER                               │  │
│  │  • PostgreSQL (signals, positions, analytics, watchlists)               │  │
│  │  • Redis (real-time pub/sub, caching)                                   │  │
│  │  • TimescaleDB (time-series price/volume data)                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│         │                 │                 │                 │                │
│         ▼                 ▼                 ▼                 ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         API GATEWAY (Hono)                              │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND (React + Vite)                            │  │
│  │  • Dashboard    • Screener    • Sectors    • Watchlists                 │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
market-dash/
├── apps/
│   └── web/                          # React + Vite frontend
├── services/
│   ├── market-ingestor/              # [EXISTS] Go - Polygon.io data ingestion
│   ├── news-analyzer/                # [EXISTS] Python - RSS + sentiment
│   ├── options-flow/                 # [NEW] Python - Options flow analysis
│   ├── sector-analyzer/              # [NEW] Python - Sector SPDR analysis
│   └── strength-analyzer/            # [NEW] Python - Ticker strength rankings
├── workers/
│   └── api-gateway/                  # [EXISTS] Cloudflare Worker + Hono
├── packages/
│   └── shared-types/                 # [NEW] Shared TypeScript types
├── infra/
│   ├── database/
│   └── pulumi/
└── docker-compose.yml
```

---

## Part 1: Options Flow Service

**Location:** `services/options-flow/`

### 1.1 Overview

Ingests options flow data from Unusual Whales API, applies filtering rules, scores signals, and publishes to the shared data layer.

### 1.2 API Integration (Unusual Whales)

```python
# api/client.py
class OptionsFlowClient:
    BASE_URL = "https://api.unusualwhales.com"

    async def get_flow_alerts(self, limit: int = 50) -> List[Dict]:
        """Get recent options flow alerts"""

    async def get_ticker_flow(self, ticker: str) -> Dict:
        """Get flow for specific ticker"""

    async def get_dark_pool(self, limit: int = 50) -> List[Dict]:
        """Get recent dark pool activity"""

    async def get_market_tide(self) -> Dict:
        """Get market sentiment/tide"""
```

### 1.3 Signal Processing Rules

```python
class FlowRules:
    min_premium = 50000          # Minimum premium size
    min_volume_oi_ratio = 1.5    # Volume > OI threshold
    max_dte = 45                 # Maximum days to expiration
    ignore_before = time(9, 45)  # Ignore early noise
    ignore_after = time(15, 45)  # Ignore late activity

    def should_signal(self, flow: dict) -> bool:
        """Apply filtering rules"""

    def calculate_direction(self, flow: dict) -> str:
        """Determine BULLISH/BEARISH based on option type and side"""
```

### 1.4 Directory Structure

```
services/options-flow/
├── src/options_flow/
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   ├── api/
│   │   ├── client.py           # Unusual Whales API client
│   │   └── rate_limiter.py
│   ├── analysis/
│   │   ├── rules.py            # Filtering rules
│   │   ├── scoring.py          # Signal scoring
│   │   └── aggregations.py
│   ├── models/
│   │   ├── signals.py          # Pydantic models
│   │   └── database.py         # SQLAlchemy models
│   └── outputs/
│       ├── base.py             # OutputAdapter ABC
│       ├── database.py
│       └── webhook.py
├── migrations/
├── Dockerfile
├── pyproject.toml
└── README.md
```

---

## Part 2: Sector Analyzer Service

**Location:** `services/sector-analyzer/`

### 2.1 Overview

Analyzes SPDR sector ETFs for rotation signals, relative strength, and volume anomalies.

### 2.2 SPDR Sector ETFs

| Symbol | Sector | Focus |
|--------|--------|-------|
| XLE | Energy | Oil, gas, energy equipment |
| XLK | Technology | Software, hardware, semiconductors |
| XLF | Financials | Banks, insurance, capital markets |
| XLV | Health Care | Pharma, biotech, healthcare providers |
| XLI | Industrials | Aerospace, machinery, transportation |
| XLB | Materials | Chemicals, metals, mining |
| XLP | Consumer Staples | Food, beverages, household products |
| XLY | Consumer Discretionary | Retail, autos, leisure |
| XLU | Utilities | Electric, gas, water utilities |
| XLRE | Real Estate | REITs, real estate services |
| XLC | Communication Services | Media, telecom, entertainment |

### 2.3 Analysis Components

#### Relative Strength
```python
class RelativeStrengthAnalyzer:
    """Compare sector performance vs SPY benchmark"""

    def calculate_rs(self, sector: str, period: int = 20) -> float:
        """
        RS = (Sector % Change) / (SPY % Change)
        RS > 1 = outperforming
        RS < 1 = underperforming
        """

    def rank_sectors(self) -> List[SectorRanking]:
        """Rank all sectors by relative strength"""
```

#### Sector Rotation Detection
```python
class RotationAnalyzer:
    """Detect money flow between sectors"""

    DEFENSIVE = ["XLU", "XLP", "XLV"]      # Risk-off
    CYCLICAL = ["XLY", "XLI", "XLB"]       # Risk-on
    GROWTH = ["XLK", "XLC"]                 # Growth

    def detect_rotation(self) -> RotationSignal:
        """
        Detect rotation patterns:
        - Defensive → Cyclical = Risk-on shift
        - Cyclical → Defensive = Risk-off shift
        - Broad → Narrow = Late cycle
        """

    def get_flow_direction(self) -> str:
        """RISK_ON, RISK_OFF, or NEUTRAL"""
```

#### Volume Analysis
```python
class SectorVolumeAnalyzer:
    """Detect unusual volume in sector ETFs"""

    def calculate_volume_ratio(self, sector: str) -> float:
        """Today's volume / 20-day average volume"""

    def detect_anomalies(self, threshold: float = 1.5) -> List[VolumeAnomaly]:
        """Flag sectors with unusual volume"""

    def get_money_flow(self) -> Dict[str, float]:
        """Estimate money flow into/out of each sector"""
```

### 2.4 API Endpoints

```
GET /api/v1/sectors                    # All sector data
GET /api/v1/sectors/rankings           # Relative strength rankings
GET /api/v1/sectors/rotation           # Current rotation signal
GET /api/v1/sectors/{symbol}           # Single sector details
GET /api/v1/sectors/{symbol}/history   # Historical data
GET /api/v1/sectors/volume-anomalies   # Unusual volume alerts
```

### 2.5 Directory Structure

```
services/sector-analyzer/
├── src/sector_analyzer/
│   ├── __init__.py
│   ├── main.py
│   ├── analyzers/
│   │   ├── relative_strength.py
│   │   ├── rotation.py
│   │   └── volume.py
│   ├── models/
│   │   ├── sector.py
│   │   └── signals.py
│   └── data/
│       └── polygon_client.py
├── migrations/
├── Dockerfile
└── pyproject.toml
```

---

## Part 3: Strength Analyzer Service

**Location:** `services/strength-analyzer/`

### 3.1 Overview

Calculates strength scores for all tickers ingested from Polygon, enabling ranking and filtering by multiple technical factors.

### 3.2 Strength Metrics

```python
class StrengthCalculator:
    """Calculate composite strength score for tickers"""

    def calculate_strength(self, ticker: str) -> StrengthScore:
        """
        Composite score (0-100) based on:
        - Price momentum (% change over periods)
        - Relative strength vs SPY
        - Volume trends
        - Distance from 52-week high/low
        - Moving average alignment
        """

    def get_component_scores(self, ticker: str) -> Dict[str, float]:
        return {
            "momentum_1d": self._momentum(ticker, 1),
            "momentum_5d": self._momentum(ticker, 5),
            "momentum_20d": self._momentum(ticker, 20),
            "rs_vs_spy": self._relative_strength(ticker),
            "volume_trend": self._volume_trend(ticker),
            "ma_alignment": self._ma_alignment(ticker),
            "high_low_position": self._hl_position(ticker),
        }
```

### 3.3 Ranking System

```python
class StrengthRanker:
    """Rank all tickers by strength"""

    async def rank_all(self) -> List[TickerRanking]:
        """Rank all tickers from strongest to weakest"""

    async def get_top_n(self, n: int = 20) -> List[TickerRanking]:
        """Get top N strongest tickers"""

    async def get_bottom_n(self, n: int = 20) -> List[TickerRanking]:
        """Get bottom N weakest tickers"""

    async def get_rank(self, ticker: str) -> TickerRanking:
        """Get rank for specific ticker"""
```

### 3.4 Batch Processing

```python
class BatchAnalyzer:
    """Process all tickers from Polygon data"""

    async def analyze_all(self) -> AnalysisResult:
        """
        Run strength analysis on all ingested tickers.
        Called after market-ingestor updates daily data.
        """

    async def analyze_list(self, tickers: List[str]) -> List[StrengthScore]:
        """Analyze specific list of tickers"""
```

### 3.5 API Endpoints

```
GET /api/v1/strength/rankings              # All tickers ranked
GET /api/v1/strength/top?n=20              # Top N strongest
GET /api/v1/strength/bottom?n=20           # Bottom N weakest
GET /api/v1/strength/{ticker}              # Single ticker strength
POST /api/v1/strength/batch                # Analyze list of tickers
GET /api/v1/strength/history/{ticker}      # Historical strength
```

### 3.6 Directory Structure

```
services/strength-analyzer/
├── src/strength_analyzer/
│   ├── __init__.py
│   ├── main.py
│   ├── calculator/
│   │   ├── strength.py
│   │   ├── momentum.py
│   │   ├── volume.py
│   │   └── moving_averages.py
│   ├── ranker/
│   │   └── ranker.py
│   ├── batch/
│   │   └── processor.py
│   └── models/
│       └── strength.py
├── migrations/
├── Dockerfile
└── pyproject.toml
```

---

## Part 4: Watchlist Feature

### 4.1 Overview

Allow users to create custom watchlists (e.g., current holdings) and view strength/analytics for those specific tickers.

### 4.2 Database Schema

```sql
-- Watchlists table
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist items
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(watchlist_id, ticker)
);

-- Indexes
CREATE INDEX idx_watchlist_items_ticker ON watchlist_items(ticker);
```

### 4.3 API Endpoints (API Gateway)

```
# Watchlist CRUD
GET    /api/v1/watchlists                      # List all watchlists
POST   /api/v1/watchlists                      # Create watchlist
GET    /api/v1/watchlists/{id}                 # Get watchlist
PUT    /api/v1/watchlists/{id}                 # Update watchlist
DELETE /api/v1/watchlists/{id}                 # Delete watchlist

# Watchlist items
GET    /api/v1/watchlists/{id}/items           # Get items in watchlist
POST   /api/v1/watchlists/{id}/items           # Add ticker to watchlist
DELETE /api/v1/watchlists/{id}/items/{ticker}  # Remove ticker

# Watchlist analytics (aggregates from strength-analyzer)
GET    /api/v1/watchlists/{id}/strength        # Strength scores for all items
GET    /api/v1/watchlists/{id}/summary         # Summary stats for watchlist
```

### 4.4 Frontend Components

```typescript
// Watchlist management
<WatchlistSelector />      // Dropdown to select/create watchlists
<WatchlistEditor />        // Add/remove tickers
<WatchlistTable />         // Table view with strength data

// Dashboard integration
<WatchlistWidget />        // Quick view of selected watchlist
<WatchlistStrength />      // Strength chart for watchlist items
```

---

## Part 5: Frontend Updates

### 5.1 New Pages

| Page | Route | Purpose |
|------|-------|---------|
| Sectors | `/sectors` | Sector rotation dashboard |
| Strength | `/strength` | Ticker strength rankings |
| Watchlists | `/watchlists` | Manage watchlists |
| Watchlist Detail | `/watchlists/:id` | View specific watchlist |

### 5.2 Sectors Page

```typescript
// pages/Sectors.tsx
- Sector performance grid (all 11 SPDRs)
- Relative strength chart
- Rotation indicator (Risk-On / Risk-Off / Neutral)
- Volume anomaly alerts
- Historical rotation patterns
```

### 5.3 Strength Page

```typescript
// pages/Strength.tsx
- Top 20 strongest tickers table
- Bottom 20 weakest tickers table
- Search/filter by ticker
- Strength score breakdown (expandable rows)
- Time period selector (1D, 5D, 20D, 60D)
```

### 5.4 Watchlist Page

```typescript
// pages/Watchlists.tsx
- List of user watchlists
- Create new watchlist button
- Quick stats for each watchlist

// pages/WatchlistDetail.tsx
- Watchlist items with strength scores
- Add ticker input
- Bulk import (paste list)
- Export to CSV
- Comparison charts
```

### 5.5 Dashboard Updates

```typescript
// Enhanced Dashboard
- Add sector rotation widget
- Add "Top Movers from Watchlist" widget
- Add quick watchlist strength summary
```

---

## Part 6: Shared Data Layer

### 6.1 PostgreSQL Schema Updates

```sql
-- Unified signals table (all services write here)
CREATE TABLE signals (
    id UUID PRIMARY KEY,
    source VARCHAR(50) NOT NULL,        -- options_flow, sector, strength, news
    timestamp TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(10),
    direction VARCHAR(20),              -- bullish, bearish, neutral
    strength INTEGER,                   -- 1-4
    confidence FLOAT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sector data
CREATE TABLE sector_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(10,2),
    change_percent DECIMAL(6,2),
    volume BIGINT,
    relative_strength DECIMAL(6,3),
    volume_ratio DECIMAL(6,2),
    UNIQUE(symbol, date)
);

-- Strength scores
CREATE TABLE strength_scores (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    composite_score DECIMAL(5,2),
    momentum_1d DECIMAL(6,2),
    momentum_5d DECIMAL(6,2),
    momentum_20d DECIMAL(6,2),
    rs_vs_spy DECIMAL(6,3),
    volume_trend DECIMAL(6,2),
    ma_alignment DECIMAL(5,2),
    rank INTEGER,
    UNIQUE(ticker, date)
);

-- Indexes
CREATE INDEX idx_signals_source_time ON signals(source, timestamp);
CREATE INDEX idx_signals_ticker ON signals(ticker);
CREATE INDEX idx_sector_data_date ON sector_data(date);
CREATE INDEX idx_strength_scores_rank ON strength_scores(date, rank);
CREATE INDEX idx_strength_scores_ticker ON strength_scores(ticker, date);
```

### 6.2 Redis Usage

```
# Caching
cache:sector:rankings          # Current sector rankings (TTL: 5min)
cache:strength:top20           # Top 20 strongest (TTL: 5min)
cache:strength:{ticker}        # Individual ticker (TTL: 1min)

# Pub/Sub channels
signals:options_flow           # New options flow signals
signals:sector                 # Sector rotation alerts
signals:strength               # Strength breakouts
```

---

## Part 7: API Gateway Updates

### 7.1 New Routes

```typescript
// workers/api-gateway/src/index.ts

// Existing
app.route('/api/market/*')     // → market-ingestor
app.route('/api/news/*')       // → news-analyzer

// New
app.route('/api/options/*')    // → options-flow service
app.route('/api/sectors/*')    // → sector-analyzer service
app.route('/api/strength/*')   // → strength-analyzer service
app.route('/api/watchlists/*') // → API gateway handles directly (D1)
```

---

## Part 8: Docker Compose Updates

```yaml
# docker-compose.yml additions

services:
  # ... existing services ...

  options-flow:
    build: ./services/options-flow
    ports:
      - "8082:8082"
    environment:
      - UW_API_KEY=${UW_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  sector-analyzer:
    build: ./services/sector-analyzer
    ports:
      - "8083:8083"
    environment:
      - POLYGON_API_KEY=${POLYGON_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  strength-analyzer:
    build: ./services/strength-analyzer
    ports:
      - "8084:8084"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=marketdash
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Part 9: Environment Variables

```bash
# .env.example additions

# Options Flow (Unusual Whales)
UW_API_KEY=your_unusual_whales_api_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketdash
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://localhost:6379
```

---

## Part 10: Implementation Phases

### Phase 1: Infrastructure (Current Sprint)
- [x] Set up project structure
- [x] Market ingestor (Polygon.io)
- [x] News analyzer (RSS + FinBERT)
- [x] API gateway
- [x] Frontend dashboard & screener
- [ ] Wire PostgreSQL to existing services
- [ ] Add Redis to stack

### Phase 2: Sector Analysis
- [ ] Create sector-analyzer service
- [ ] Implement relative strength calculation
- [ ] Implement rotation detection
- [ ] Implement volume analysis
- [ ] Add sector API endpoints
- [ ] Create Sectors frontend page

### Phase 3: Strength Analysis
- [ ] Create strength-analyzer service
- [ ] Implement strength calculation
- [ ] Implement batch processing
- [ ] Implement ranking system
- [ ] Add strength API endpoints
- [ ] Create Strength frontend page

### Phase 4: Watchlists
- [ ] Add watchlist tables to database
- [ ] Implement watchlist CRUD in API gateway
- [ ] Create watchlist frontend components
- [ ] Integrate with strength analyzer
- [ ] Add watchlist widgets to dashboard

### Phase 5: Options Flow
- [ ] Create options-flow service
- [ ] Implement Unusual Whales API client
- [ ] Implement signal filtering rules
- [ ] Add options flow API endpoints
- [ ] Create Options Flow frontend page

---

## Running Locally

```bash
# Start all services
docker-compose up -d

# Start API Gateway (development)
cd workers/api-gateway && pnpm dev

# Start Frontend (development)
cd apps/web && pnpm dev

# Access at http://localhost:3000
```

---

## Port Assignments

| Service | Port |
|---------|------|
| Frontend (Vite) | 3000 |
| API Gateway | 8787 |
| Market Ingestor | 8080 |
| News Analyzer | 8081 |
| Options Flow | 8082 |
| Sector Analyzer | 8083 |
| Strength Analyzer | 8084 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Data Sources

| Source | Data | Update Frequency |
|--------|------|------------------|
| Polygon.io | Price, volume, OHLCV | EOD / Real-time |
| Unusual Whales | Options flow, dark pool | Real-time |
| RSS Feeds | News articles | 15 minutes |
| FinBERT | Sentiment analysis | On-demand |

---

*Last updated: January 2025*
