"use client";

import { usePreloadedData } from "@/contexts/data-preload-context";
import { useCallback, useState } from "react";

export interface Chain {
  id: string;
  name: string;
  icon: string;
  caip2Id: string;
}

export function useChainService() {
  const { data, isLoading: globalLoading, error: globalError, refreshData } = usePreloadedData();
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set default selected chain if not already set
  if (!selectedChain && data.chains && data.chains.length > 0) {
    setSelectedChain(data.chains[0]);
  }

  // Refresh function that shows a loading state while refreshing
  const refetch = useCallback(async (forceRefresh = true) => {
    setIsRefreshing(true);
    try {
      await refreshData(forceRefresh);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  const selectChain = useCallback((chainId: string) => {
    const chain = data.chains?.find(c => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
    }
  }, [data.chains]);

  return {
    chains: data.chains || [],
    selectedChain,
    selectChain,
    isLoading: globalLoading || isRefreshing,
    error: globalError,
    refetch
  };
} 