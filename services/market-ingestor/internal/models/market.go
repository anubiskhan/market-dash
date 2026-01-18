package models

import "time"

// DailyBar represents OHLCV data for a single trading day
type DailyBar struct {
	Symbol    string    `json:"symbol"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    int64     `json:"volume"`
	VWAP      float64   `json:"vwap"`
	Date      time.Time `json:"date"`
	Change    float64   `json:"change"`
	ChangePct float64   `json:"change_pct"`
}

// IndexData represents major index ETF data
type IndexData struct {
	Symbol    string  `json:"symbol"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Change    float64 `json:"change"`
	ChangePct float64 `json:"change_pct"`
}

// ScreenerResult represents a stock that matches screening criteria
type ScreenerResult struct {
	Symbol      string  `json:"symbol"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Change      float64 `json:"change"`
	ChangePct   float64 `json:"change_pct"`
	Volume      int64   `json:"volume"`
	AvgVolume   int64   `json:"avg_volume"`
	VolumeRatio float64 `json:"volume_ratio"`
}

// MarketSummary contains aggregated market data
type MarketSummary struct {
	Date       time.Time       `json:"date"`
	Indices    []IndexData     `json:"indices"`
	TopGainers []ScreenerResult `json:"top_gainers"`
	TopLosers  []ScreenerResult `json:"top_losers"`
	MostActive []ScreenerResult `json:"most_active"`
}
