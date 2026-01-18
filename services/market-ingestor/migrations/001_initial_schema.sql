-- Migration: 001_initial_schema.sql
-- Description: Initial schema for market data storage with TimescaleDB support
-- Created: 2025-12-24

-- Enable TimescaleDB extension (optional - comment out if using plain PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =====================================================
-- Table: daily_bars
-- Description: Stores OHLCV (Open, High, Low, Close, Volume) data for stocks
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_bars (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL CHECK (open >= 0),
    high NUMERIC(12, 4) NOT NULL CHECK (high >= 0),
    low NUMERIC(12, 4) NOT NULL CHECK (low >= 0),
    close NUMERIC(12, 4) NOT NULL CHECK (close >= 0),
    volume BIGINT NOT NULL CHECK (volume >= 0),
    vwap NUMERIC(12, 4) CHECK (vwap >= 0),
    change NUMERIC(12, 4),
    change_percent NUMERIC(8, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT daily_bars_symbol_date_unique UNIQUE (symbol, date),
    CONSTRAINT daily_bars_high_low_check CHECK (high >= low)
);

-- Optional: Convert to TimescaleDB hypertable for efficient time-series queries
-- SELECT create_hypertable('daily_bars', 'date', chunk_time_interval => INTERVAL '1 month', if_not_exists => TRUE);

-- =====================================================
-- Indexes for optimal query performance
-- =====================================================

-- Index for querying by symbol (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_daily_bars_symbol
    ON daily_bars (symbol, date DESC);

-- Index for finding top gainers (ordered by change_percent DESC)
CREATE INDEX IF NOT EXISTS idx_daily_bars_gainers
    ON daily_bars (date DESC, change_percent DESC NULLS LAST)
    WHERE change_percent > 0;

-- Index for finding top losers (ordered by change_percent ASC)
CREATE INDEX IF NOT EXISTS idx_daily_bars_losers
    ON daily_bars (date DESC, change_percent ASC NULLS LAST)
    WHERE change_percent < 0;

-- Index for finding most active stocks by volume
CREATE INDEX IF NOT EXISTS idx_daily_bars_volume
    ON daily_bars (date DESC, volume DESC);

-- =====================================================
-- Table: market_indices
-- Description: Stores major market index ETF data (SPY, QQQ, DIA, IWM)
-- =====================================================
CREATE TABLE IF NOT EXISTS market_indices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    price NUMERIC(12, 4) NOT NULL CHECK (price >= 0),
    change NUMERIC(12, 4),
    change_percent NUMERIC(8, 4),
    volume BIGINT CHECK (volume >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT market_indices_symbol_date_unique UNIQUE (symbol, date)
);

-- Index for querying indices by date
CREATE INDEX IF NOT EXISTS idx_market_indices_date
    ON market_indices (date DESC);

-- =====================================================
-- Function to automatically update the updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_daily_bars_updated_at
    BEFORE UPDATE ON daily_bars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_indices_updated_at
    BEFORE UPDATE ON market_indices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Documentation
-- =====================================================
COMMENT ON TABLE daily_bars IS 'Time-series OHLCV market data for individual stocks';
COMMENT ON TABLE market_indices IS 'Major market index ETF data (SPY, QQQ, DIA, IWM)';
COMMENT ON COLUMN daily_bars.symbol IS 'Stock ticker symbol (e.g., AAPL, MSFT)';
COMMENT ON COLUMN daily_bars.vwap IS 'Volume-weighted average price for the day';
COMMENT ON COLUMN daily_bars.change_percent IS 'Percentage change from previous close';
