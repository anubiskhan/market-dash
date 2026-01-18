/**
 * React Query hooks for market data
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { IndexData, MarketSummary, ScreenerResult } from "../types";

// Query keys for cache management
export const marketKeys = {
  all: ["market"] as const,
  summary: () => [...marketKeys.all, "summary"] as const,
  indices: () => [...marketKeys.all, "indices"] as const,
  gainers: () => [...marketKeys.all, "gainers"] as const,
  losers: () => [...marketKeys.all, "losers"] as const,
  active: () => [...marketKeys.all, "active"] as const,
};

// Hook: Get market summary (all data in one request)
export function useMarketSummary(
  options?: Omit<UseQueryOptions<MarketSummary>, "queryKey" | "queryFn">
) {
  return useQuery<MarketSummary>({
    queryKey: marketKeys.summary(),
    queryFn: () => apiClient.getMarketSummary(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Auto-refetch every minute
    ...options,
  });
}

// Hook: Get major indices
export function useIndices(
  options?: Omit<UseQueryOptions<IndexData[]>, "queryKey" | "queryFn">
) {
  return useQuery<IndexData[]>({
    queryKey: marketKeys.indices(),
    queryFn: () => apiClient.getIndices(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60,
    ...options,
  });
}

// Hook: Get top gainers
export function useGainers(
  options?: Omit<UseQueryOptions<ScreenerResult[]>, "queryKey" | "queryFn">
) {
  return useQuery<ScreenerResult[]>({
    queryKey: marketKeys.gainers(),
    queryFn: () => apiClient.getGainers(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60,
    ...options,
  });
}

// Hook: Get top losers
export function useLosers(
  options?: Omit<UseQueryOptions<ScreenerResult[]>, "queryKey" | "queryFn">
) {
  return useQuery<ScreenerResult[]>({
    queryKey: marketKeys.losers(),
    queryFn: () => apiClient.getLosers(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60,
    ...options,
  });
}

// Hook: Get most active stocks
export function useMostActive(
  options?: Omit<UseQueryOptions<ScreenerResult[]>, "queryKey" | "queryFn">
) {
  return useQuery<ScreenerResult[]>({
    queryKey: marketKeys.active(),
    queryFn: () => apiClient.getMostActive(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60,
    ...options,
  });
}
