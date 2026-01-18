/**
 * React Query hooks for news data
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../client";
import type { NewsArticle, NewsSummary } from "../types";

// Query keys for cache management
export const newsKeys = {
  all: ["news"] as const,
  lists: () => [...newsKeys.all, "list"] as const,
  list: (filters?: { limit?: number; ticker?: string }) =>
    [...newsKeys.lists(), filters] as const,
  summary: () => [...newsKeys.all, "summary"] as const,
  byTicker: (ticker: string) => [...newsKeys.all, "ticker", ticker] as const,
};

// Hook: Get news articles
export function useNews(
  params?: { limit?: number; ticker?: string },
  options?: Omit<UseQueryOptions<NewsArticle[]>, "queryKey" | "queryFn">
) {
  return useQuery<NewsArticle[]>({
    queryKey: newsKeys.list(params),
    queryFn: () => apiClient.getNews(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    ...options,
  });
}

// Hook: Get news summary with sentiment analysis
export function useNewsSummary(
  options?: Omit<UseQueryOptions<NewsSummary>, "queryKey" | "queryFn">
) {
  return useQuery<NewsSummary>({
    queryKey: newsKeys.summary(),
    queryFn: () => apiClient.getNewsSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5,
    ...options,
  });
}

// Hook: Get news for a specific ticker
export function useNewsByTicker(
  ticker: string,
  limit: number = 10,
  options?: Omit<UseQueryOptions<NewsArticle[]>, "queryKey" | "queryFn">
) {
  return useQuery<NewsArticle[]>({
    queryKey: newsKeys.byTicker(ticker),
    queryFn: () => apiClient.getNewsByTicker(ticker, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Boolean(ticker), // Only fetch if ticker is provided
    ...options,
  });
}

// Hook: Manually trigger news refresh (mutation)
export function useRefreshNews(
  options?: UseMutationOptions<
    { status: string; timestamp: string },
    Error,
    void
  >
) {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; timestamp: string }, Error, void>({
    mutationFn: () => apiClient.refreshNews(),
    onSuccess: () => {
      // Invalidate all news queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
    ...options,
  });
}
