-- Migration: 001_initial_schema.sql
-- Description: Initial schema for news and sentiment data storage
-- Created: 2025-12-24

-- =====================================================
-- Table: articles
-- Description: Stores news articles from RSS feeds
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL UNIQUE,
    source VARCHAR(100) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_published
    ON articles (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_source
    ON articles (source, published_at DESC);

-- Full-text search index on title and summary
CREATE INDEX IF NOT EXISTS idx_articles_search
    ON articles USING GIN (to_tsvector('english', title || ' ' || COALESCE(summary, '')));

-- =====================================================
-- Table: article_tickers
-- Description: Many-to-many relationship between articles and stock tickers
-- =====================================================
CREATE TABLE IF NOT EXISTS article_tickers (
    id BIGSERIAL PRIMARY KEY,
    article_id VARCHAR(64) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT article_tickers_unique UNIQUE (article_id, ticker)
);

-- Indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_article_tickers_ticker
    ON article_tickers (ticker, created_at DESC);

-- =====================================================
-- Table: article_sentiment
-- Description: Sentiment analysis results for articles
-- =====================================================
CREATE TABLE IF NOT EXISTS article_sentiment (
    id BIGSERIAL PRIMARY KEY,
    article_id VARCHAR(64) NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
    positive NUMERIC(5, 4) CHECK (positive >= 0 AND positive <= 1),
    negative NUMERIC(5, 4) CHECK (negative >= 0 AND negative <= 1),
    neutral NUMERIC(5, 4) CHECK (neutral >= 0 AND neutral <= 1),
    label VARCHAR(20) NOT NULL CHECK (label IN ('positive', 'negative', 'neutral')),
    score NUMERIC(6, 4) NOT NULL,
    model_version VARCHAR(100) DEFAULT 'ProsusAI/finbert',
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying sentiment by label
CREATE INDEX IF NOT EXISTS idx_article_sentiment_label
    ON article_sentiment (label, analyzed_at DESC);

-- =====================================================
-- Table: sentiment_summary
-- Description: Aggregated sentiment metrics by date
-- =====================================================
CREATE TABLE IF NOT EXISTS sentiment_summary (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    ticker VARCHAR(10),
    positive_count INT NOT NULL DEFAULT 0,
    negative_count INT NOT NULL DEFAULT 0,
    neutral_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    avg_score NUMERIC(6, 4),
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sentiment_summary_date_ticker_unique UNIQUE (date, ticker)
);

-- Indexes for querying summaries
CREATE INDEX IF NOT EXISTS idx_sentiment_summary_date
    ON sentiment_summary (date DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_summary_ticker
    ON sentiment_summary (ticker, date DESC);

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

-- Triggers
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentiment_summary_updated_at
    BEFORE UPDATE ON sentiment_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Documentation
-- =====================================================
COMMENT ON TABLE articles IS 'News articles aggregated from RSS feeds';
COMMENT ON TABLE article_tickers IS 'Many-to-many relationship between articles and stock tickers';
COMMENT ON TABLE article_sentiment IS 'Sentiment analysis results using FinBERT model';
COMMENT ON TABLE sentiment_summary IS 'Daily aggregated sentiment metrics by ticker';
