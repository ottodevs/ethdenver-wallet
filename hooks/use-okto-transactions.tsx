"use client";

import { usePreloadedData } from "@/contexts/data-preload-context";
import { useCallback, useMemo, useState } from "react";

// This is our internal transaction type
export type Transaction = {
  id: string;
  type: string;
  status: string;
  timestamp: number;
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  hash?: string;
  networkName?: string;
  networkSymbol?: string;
  valueUsd?: number;
};



export function useOktoTransactions() {
  const { data, isLoading: globalLoading, error: globalError, refreshData } = usePreloadedData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  // Determine if we have initialized data
  const hasInitialized = !!data.transactions;

  // Refresh function that shows a loading state while refreshing
  const refetch = useCallback(async (forceRefresh = true) => {
    setIsRefreshing(true);
    try {
      await refreshData(forceRefresh);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

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
    refreshData(true);
  }, [refreshData]);

  // Combine pending and confirmed transactions for UI
  const allTransactions = useMemo(() => 
    [...pendingTransactions, ...(data.transactions || [])], 
    [pendingTransactions, data.transactions]
  );

  return {
    transactions: allTransactions,
    pendingTransactions,
    addPendingTransaction,
    updatePendingTransaction,
    isLoading: globalLoading || isRefreshing,
    hasInitialized,
    error: globalError,
    refetch
  };
} 