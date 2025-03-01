"use client";

import { useOktoAccount } from "@/hooks/use-okto-account";
import { getPortfolioActivity, useOkto } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";

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
};

// This matches the Okto API response type
interface UserPortfolioActivity {
  symbol: string;
  image: string;
  name: string;
  shortName: string;
  id: string;
  groupId: string;
  description: string;
  quantity: string;
  orderType: string;
  transferType: string;
  status: string;
  timestamp: number;
  txHash: string;
  caip2Id: string;
  networkName: string;
  networkExplorerUrl: string;
  networkSymbol: string;
  caipId: string;
}

export function useOktoTransactions() {
  const oktoClient = useOkto();
  const { selectedAccount, isAuthenticated } = useOktoAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      if (!oktoClient || !selectedAccount || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch transactions from Okto
        const response = await getPortfolioActivity(oktoClient);

        // Handle the case when response is null or undefined
        if (!response) {
          console.log("No transaction data returned from API");
          setTransactions([]);
          setIsLoading(false);
          return;
        }

        // Map the transactions to our format with safe access to properties
        const formattedTransactions = Array.isArray(response) ? response.map((tx: UserPortfolioActivity) => {
          // Generate a unique ID if none exists
          const id = tx?.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          // Determine transaction type
          let type = "unknown";
          if (tx?.transferType) {
            type = tx.transferType.toLowerCase() === "receive" ? "receive" : 
                  tx.transferType.toLowerCase() === "send" ? "send" : 
                  tx.transferType;
          } else if (tx?.orderType) {
            type = tx.orderType;
          }
          
          // Format status
          const status = tx?.status ? tx.status.toLowerCase() : "unknown";
          
          // Handle timestamp
          let timestamp = Date.now();
          if (tx?.timestamp) {
            timestamp = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : tx.timestamp;
          }
          
          // Format amount - use quantity from the API
          const amount = tx?.quantity || "0";
          
          // Get symbol
          const symbol = tx?.symbol || "";
          
          // Additional fields
          const hash = tx?.txHash || "";
          const to = ""; // Not directly available in the API
          const from = ""; // Not directly available in the API
          
          return {
            id,
            type,
            status,
            timestamp,
            amount,
            symbol,
            to,
            from,
            hash
          };
        }) : [];
        
        setTransactions(formattedTransactions);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transaction history");
        // Set empty array to prevent further errors
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [oktoClient, selectedAccount, isAuthenticated]);

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