"use client";

import { useAuth } from "@/contexts/auth-context";
import { getChains, useOkto } from "@okto_web3/react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface Chain {
  id: string;
  name: string;
  icon: string;
  caip2Id: string;
}

// Chains cache with timeout
const CHAINS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (chains change less frequently)
let chainsCache: {
  data: Chain[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export function useChainService() {
  const oktoClient = useOkto();
  const { isAuthenticated } = useAuth();
  const [chains, setChains] = useState<Chain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchChains = useCallback(async (forceRefresh = false) => {
    if (!oktoClient || !isAuthenticated) {
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && 
        chainsCache.data && 
        now - chainsCache.timestamp < CHAINS_CACHE_DURATION) {
      setChains(chainsCache.data);
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    // Only set loading to true on first load or when dependencies change
    if (!hasInitialized) {
      setIsLoading(true);
    }
    
    try {
      console.log("Fetching chains data...");
      const chainsData = await getChains(oktoClient);
      
      if (Array.isArray(chainsData) && chainsData.length > 0) {
        // Transform the chains data
        const formattedChains = chainsData.map((chain) => ({
          id: chain.chainId,
          name: chain.networkName,
          icon: chain.logo || `/chain-icons/${chain.networkName.toLowerCase()}.svg`,
          caip2Id: getCaip2IdForChain(chain.networkName.toLowerCase())
        }));
        
        // Update cache
        chainsCache = {
          data: formattedChains,
          timestamp: now
        };
        
        setChains(formattedChains);
        console.log("Chains data fetched successfully:", { 
          count: formattedChains.length 
        });
      } else {
        console.log("No chains data found or empty response");
        setChains([]);
      }
    } catch (err) {
      console.error("Failed to fetch chains:", err);
      setError("Failed to load blockchain networks");
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [oktoClient, isAuthenticated, hasInitialized]);

  // Initial fetch
  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  // Helper function to get CAIP-2 ID for a chain
  function getCaip2IdForChain(chain: string): string {
    const chainMap: Record<string, string> = {
      ethereum: "eip155:1",
      polygon: "eip155:137",
      arbitrum: "eip155:42161",
      optimism: "eip155:10",
      base: "eip155:8453"
    };
    
    return chainMap[chain] || "eip155:1"; // Default to Ethereum mainnet
  }

  // Memoize return value
  const returnValue = useMemo(() => ({
    chains,
    isLoading,
    error,
    hasInitialized,
    refetch: () => fetchChains(true)
  }), [chains, isLoading, error, hasInitialized, fetchChains]);

  return returnValue;
} 