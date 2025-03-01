"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { getPortfolio, useOkto } from "@okto_web3/react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

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

// Define the cache structure with proper types
interface PortfolioCache {
  data: {
    tokens: TokenBalance[];
    totalBalanceUsd: number;
  } | null;
  timestamp: number;
}

// Add a simple cache mechanism
const CACHE_DURATION = 60 * 1000; // 1 minute cache
let portfolioCache: PortfolioCache = {
  data: null,
  timestamp: 0
};

export function useOktoPortfolio() {
  const oktoClient = useOkto();
  const { selectedAccount } = useOktoAccount();
  const { isAuthenticated } = useAuth();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    if (!oktoClient || !selectedAccount || !isAuthenticated) {
      if (hasInitialized) {
        setIsLoading(false);
      }
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && 
        portfolioCache.data && 
        now - portfolioCache.timestamp < CACHE_DURATION) {
      const cachedData = portfolioCache.data;
      setTokens(cachedData.tokens);
      setTotalBalanceUsd(cachedData.totalBalanceUsd);
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    // Only set loading to true on first load or when forcing refresh
    if (!hasInitialized || forceRefresh) {
      setIsLoading(true);
    }
    
    try {
      setError(null);
      
      const portfolio = await getPortfolio(oktoClient);
      
      // Transform portfolio data
      const formattedTokens: TokenBalance[] = portfolio.groupTokens.map(group => ({
        id: group.id,
        name: group.name,
        symbol: group.symbol,
        icon: group.tokenImage || "/placeholder.svg?height=40&width=40",
        chain: group.networkName.toLowerCase(),
        balance: parseFloat(group.balance),
        valueUsd: parseFloat(group.holdingsPriceUsdt),
        contractAddress: group.tokenAddress || "",
        isNative: !group.tokenAddress || group.tokenAddress === ""
      }));
      
      const totalUsd = parseFloat(portfolio.aggregatedData.totalHoldingPriceUsdt);
      
      // Update cache
      portfolioCache = {
        data: {
          tokens: formattedTokens,
          totalBalanceUsd: totalUsd
        },
        timestamp: now
      };
      
      setTokens(formattedTokens);
      setTotalBalanceUsd(totalUsd);
      setLastFetchTime(now);
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
      setError("Failed to load portfolio data");
      
      // Don't clear tokens if we already have data - keep showing stale data
      if (tokens.length === 0) {
        setTokens([]);
        setTotalBalanceUsd(0);
      }
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [oktoClient, selectedAccount, isAuthenticated, hasInitialized, tokens.length]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    tokens,
    totalBalanceUsd,
    isLoading,
    hasInitialized,
    error,
    refetch: () => fetchPortfolio(true),
    lastFetchTime
  }), [tokens, totalBalanceUsd, isLoading, hasInitialized, error, fetchPortfolio, lastFetchTime]);

  return returnValue;
} 