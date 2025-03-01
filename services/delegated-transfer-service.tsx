"use client";

import { useAuth } from "@/contexts/auth-context";
import { Transaction, useOktoTransactions } from "@/hooks/use-okto-transactions";
import { tokenTransfer, useOkto } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";

interface DelegatedTokenTransferParams {
  tokenId: string;
  tokenSymbol: string;
  recipient: string;
  amount: number;
  caip2Id: string;
  tokenAddress?: string;
  decimals?: number;
}

export function useDelegatedTransferService() {
  const oktoClient = useOkto();
  const { checkAuthStatus } = useAuth();
  const { addPendingTransaction, updatePendingTransaction } = useOktoTransactions();
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [delegationEnabled, setDelegationEnabled] = useState(false);
  
  // Load session key and delegation status on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('okto_session_key');
      const isDelegationEnabled = !!localStorage.getItem('okto_delegation_enabled');
      
      if (storedKey) {
        setSessionKey(storedKey);
      }
      
      setDelegationEnabled(isDelegationEnabled);
    }
  }, []);

  const sendTokenDelegated = async (params: DelegatedTokenTransferParams) => {
    if (!oktoClient) {
      throw new Error("Okto client not initialized");
    }
    
    // Check if delegation is enabled
    if (!delegationEnabled || !sessionKey) {
      throw new Error("Delegation not enabled or session key missing");
    }
    
    // Verify authentication before continuing
    const isAuth = await checkAuthStatus();
    if (!isAuth) {
      throw new Error("Authentication required");
    }
    
    // Create a pending transaction for optimistic UI
    const pendingTxId = `pending-${Date.now()}`;
    const pendingTx = {
      id: pendingTxId,
      type: "send",
      hash: "",
      token: params.tokenSymbol,
      amount: params.amount.toString(),
      timestamp: Date.now(),
      status: "pending",
      symbol: params.tokenSymbol
    };

    // Update UI optimistically
    addPendingTransaction(pendingTx as unknown as Transaction);

    try {
      // Use provided decimals or default to 18
      const decimals = params.decimals || 18;
      
      // Convert amount to BigInt with proper decimals
      const amountInSmallestUnit = BigInt(Math.floor(params.amount * 10**decimals));
      
      // Prepare transfer parameters according to the SDK documentation
      const transferParams = {
        amount: amountInSmallestUnit,
        recipient: params.recipient as `0x${string}`,
        token: (params.tokenAddress || "") as `0x${string}`, // Empty string for native token, or token contract address
        caip2Id: params.caip2Id
      };
      
      // Execute the transfer using the abstracted flow
      const jobId = await tokenTransfer(oktoClient, transferParams);
      
      // Update the transaction status - only pass the ID as that's what the function expects
      updatePendingTransaction(pendingTxId);
      
      return jobId;
    } catch (error) {
      console.error("Token transfer failed:", error);
      
      
      // We can't pass these additional parameters since the function only accepts one parameter
      // Just update with the ID
      updatePendingTransaction(pendingTxId);
      
      throw error;
    }
  };

  return { 
    sendTokenDelegated,
    hasDelegatedCapability: delegationEnabled && !!sessionKey,
    isDelegationEnabled: delegationEnabled
  };
} 