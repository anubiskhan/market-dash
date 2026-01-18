package config

import "os"

type Config struct {
	Port          string
	PolygonAPIKey string
	DatabaseURL   string
}

func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		PolygonAPIKey: getEnv("POLYGON_API_KEY", ""),
		DatabaseURL:   getEnv("DATABASE_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
