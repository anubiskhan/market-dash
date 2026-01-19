package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/api"
	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/config"
	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/polygon"
	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/scheduler"
	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/store"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Initialize logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg := config.Load()

	// Initialize Polygon client
	polygonClient := polygon.NewClient(cfg.PolygonAPIKey)

	// Initialize store (PostgreSQL if DATABASE_URL is set, otherwise memory)
	var dataStore store.Store
	var err error

	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		dataStore, err = store.NewPostgresStore(ctx, cfg.DatabaseURL, logger)
		cancel()
		if err != nil {
			logger.Error("failed to connect to PostgreSQL, falling back to memory store", "error", err)
			dataStore = store.NewMemoryStore()
		}
	} else {
		logger.Info("no DATABASE_URL set, using in-memory store")
		dataStore = store.NewMemoryStore()
	}
	defer dataStore.Close()

	// Initialize scheduler for EOD data ingestion
	sched := scheduler.New(polygonClient, dataStore, logger)
	sched.Start()
	defer sched.Stop()

	// Initialize HTTP server
	router := api.NewRouter(dataStore, logger)
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		logger.Info("starting server", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("server forced to shutdown", "error", err)
	}

	logger.Info("server stopped")
}
