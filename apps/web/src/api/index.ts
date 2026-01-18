/**
 * Main export file for the API layer
 * Provides a clean interface for components to import hooks and types
 */

// Export API client
export { apiClient, ApiClient } from "./client";

// Export all types
export type {
  ApiError,
  DashboardData,
  IndexData,
  MarketSummary,
  NewsArticle,
  NewsSummary,
  ScreenerResult,
  Sentiment,
} from "./types";

// Export market data hooks
export {
  marketKeys,
  useGainers,
  useIndices,
  useLosers,
  useMarketSummary,
  useMostActive,
} from "./hooks/useMarketData";

// Export news hooks
export {
  newsKeys,
  useNews,
  useNewsByTicker,
  useNewsSummary,
  useRefreshNews,
} from "./hooks/useNews";

// Dashboard hook (aggregates both market and news data)
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { DashboardData } from "./types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

export function useDashboard(
  options?: Omit<UseQueryOptions<DashboardData>, "queryKey" | "queryFn">
) {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.summary(),
    queryFn: () => apiClient.getDashboard(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Auto-refetch every minute
    ...options,
  });
}
