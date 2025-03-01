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

// Define the cache structure with proper types
interface ChainCache {
  data: Chain[] | null;
  timestamp: number;
}

// Chain data cache
const CHAIN_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (chains rarely change)
let chainCache: ChainCache = {
  data: null,
  timestamp: 0
};

export function useChainService() {
  const oktoClient = useOkto();
  const { isAuthenticated } = useAuth();
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChains = useCallback(async (forceRefresh = false) => {
    if (!oktoClient || !isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && 
        chainCache.data && 
        now - chainCache.timestamp < CHAIN_CACHE_DURATION) {
      setChains(chainCache.data);
      
      // Set default selected chain if not already set
      if (!selectedChain && chainCache.data.length > 0) {
        setSelectedChain(chainCache.data[0]);
      }
      
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const chainsData = await getChains(oktoClient);
      
      // Transform the chains data
      const formattedChains: Chain[] = chainsData.map(chain => {
        // Map network name to CAIP-2 ID
        const caip2Id = getCaip2IdForChain(chain.networkName.toLowerCase());
        
        return {
          id: chain.chainId,
          name: chain.networkName,
          icon: chain.logo || "/chain-icons/ethereum.svg", // Fallback icon
          caip2Id
        };
      });
      
      // Update cache
      chainCache = {
        data: formattedChains,
        timestamp: now
      };
      
      setChains(formattedChains);
      
      // Set default selected chain if not already set
      if (!selectedChain && formattedChains.length > 0) {
        setSelectedChain(formattedChains[0]);
      }
    } catch (err) {
      console.error("Failed to fetch chains:", err);
      setError("Failed to load blockchain networks");
      setChains([]);
    } finally {
      setIsLoading(false);
    }
  }, [oktoClient, isAuthenticated, selectedChain]);

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

  const selectChain = useCallback((chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
    }
  }, [chains]);

  // Memoize return value
  const returnValue = useMemo(() => ({
    chains,
    selectedChain,
    selectChain,
    isLoading,
    error,
    refetch: () => fetchChains(true)
  }), [chains, selectedChain, selectChain, isLoading, error, fetchChains]);

  return returnValue;
} 