"use client";

import { usePreloadedData } from "@/contexts/data-preload-context";
import { useCallback, useState } from "react";

export interface TokenBalance {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  chain: string;
  balance: number;
  valueUsd: number;
  contractAddress?: string;
  isNative?: boolean;
}

export function useOktoPortfolio() {
  const { data, isLoading: globalLoading, error: globalError, refreshData } = usePreloadedData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine if we have initialized data
  const hasInitialized = !!data.portfolio;

  // Refresh function that shows a loading state while refreshing
  const refetch = useCallback(async (forceRefresh = true) => {
    setIsRefreshing(true);
    try {
      await refreshData(forceRefresh);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  return {
    tokens: data.portfolio?.tokens || [],
    totalBalanceUsd: data.portfolio?.totalBalanceUsd || 0,
    isLoading: globalLoading || isRefreshing,
    hasInitialized,
    error: globalError,
    refetch,
    lastFetchTime: data.lastUpdated
  };
} 