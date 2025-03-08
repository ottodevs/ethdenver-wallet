"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { getPortfolioActivity, useOkto } from "@okto_web3/react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

// This is our internal transaction type
export interface Transaction {
  id: string;
  type: string;
  status: string;
  timestamp: number;
  amount: string;
  symbol: string;
  hash: string;
  networkName: string;
  networkSymbol: string;
  valueUsd: number;
}

// Transactions cache with timeout
const TRANSACTIONS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let transactionsCache: {
  data: Transaction[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export function useOktoTransactions() {
  const oktoClient = useOkto();
  const { selectedAccount } = useOktoAccount();
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    if (!oktoClient || !selectedAccount || !isAuthenticated) {
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && 
        transactionsCache.data && 
        now - transactionsCache.timestamp < TRANSACTIONS_CACHE_DURATION) {
      setTransactions(transactionsCache.data);
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    // Only set loading to true on first load or when dependencies change
    if (!hasInitialized) {
      setIsLoading(true);
    }
    
    try {
      console.log("Fetching transaction data...");
      const transactionsData = await getPortfolioActivity(oktoClient);
      
      if (Array.isArray(transactionsData)) {
        // Transform the transactions data
        const formattedTransactions = transactionsData.map((tx) => {
          return {
            id: tx?.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: tx?.transferType?.toLowerCase() || "unknown",
            status: typeof tx?.status === 'string' ? tx?.status.toLowerCase() : "unknown",
            timestamp: typeof tx?.timestamp === 'number' ? 
              (tx.timestamp < 10000000000 ? tx.timestamp * 1000 : tx.timestamp) : 
              Date.now(),
            amount: tx?.quantity || "0",
            symbol: tx?.symbol || "",
            hash: tx?.txHash || "",
            networkName: tx?.networkName || "",
            networkSymbol: tx?.networkSymbol || "",
            valueUsd: 0 // No price data available from the API
          };
        });
        
        // Update cache
        transactionsCache = {
          data: formattedTransactions,
          timestamp: now
        };
        
        setTransactions(formattedTransactions);
        console.log("Transaction data fetched successfully:", { 
          count: formattedTransactions.length 
        });
      } else {
        console.log("No transaction data found or empty response");
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [oktoClient, selectedAccount, isAuthenticated, hasInitialized]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Add a pending transaction to the UI
  const addPendingTransaction = useCallback((transaction: Transaction) => {
    setPendingTransactions(prev => [transaction, ...prev]);
  }, []);

  // Update a pending transaction to completed or failed
  const updatePendingTransaction = useCallback((id: string) => {
    setPendingTransactions(prev => {
      // Remove from pending
      return prev.filter(tx => tx.id !== id);
    });
    
    // Force refresh to get the updated transaction
    fetchTransactions(true);
  }, [fetchTransactions]);

  // Combine pending and confirmed transactions for UI
  const allTransactions = useMemo(() => 
    [...pendingTransactions, ...transactions], 
    [pendingTransactions, transactions]
  );

  // Memoize return value
  const returnValue = useMemo(() => ({
    transactions: allTransactions,
    pendingTransactions,
    addPendingTransaction,
    updatePendingTransaction,
    isLoading,
    error,
    hasInitialized,
    refetch: () => fetchTransactions(true)
  }), [allTransactions, pendingTransactions, addPendingTransaction, updatePendingTransaction, isLoading, error, hasInitialized, fetchTransactions]);

  return returnValue;
} 