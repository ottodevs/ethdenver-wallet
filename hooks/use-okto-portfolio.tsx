"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { getPortfolio, useOkto } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";

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
  const oktoClient = useOkto();
  const { selectedAccount } = useOktoAccount();
  const { isAuthenticated } = useAuth();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      if (!oktoClient || !selectedAccount || !isAuthenticated) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const portfolio = await getPortfolio(oktoClient);
        
        // Transform portfolio data to match your Token interface
        const formattedTokens: TokenBalance[] = portfolio.groupTokens.map(group => ({
          id: group.id,
          name: group.name,
          symbol: group.symbol,
          icon: group.tokenImage || "/placeholder.svg?height=40&width=40",
          chain: group.networkName.toLowerCase(),
          balance: parseFloat(group.balance),
          valueUsd: parseFloat(group.holdingsPriceUsdt),
        }));
        
        setTokens(formattedTokens);
        setTotalBalanceUsd(parseFloat(portfolio.aggregatedData.totalHoldingPriceUsdt));
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError("Failed to load portfolio data");
        
        // Fallback to empty state
        setTokens([]);
        setTotalBalanceUsd(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolio();
  }, [oktoClient, selectedAccount, isAuthenticated]);

  return {
    tokens,
    totalBalanceUsd,
    isLoading,
    error
  };
} 