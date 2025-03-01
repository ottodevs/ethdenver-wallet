"use client";

import { useEffect, useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
import { getPortfolioActivity } from "@okto_web3/react-sdk";
import { useOktoAccount } from "@/hooks/use-okto-account";

export interface Transaction {
  id: string;
  type: "send" | "receive" | "swap";
  hash: string;
  token: string;
  amount: number;
  timestamp: number;
  status: "pending" | "completed" | "failed";
}

export function useOktoTransactions() {
  const oktoClient = useOkto();
  const { selectedAccount } = useOktoAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      if (!oktoClient || !selectedAccount) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const activity = await getPortfolioActivity(oktoClient);
        
        // Transform activity data to match your Transaction interface
        const formattedTransactions: Transaction[] = activity.map(item => ({
          id: item.id,
          type: item.transferType === "RECEIVE" ? "receive" : 
                item.transferType === "SEND" ? "send" : "swap",
          hash: item.txHash,
          token: item.symbol,
          amount: parseFloat(item.quantity),
          timestamp: new Date(item.timestamp).getTime(),
          status: item.status.toLowerCase() as "completed" | "pending" | "failed",
        }));
        
        setTransactions(formattedTransactions);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transaction history");
        
        // Fallback to empty state
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [oktoClient, selectedAccount]);

  // Add a pending transaction to the UI
  const addPendingTransaction = (transaction: Transaction) => {
    setPendingTransactions(prev => [transaction, ...prev]);
  };

  // Update a pending transaction to completed or failed
  const updatePendingTransaction = (id: string, status: "completed" | "failed", hash?: string) => {
    const pendingTx = pendingTransactions.find(tx => tx.id === id);
    
    if (pendingTx) {
      // Remove from pending
      setPendingTransactions(prev => prev.filter(tx => tx.id !== id));
      
      // Add to regular transactions with updated status
      const updatedTx = {
        ...pendingTx,
        status,
        hash: hash || pendingTx.hash
      };
      
      setTransactions(prev => [updatedTx, ...prev]);
    }
  };

  // Combine pending and confirmed transactions for UI
  const allTransactions = [...pendingTransactions, ...transactions];

  return {
    transactions: allTransactions,
    pendingTransactions,
    addPendingTransaction,
    updatePendingTransaction,
    isLoading,
    error
  };
} 