package api

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Handler struct {
	store  store.Store
	logger *slog.Logger
}

func NewRouter(store store.Store, logger *slog.Logger) http.Handler {
	h := &Handler{
		store:  store,
		logger: logger,
	}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8787"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", h.health)
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/summary", h.getSummary)
		r.Get("/indices", h.getIndices)
		r.Get("/gainers", h.getGainers)
		r.Get("/losers", h.getLosers)
		r.Get("/active", h.getMostActive)
	})

	return r
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) getSummary(w http.ResponseWriter, r *http.Request) {
	summary := map[string]any{
		"indices":      h.store.GetIndices(),
		"top_gainers":  h.store.GetTopGainers(10),
		"top_losers":   h.store.GetTopLosers(10),
		"most_active":  h.store.GetMostActive(10),
		"last_updated": h.store.GetLastUpdated(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

func (h *Handler) getIndices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.store.GetIndices())
}

func (h *Handler) getGainers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.store.GetTopGainers(20))
}

func (h *Handler) getLosers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.store.GetTopLosers(20))
}

func (h *Handler) getMostActive(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.store.GetMostActive(20))
}
