/**
 * Base API client for Market Dash
 * Provides a fetch wrapper with error handling and type safety
 */

import type {
  ApiError,
  DashboardData,
  IndexData,
  MarketSummary,
  NewsArticle,
  NewsSummary,
  ScreenerResult,
} from "./types";

// API Gateway URL - defaults to local development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || "An unexpected error occurred");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error: Unable to connect to the API");
    }
  }

  // Market data endpoints
  async getMarketSummary(): Promise<MarketSummary> {
    return this.fetchWithErrorHandling<MarketSummary>("/api/market/summary");
  }

  async getIndices(): Promise<IndexData[]> {
    return this.fetchWithErrorHandling<IndexData[]>("/api/market/indices");
  }

  async getGainers(): Promise<ScreenerResult[]> {
    return this.fetchWithErrorHandling<ScreenerResult[]>("/api/market/gainers");
  }

  async getLosers(): Promise<ScreenerResult[]> {
    return this.fetchWithErrorHandling<ScreenerResult[]>("/api/market/losers");
  }

  async getMostActive(): Promise<ScreenerResult[]> {
    return this.fetchWithErrorHandling<ScreenerResult[]>("/api/market/active");
  }

  // News endpoints
  async getNews(params?: { limit?: number; ticker?: string }): Promise<NewsArticle[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.ticker) searchParams.set("ticker", params.ticker);

    const query = searchParams.toString();
    return this.fetchWithErrorHandling<NewsArticle[]>(`/api/news${query ? `?${query}` : ""}`);
  }

  async getNewsSummary(): Promise<NewsSummary> {
    return this.fetchWithErrorHandling<NewsSummary>("/api/news/summary");
  }

  async getNewsByTicker(ticker: string, limit: number = 10): Promise<NewsArticle[]> {
    return this.fetchWithErrorHandling<NewsArticle[]>(
      `/api/news/ticker/${ticker}?limit=${limit}`
    );
  }

  async refreshNews(): Promise<{ status: string; timestamp: string }> {
    return this.fetchWithErrorHandling<{ status: string; timestamp: string }>("/api/news/refresh", {
      method: "POST",
    });
  }

  // Dashboard endpoint (aggregated data)
  async getDashboard(): Promise<DashboardData> {
    return this.fetchWithErrorHandling<DashboardData>("/api/dashboard");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
