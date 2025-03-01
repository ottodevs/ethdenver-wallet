"use client";

import { usePreloadedData } from "@/contexts/data-preload-context";
import { useCallback, useState } from "react";

export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  collectionAddress: string;
  tokenId: string;
  chain: string;
  caip2Id: string;
}

export function useNftService() {
  const { data, isLoading: globalLoading, error: globalError, refreshData } = usePreloadedData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine if we have initialized data
  const hasInitialized = !!data.nfts;

  // Refresh function that shows a loading state while refreshing
  const refetch = useCallback(async (forceRefresh = true) => {
    setIsRefreshing(true);
    try {
      await refreshData(forceRefresh);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // NFT transfer function (placeholder)
  const transferNFT = useCallback(async (nft: NFT, recipient: string) => {
    // Implementation would go here
    console.log(`Transferring NFT ${nft.id} to ${recipient}`);
    // After transfer, refresh data
    await refreshData(true);
  }, [refreshData]);

  return {
    nfts: data.nfts || [],
    isLoading: globalLoading || isRefreshing,
    hasInitialized,
    error: globalError,
    refetch,
    transferNFT
  };
} 