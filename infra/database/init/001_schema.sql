-- Market Dashboard Database Schema
-- Version: 1.0.0
-- Compatible with: PostgreSQL 15+

-- =====================================================
-- CORE MARKET DATA
-- =====================================================

-- Daily OHLCV bars for all stocks
CREATE TABLE IF NOT EXISTS daily_bars (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    vwap NUMERIC(12, 4),
    change NUMERIC(12, 4),
    change_percent NUMERIC(8, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT daily_bars_symbol_date_unique UNIQUE (symbol, date),
    CONSTRAINT daily_bars_high_low_check CHECK (high >= low)
);

-- Indexes for common query patterns
CREATE INDEX idx_daily_bars_symbol ON daily_bars (symbol, date DESC);
CREATE INDEX idx_daily_bars_date ON daily_bars (date DESC);
CREATE INDEX idx_daily_bars_gainers ON daily_bars (date DESC, change_percent DESC NULLS LAST) WHERE change_percent > 0;
CREATE INDEX idx_daily_bars_losers ON daily_bars (date DESC, change_percent ASC NULLS LAST) WHERE change_percent < 0;
CREATE INDEX idx_daily_bars_volume ON daily_bars (date DESC, volume DESC);

-- Market indices (SPY, QQQ, DIA, IWM)
CREATE TABLE IF NOT EXISTS market_indices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    price NUMERIC(12, 4) NOT NULL,
    change NUMERIC(12, 4),
    change_percent NUMERIC(8, 4),
    volume BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT market_indices_symbol_date_unique UNIQUE (symbol, date)
);

CREATE INDEX idx_market_indices_date ON market_indices (date DESC);

-- =====================================================
-- SECTOR ANALYSIS
-- =====================================================

-- Sector ETF data (XLE, XLK, XLF, etc.)
CREATE TABLE IF NOT EXISTS sector_data (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(12, 4),
    high NUMERIC(12, 4),
    low NUMERIC(12, 4),
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT,
    change_percent NUMERIC(8, 4),
    relative_strength NUMERIC(8, 4),  -- vs SPY
    volume_ratio NUMERIC(8, 4),       -- vs 20-day avg
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sector_data_symbol_date_unique UNIQUE (symbol, date)
);

CREATE INDEX idx_sector_data_date ON sector_data (date DESC);
CREATE INDEX idx_sector_data_rs ON sector_data (date DESC, relative_strength DESC NULLS LAST);

-- Sector rotation signals
CREATE TABLE IF NOT EXISTS sector_rotation (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    signal VARCHAR(20) NOT NULL,  -- RISK_ON, RISK_OFF, NEUTRAL
    leading_sectors JSONB,        -- Array of leading sector symbols
    lagging_sectors JSONB,        -- Array of lagging sector symbols
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STRENGTH ANALYSIS
-- =====================================================

-- Daily strength scores for all tickers
CREATE TABLE IF NOT EXISTS strength_scores (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    composite_score NUMERIC(5, 2) NOT NULL,  -- 0-100
    momentum_1d NUMERIC(8, 4),
    momentum_5d NUMERIC(8, 4),
    momentum_20d NUMERIC(8, 4),
    rs_vs_spy NUMERIC(8, 4),
    volume_trend NUMERIC(8, 4),
    ma_alignment NUMERIC(5, 2),
    high_low_position NUMERIC(5, 2),  -- 0-100, position within 52wk range
    rank INTEGER,
    total_ranked INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT strength_scores_ticker_date_unique UNIQUE (ticker, date)
);

CREATE INDEX idx_strength_scores_date_rank ON strength_scores (date DESC, rank ASC);
CREATE INDEX idx_strength_scores_ticker ON strength_scores (ticker, date DESC);
CREATE INDEX idx_strength_scores_composite ON strength_scores (date DESC, composite_score DESC);

-- =====================================================
-- WATCHLISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    notes TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT watchlist_items_unique UNIQUE (watchlist_id, ticker)
);

CREATE INDEX idx_watchlist_items_ticker ON watchlist_items (ticker);
CREATE INDEX idx_watchlist_items_watchlist ON watchlist_items (watchlist_id);

-- =====================================================
-- SIGNALS (Unified for all tools)
-- =====================================================

CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,  -- options_flow, sector, strength, news
    timestamp TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(10),
    direction VARCHAR(20),        -- bullish, bearish, neutral
    strength INTEGER CHECK (strength BETWEEN 1 AND 4),
    confidence NUMERIC(5, 4),     -- 0.0000 to 1.0000
    tags JSONB DEFAULT '[]',
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_source_time ON signals (source, timestamp DESC);
CREATE INDEX idx_signals_ticker ON signals (ticker, timestamp DESC);
CREATE INDEX idx_signals_timestamp ON signals (timestamp DESC);

-- =====================================================
-- NEWS & SENTIMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(64) PRIMARY KEY,  -- MD5 hash of URL
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL UNIQUE,
    source VARCHAR(100),
    published_at TIMESTAMPTZ,
    tickers JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_published ON articles (published_at DESC);
CREATE INDEX idx_articles_source ON articles (source, published_at DESC);

-- Full-text search on articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))) STORED;
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS article_sentiment (
    id BIGSERIAL PRIMARY KEY,
    article_id VARCHAR(64) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    sentiment VARCHAR(20) NOT NULL,  -- positive, negative, neutral
    score NUMERIC(5, 4),             -- -1.0 to 1.0
    positive_prob NUMERIC(5, 4),
    negative_prob NUMERIC(5, 4),
    neutral_prob NUMERIC(5, 4),
    model_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT article_sentiment_unique UNIQUE (article_id)
);

-- =====================================================
-- OPTIONS FLOW (Future)
-- =====================================================

CREATE TABLE IF NOT EXISTS options_flow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    expiration DATE NOT NULL,
    strike NUMERIC(12, 2) NOT NULL,
    option_type VARCHAR(4) NOT NULL,  -- CALL, PUT
    side VARCHAR(4),                  -- BID, ASK, MID
    trade_type VARCHAR(20),           -- SWEEP, BLOCK, SPLIT
    premium NUMERIC(14, 2) NOT NULL,
    volume INTEGER NOT NULL,
    open_interest INTEGER,
    dte INTEGER,
    direction VARCHAR(10),            -- BULLISH, BEARISH
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_options_flow_timestamp ON options_flow (timestamp DESC);
CREATE INDEX idx_options_flow_ticker ON options_flow (ticker, timestamp DESC);
CREATE INDEX idx_options_flow_premium ON options_flow (timestamp DESC, premium DESC);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER tr_daily_bars_updated_at
    BEFORE UPDATE ON daily_bars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_market_indices_updated_at
    BEFORE UPDATE ON market_indices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_sector_data_updated_at
    BEFORE UPDATE ON sector_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default watchlist
INSERT INTO watchlists (name, description)
VALUES ('My Holdings', 'Track your current stock holdings')
ON CONFLICT DO NOTHING;

-- Seed sector ETF metadata
INSERT INTO sector_data (symbol, name, date, close) VALUES
    ('XLE', 'Energy Select Sector', CURRENT_DATE, 0),
    ('XLK', 'Technology Select Sector', CURRENT_DATE, 0),
    ('XLF', 'Financial Select Sector', CURRENT_DATE, 0),
    ('XLV', 'Health Care Select Sector', CURRENT_DATE, 0),
    ('XLI', 'Industrial Select Sector', CURRENT_DATE, 0),
    ('XLB', 'Materials Select Sector', CURRENT_DATE, 0),
    ('XLP', 'Consumer Staples Select Sector', CURRENT_DATE, 0),
    ('XLY', 'Consumer Discretionary Select Sector', CURRENT_DATE, 0),
    ('XLU', 'Utilities Select Sector', CURRENT_DATE, 0),
    ('XLRE', 'Real Estate Select Sector', CURRENT_DATE, 0),
    ('XLC', 'Communication Services Select Sector', CURRENT_DATE, 0)
ON CONFLICT (symbol, date) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE daily_bars IS 'OHLCV time-series data for all stocks from Polygon.io';
COMMENT ON TABLE market_indices IS 'Major market index ETFs (SPY, QQQ, DIA, IWM)';
COMMENT ON TABLE sector_data IS 'SPDR sector ETF data with relative strength metrics';
COMMENT ON TABLE strength_scores IS 'Daily composite strength scores for ticker ranking';
COMMENT ON TABLE watchlists IS 'User-created watchlists for tracking specific tickers';
COMMENT ON TABLE signals IS 'Unified signals from all analysis tools';
COMMENT ON TABLE articles IS 'News articles from RSS feeds';
COMMENT ON TABLE options_flow IS 'Options flow data from Unusual Whales API';
