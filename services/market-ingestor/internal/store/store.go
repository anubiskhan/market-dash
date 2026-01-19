package store

import (
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/models"
)

// Store defines the interface for market data storage
type Store interface {
	// SaveDailyBars stores daily bar data
	SaveDailyBars(bars []models.DailyBar) error

	// GetLatestBars returns the most recent bar for each symbol
	GetLatestBars() []models.DailyBar

	// GetTopGainers returns top N stocks by percent change
	GetTopGainers(n int) []models.ScreenerResult

	// GetTopLosers returns bottom N stocks by percent change
	GetTopLosers(n int) []models.ScreenerResult

	// GetMostActive returns top N stocks by volume
	GetMostActive(n int) []models.ScreenerResult

	// GetIndices returns data for major index ETFs
	GetIndices() []models.IndexData

	// GetLastUpdated returns the last update time
	GetLastUpdated() time.Time

	// Close closes any connections (no-op for memory store)
	Close() error
}
