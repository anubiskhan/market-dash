package scheduler

import (
	"context"
	"log/slog"
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/polygon"
	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/store"
	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron    *cron.Cron
	polygon *polygon.Client
	store   store.Store
	logger  *slog.Logger
}

func New(polygonClient *polygon.Client, store store.Store, logger *slog.Logger) *Scheduler {
	// Use Eastern Time for market hours
	loc, _ := time.LoadLocation("America/New_York")
	c := cron.New(cron.WithLocation(loc))

	return &Scheduler{
		cron:    c,
		polygon: polygonClient,
		store:   store,
		logger:  logger,
	}
}

func (s *Scheduler) Start() {
	// Run EOD data ingestion at 4:30 PM ET on weekdays
	s.cron.AddFunc("30 16 * * 1-5", func() {
		s.logger.Info("running scheduled EOD data ingestion")
		s.ingestDailyData()
	})

	// Also run on startup to populate initial data
	go func() {
		s.logger.Info("running initial data ingestion")
		s.ingestDailyData()
	}()

	s.cron.Start()
}

func (s *Scheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
}

func (s *Scheduler) ingestDailyData() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Get previous trading day (simplified - doesn't account for holidays)
	date := getPreviousTradingDay()

	s.logger.Info("fetching grouped daily data", "date", date.Format("2006-01-02"))

	bars, err := s.polygon.GetGroupedDaily(ctx, date)
	if err != nil {
		s.logger.Error("failed to fetch grouped daily data", "error", err)
		return
	}

	s.logger.Info("fetched daily bars", "count", len(bars))

	// Calculate change percentages
	for i := range bars {
		if bars[i].Open > 0 {
			bars[i].Change = bars[i].Close - bars[i].Open
			bars[i].ChangePct = (bars[i].Change / bars[i].Open) * 100
		}
	}

	// Store the data
	if err := s.store.SaveDailyBars(bars); err != nil {
		s.logger.Error("failed to save daily bars", "error", err)
		return
	}

	s.logger.Info("daily data ingestion complete", "symbols", len(bars))
}

func getPreviousTradingDay() time.Time {
	loc, _ := time.LoadLocation("America/New_York")
	now := time.Now().In(loc)

	// If it's before 4:30 PM, use the day before yesterday
	// Otherwise use yesterday
	cutoff := time.Date(now.Year(), now.Month(), now.Day(), 16, 30, 0, 0, loc)
	if now.Before(cutoff) {
		now = now.AddDate(0, 0, -1)
	}

	// Go back to the previous weekday
	date := now.AddDate(0, 0, -1)
	for date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
		date = date.AddDate(0, 0, -1)
	}

	return date
}
