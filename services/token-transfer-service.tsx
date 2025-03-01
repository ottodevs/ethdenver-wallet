"use client";

import { useOkto, UserOp } from "@okto_web3/react-sdk";
import { tokenTransfer } from "@okto_web3/react-sdk";
import { useOktoTransactions, Transaction } from "@/hooks/use-okto-transactions";

interface TokenTransferParams {
  tokenId: string;
  tokenSymbol: string;
  recipient: string;
  amount: number;
  caip2Id: string;
}

export function useTokenTransferService() {
  const oktoClient = useOkto();
  const { addPendingTransaction, updatePendingTransaction } = useOktoTransactions();

  const sendToken = async (params: TokenTransferParams) => {
    if (!oktoClient) {
      throw new Error("Okto client not initialized");
    }

    // Create a pending transaction for optimistic UI
    const pendingTxId = `pending-${Date.now()}`;
    const pendingTx: Transaction = {
      id: pendingTxId,
      type: "send",
      hash: "",
      token: params.tokenSymbol,
      amount: params.amount,
      timestamp: Date.now(),
      status: "pending",
    };

    // Update UI optimistically
    addPendingTransaction(pendingTx);

    try {
      // Convert amount to BigInt with proper decimals (usually 18 for most tokens)
      const amountInSmallestUnit = BigInt(params.amount * 10**18);
      
      const transferParams = {
        amount: amountInSmallestUnit,
        recipient: params.recipient as `0x${string}`,
        token: "" as `0x${string}`, // Empty string for native token, or token contract address
        caip2Id: params.caip2Id
      };
      
      // Create the user operation
      const userOp = await tokenTransfer(oktoClient, transferParams) as UserOp;
      
      // Sign the user operation
      const signedUserOp = await oktoClient.signUserOp(userOp);
      
      // Execute the user operation
      const txHash = await oktoClient.executeUserOp(signedUserOp);
      
      // Update the transaction status
      updatePendingTransaction(pendingTxId, "completed", txHash);
      
      return txHash;
    } catch (error) {
      console.error("Token transfer failed:", error);
      
      // Update the transaction status to failed
      updatePendingTransaction(pendingTxId, "failed");
      
      throw error;
    }
  };

  return { sendToken };
} 