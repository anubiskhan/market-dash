# Market Dash Database Setup

## Overview

Market Dash uses PostgreSQL databases for persistent storage:
- **Market Ingestor**: Stores OHLCV market data (optionally with TimescaleDB)
- **News Analyzer**: Stores news articles and sentiment analysis

## Quick Start

### 1. Add PostgreSQL to docker-compose.yml

```yaml
services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_USER: marketdash
      POSTGRES_PASSWORD: marketdash
      POSTGRES_DB: marketdash
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Run Migrations

```bash
# Market Ingestor
psql -h localhost -U marketdash -d marketdash \
  -f services/market-ingestor/migrations/001_initial_schema.sql

# News Analyzer
psql -h localhost -U marketdash -d marketdash \
  -f services/news-analyzer/migrations/001_initial_schema.sql
```

### 3. Update Environment Variables

```env
DATABASE_URL=postgres://marketdash:marketdash@localhost:5432/marketdash
```

## Schema Overview

### Market Ingestor Tables
- `daily_bars` - OHLCV stock data with change percentages
- `market_indices` - Index ETF data (SPY, QQQ, DIA, IWM)

### News Analyzer Tables
- `articles` - News articles from RSS feeds
- `article_tickers` - Article-to-ticker relationships
- `article_sentiment` - FinBERT sentiment scores
- `sentiment_summary` - Daily aggregated sentiment

## Performance Tips

1. Enable TimescaleDB for `daily_bars` if storing historical data
2. Run `ANALYZE` after bulk inserts
3. Consider partitioning for large datasets
