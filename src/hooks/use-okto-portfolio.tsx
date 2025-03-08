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

// Portfolio cache with timeout
const PORTFOLIO_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let portfolioCache: {
  data: { tokens: TokenBalance[]; totalBalanceUsd: number } | null;
  timestamp: number;
} = {
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
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    if (!oktoClient || !selectedAccount || !isAuthenticated) {
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && 
        portfolioCache.data && 
        now - portfolioCache.timestamp < PORTFOLIO_CACHE_DURATION) {
      const { tokens, totalBalanceUsd } = portfolioCache.data;
      setTokens(tokens);
      setTotalBalanceUsd(totalBalanceUsd);
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    // Only set loading to true on first load or when dependencies change
    if (!hasInitialized) {
      setIsLoading(true);
    }
    
    try {
      console.log("Fetching portfolio data...");
      const portfolioData = await getPortfolio(oktoClient);
      
      if (portfolioData && portfolioData.groupTokens) {
        // Transform the token data
        const formattedTokens: TokenBalance[] = portfolioData.groupTokens.map(group => ({
          id: `${group.networkName}-${group.symbol}`,
          name: group.name || group.symbol,
          symbol: group.symbol,
          icon: group.tokenImage || `/token-icons/${group.symbol.toLowerCase()}.svg`,
          chain: group.networkName.toLowerCase(),
          balance: parseFloat(group.balance),
          valueUsd: parseFloat(group.holdingsPriceUsdt),
          contractAddress: group.tokenAddress || "",
          isNative: !group.tokenAddress || group.tokenAddress === ""
        }));
        
        const totalUsd = parseFloat(portfolioData.aggregatedData.totalHoldingPriceUsdt);
        
        // Update cache
        portfolioCache = {
          data: { tokens: formattedTokens, totalBalanceUsd: totalUsd },
          timestamp: now
        };
        
        setTokens(formattedTokens);
        setTotalBalanceUsd(totalUsd);
        console.log("Portfolio data fetched successfully:", { 
          tokenCount: formattedTokens.length, 
          totalUsd 
        });
      } else {
        console.log("No portfolio data found or empty response");
        setTokens([]);
        setTotalBalanceUsd(0);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
      setError("Failed to load portfolio data");
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [oktoClient, selectedAccount, isAuthenticated, hasInitialized]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Memoize return value
  const returnValue = useMemo(() => ({
    tokens,
    totalBalanceUsd,
    isLoading,
    error,
    hasInitialized,
    refetch: (forceRefresh = true) => fetchPortfolio(forceRefresh)
  }), [tokens, totalBalanceUsd, isLoading, error, hasInitialized, fetchPortfolio]);

  return returnValue;
} 