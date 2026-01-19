package store

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresStore provides PostgreSQL storage for market data
type PostgresStore struct {
	pool        *pgxpool.Pool
	logger      *slog.Logger
	lastUpdated time.Time
}

// NewPostgresStore creates a new PostgreSQL store
func NewPostgresStore(ctx context.Context, databaseURL string, logger *slog.Logger) (*PostgresStore, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parsing database URL: %w", err)
	}

	// Connection pool settings
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("creating connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	logger.Info("connected to PostgreSQL")

	return &PostgresStore{
		pool:   pool,
		logger: logger,
	}, nil
}

// SaveDailyBars stores daily bar data using upsert
func (s *PostgresStore) SaveDailyBars(bars []models.DailyBar) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	batch := &pgx.Batch{}

	for _, bar := range bars {
		batch.Queue(`
			INSERT INTO daily_bars (symbol, date, open, high, low, close, volume, vwap, change, change_percent)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (symbol, date) DO UPDATE SET
				open = EXCLUDED.open,
				high = EXCLUDED.high,
				low = EXCLUDED.low,
				close = EXCLUDED.close,
				volume = EXCLUDED.volume,
				vwap = EXCLUDED.vwap,
				change = EXCLUDED.change,
				change_percent = EXCLUDED.change_percent,
				updated_at = NOW()
		`, bar.Symbol, bar.Date, bar.Open, bar.High, bar.Low, bar.Close, bar.Volume, bar.VWAP, bar.Change, bar.ChangePct)
	}

	results := s.pool.SendBatch(ctx, batch)
	defer results.Close()

	for range bars {
		if _, err := results.Exec(); err != nil {
			return fmt.Errorf("executing batch insert: %w", err)
		}
	}

	s.lastUpdated = time.Now()
	s.logger.Info("saved daily bars", "count", len(bars))

	return nil
}

// GetLatestBars returns the most recent bar for each symbol
func (s *PostgresStore) GetLatestBars() []models.DailyBar {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT ON (symbol)
			symbol, date, open, high, low, close, volume,
			COALESCE(vwap, 0), COALESCE(change, 0), COALESCE(change_percent, 0)
		FROM daily_bars
		ORDER BY symbol, date DESC
	`)
	if err != nil {
		s.logger.Error("querying latest bars", "error", err)
		return nil
	}
	defer rows.Close()

	var bars []models.DailyBar
	for rows.Next() {
		var bar models.DailyBar
		if err := rows.Scan(&bar.Symbol, &bar.Date, &bar.Open, &bar.High, &bar.Low, &bar.Close, &bar.Volume, &bar.VWAP, &bar.Change, &bar.ChangePct); err != nil {
			s.logger.Error("scanning row", "error", err)
			continue
		}
		bars = append(bars, bar)
	}

	return bars
}

// GetTopGainers returns top N stocks by percent change
func (s *PostgresStore) GetTopGainers(n int) []models.ScreenerResult {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx, `
		SELECT symbol, close, COALESCE(change, 0), COALESCE(change_percent, 0), volume
		FROM daily_bars
		WHERE date = (SELECT MAX(date) FROM daily_bars)
		  AND change_percent > 0
		ORDER BY change_percent DESC
		LIMIT $1
	`, n)
	if err != nil {
		s.logger.Error("querying top gainers", "error", err)
		return nil
	}
	defer rows.Close()

	return s.scanScreenerResults(rows)
}

// GetTopLosers returns bottom N stocks by percent change
func (s *PostgresStore) GetTopLosers(n int) []models.ScreenerResult {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx, `
		SELECT symbol, close, COALESCE(change, 0), COALESCE(change_percent, 0), volume
		FROM daily_bars
		WHERE date = (SELECT MAX(date) FROM daily_bars)
		  AND change_percent < 0
		ORDER BY change_percent ASC
		LIMIT $1
	`, n)
	if err != nil {
		s.logger.Error("querying top losers", "error", err)
		return nil
	}
	defer rows.Close()

	return s.scanScreenerResults(rows)
}

// GetMostActive returns top N stocks by volume
func (s *PostgresStore) GetMostActive(n int) []models.ScreenerResult {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx, `
		SELECT symbol, close, COALESCE(change, 0), COALESCE(change_percent, 0), volume
		FROM daily_bars
		WHERE date = (SELECT MAX(date) FROM daily_bars)
		ORDER BY volume DESC
		LIMIT $1
	`, n)
	if err != nil {
		s.logger.Error("querying most active", "error", err)
		return nil
	}
	defer rows.Close()

	return s.scanScreenerResults(rows)
}

func (s *PostgresStore) scanScreenerResults(rows pgx.Rows) []models.ScreenerResult {
	var results []models.ScreenerResult
	for rows.Next() {
		var r models.ScreenerResult
		if err := rows.Scan(&r.Symbol, &r.Price, &r.Change, &r.ChangePct, &r.Volume); err != nil {
			s.logger.Error("scanning screener result", "error", err)
			continue
		}
		results = append(results, r)
	}
	return results
}

// GetIndices returns data for major index ETFs
func (s *PostgresStore) GetIndices() []models.IndexData {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexSymbols := map[string]string{
		"SPY": "S&P 500",
		"QQQ": "Nasdaq 100",
		"DIA": "Dow Jones",
		"IWM": "Russell 2000",
	}

	symbols := make([]string, 0, len(indexSymbols))
	for sym := range indexSymbols {
		symbols = append(symbols, sym)
	}

	rows, err := s.pool.Query(ctx, `
		SELECT symbol, close, COALESCE(change, 0), COALESCE(change_percent, 0)
		FROM daily_bars
		WHERE date = (SELECT MAX(date) FROM daily_bars)
		  AND symbol = ANY($1)
	`, symbols)
	if err != nil {
		s.logger.Error("querying indices", "error", err)
		return nil
	}
	defer rows.Close()

	var indices []models.IndexData
	for rows.Next() {
		var idx models.IndexData
		if err := rows.Scan(&idx.Symbol, &idx.Price, &idx.Change, &idx.ChangePct); err != nil {
			s.logger.Error("scanning index", "error", err)
			continue
		}
		idx.Name = indexSymbols[idx.Symbol]
		indices = append(indices, idx)
	}

	return indices
}

// GetLastUpdated returns the last update time
func (s *PostgresStore) GetLastUpdated() time.Time {
	return s.lastUpdated
}

// Close closes the connection pool
func (s *PostgresStore) Close() error {
	s.pool.Close()
	return nil
}

// Ensure PostgresStore implements Store interface
var _ Store = (*PostgresStore)(nil)
