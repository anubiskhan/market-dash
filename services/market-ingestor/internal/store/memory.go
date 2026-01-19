package store

import (
	"sort"
	"sync"
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/models"
)

// MemoryStore provides in-memory storage for market data
// For production, replace with PostgreSQL/TimescaleDB
type MemoryStore struct {
	mu          sync.RWMutex
	dailyBars   map[string][]models.DailyBar // symbol -> bars
	lastUpdated time.Time
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		dailyBars: make(map[string][]models.DailyBar),
	}
}

// SaveDailyBars stores daily bar data
func (s *MemoryStore) SaveDailyBars(bars []models.DailyBar) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, bar := range bars {
		s.dailyBars[bar.Symbol] = append(s.dailyBars[bar.Symbol], bar)
	}
	s.lastUpdated = time.Now()

	return nil
}

// GetLatestBars returns the most recent bar for each symbol
func (s *MemoryStore) GetLatestBars() []models.DailyBar {
	s.mu.RLock()
	defer s.mu.RUnlock()

	bars := make([]models.DailyBar, 0, len(s.dailyBars))
	for _, symbolBars := range s.dailyBars {
		if len(symbolBars) > 0 {
			bars = append(bars, symbolBars[len(symbolBars)-1])
		}
	}

	return bars
}

// GetTopGainers returns top N stocks by percent change
func (s *MemoryStore) GetTopGainers(n int) []models.ScreenerResult {
	bars := s.GetLatestBars()

	sort.Slice(bars, func(i, j int) bool {
		return bars[i].ChangePct > bars[j].ChangePct
	})

	results := make([]models.ScreenerResult, 0, n)
	for i := 0; i < n && i < len(bars); i++ {
		if bars[i].ChangePct > 0 {
			results = append(results, models.ScreenerResult{
				Symbol:    bars[i].Symbol,
				Price:     bars[i].Close,
				Change:    bars[i].Change,
				ChangePct: bars[i].ChangePct,
				Volume:    bars[i].Volume,
			})
		}
	}

	return results
}

// GetTopLosers returns bottom N stocks by percent change
func (s *MemoryStore) GetTopLosers(n int) []models.ScreenerResult {
	bars := s.GetLatestBars()

	sort.Slice(bars, func(i, j int) bool {
		return bars[i].ChangePct < bars[j].ChangePct
	})

	results := make([]models.ScreenerResult, 0, n)
	for i := 0; i < n && i < len(bars); i++ {
		if bars[i].ChangePct < 0 {
			results = append(results, models.ScreenerResult{
				Symbol:    bars[i].Symbol,
				Price:     bars[i].Close,
				Change:    bars[i].Change,
				ChangePct: bars[i].ChangePct,
				Volume:    bars[i].Volume,
			})
		}
	}

	return results
}

// GetMostActive returns top N stocks by volume
func (s *MemoryStore) GetMostActive(n int) []models.ScreenerResult {
	bars := s.GetLatestBars()

	sort.Slice(bars, func(i, j int) bool {
		return bars[i].Volume > bars[j].Volume
	})

	results := make([]models.ScreenerResult, 0, n)
	for i := 0; i < n && i < len(bars); i++ {
		results = append(results, models.ScreenerResult{
			Symbol:    bars[i].Symbol,
			Price:     bars[i].Close,
			Change:    bars[i].Change,
			ChangePct: bars[i].ChangePct,
			Volume:    bars[i].Volume,
		})
	}

	return results
}

// GetIndices returns data for major index ETFs
func (s *MemoryStore) GetIndices() []models.IndexData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	indexSymbols := map[string]string{
		"SPY": "S&P 500",
		"QQQ": "Nasdaq 100",
		"DIA": "Dow Jones",
		"IWM": "Russell 2000",
	}

	indices := make([]models.IndexData, 0, len(indexSymbols))
	for symbol, name := range indexSymbols {
		if bars, ok := s.dailyBars[symbol]; ok && len(bars) > 0 {
			bar := bars[len(bars)-1]
			indices = append(indices, models.IndexData{
				Symbol:    symbol,
				Name:      name,
				Price:     bar.Close,
				Change:    bar.Change,
				ChangePct: bar.ChangePct,
			})
		}
	}

	return indices
}

// GetLastUpdated returns the last update time
func (s *MemoryStore) GetLastUpdated() time.Time {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lastUpdated
}

// Close is a no-op for memory store
func (s *MemoryStore) Close() error {
	return nil
}

// Ensure MemoryStore implements Store interface
var _ Store = (*MemoryStore)(nil)
