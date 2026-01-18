/**
 * TypeScript types for Market Dash API responses
 */

export type Sentiment = "positive" | "negative" | "neutral";

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  avg_volume: number;
  volume_ratio: number;
}

export interface MarketSummary {
  indices: IndexData[];
  top_gainers: ScreenerResult[];
  top_losers: ScreenerResult[];
  most_active: ScreenerResult[];
  last_updated: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  published_at: string;
  tickers: string[];
  sentiment: Sentiment | null;
  sentiment_score: number | null;
}

export interface NewsSummary {
  articles: NewsArticle[];
  overall_sentiment: Sentiment;
  sentiment_breakdown: Record<string, number>;
  top_tickers: string[];
  last_updated: string;
}

export interface DashboardData {
  market: MarketSummary | { error: string };
  news: NewsSummary | { error: string };
  timestamp: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
