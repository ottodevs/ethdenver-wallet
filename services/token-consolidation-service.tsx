"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useOktoTransactions } from "@/hooks/use-okto-transactions";
import { tokenTransfer, useOkto } from "@okto_web3/react-sdk";

// Define the Transaction type
interface Transaction {
  id: string;
  type: string;
  hash: string;
  amount: string;
  timestamp: number;
  status: "pending" | "completed" | "failed";
  symbol: string;
}

export function useTokenConsolidationService() {
  const oktoClient = useOkto();
  const { checkAuthStatus } = useAuth();
  const { addPendingTransaction, updatePendingTransaction } = useOktoTransactions();
  const { tokens, refetch } = useOktoPortfolio();
  const { selectedAccount } = useOktoAccount();

  const consolidateToEth = async () => {
    if (!oktoClient) {
      throw new Error("Okto client not initialized");
    }

    // Verificar autenticación antes de continuar
    const isAuth = await checkAuthStatus();
    if (!isAuth) {
      throw new Error("Authentication required");
    }

    if (!selectedAccount) {
      throw new Error("No account selected");
    }

    console.log("Starting token consolidation...");

    // Filtrar tokens con valor menor a $10 USD que no sean ETH nativos
    const tokensToConsolidate = tokens.filter(token => 
      token.valueUsd < 10 && 
      token.symbol !== "ETH" && 
      token.balance > 0 &&
      !token.isNative
    );

    if (tokensToConsolidate.length === 0) {
      console.log("No tokens to consolidate");
      return [];
    }

    console.log("Tokens to consolidate:", tokensToConsolidate);

    // Mapa de CAIP-2 IDs por cadena
    const caip2IdMap: Record<string, string> = {
      ethereum: "eip155:1",
      polygon: "eip155:137",
      arbitrum: "eip155:42161",
      optimism: "eip155:10",
      base: "eip155:8453"
    };

    // Usar la dirección de la cuenta seleccionada
    const userAddress = selectedAccount.address;
    console.log("User address for consolidation:", userAddress);

    const results = [];

    // Procesar cada token para consolidación
    for (const token of tokensToConsolidate) {
      const chain = token.chain;
      const caip2Id = caip2IdMap[chain] || "eip155:1";

      // Crear una transacción pendiente para UI optimista
      const pendingTxId = `pending-consolidate-${token.id}-${Date.now()}`;
      const pendingTx: Transaction = {
        id: pendingTxId,
        type: "consolidate",
        hash: "",
        symbol: token.symbol,
        amount: token.balance.toString(),
        timestamp: Date.now(),
        status: "pending",
      };

      // Update UI optimistically
      addPendingTransaction(pendingTx);

      try {
        // Convertir el balance a BigInt con los decimales adecuados
        const amountInSmallestUnit = BigInt(Math.floor(token.balance * 10**18));
        
        // Preparar parámetros de transferencia
        const transferParams = {
          amount: amountInSmallestUnit,
          recipient: userAddress as `0x${string}`, // Dirección del usuario como destinatario
          token: (token.contractAddress || "") as `0x${string}`, // Dirección del token a consolidar
          caip2Id: caip2Id
        };
        
        console.log(`Consolidating ${token.symbol} to ETH on ${chain}:`, transferParams);
        
        // Ejecutar la transferencia
        const jobId = await tokenTransfer(oktoClient, transferParams);
        console.log(`Consolidation of ${token.symbol} submitted with jobId:`, jobId);
        
        // Actualizar el estado de la transacción
        updatePendingTransaction(pendingTxId, "completed", jobId);
        
        results.push({
          token: token.symbol,
          chain,
          jobId
        });
      } catch (error) {
        console.error(`Failed to consolidate ${token.symbol} on ${chain}:`, error);
        
        // Actualizar el estado de la transacción a fallido
        updatePendingTransaction(pendingTxId, "failed");
        
        results.push({
          token: token.symbol,
          chain,
          error: error
        });
      }
    }

    // Forzar actualización de balances después de todas las transacciones
    setTimeout(async () => {
      try {
        console.log("Refreshing portfolio after consolidation...");
        await refetch();
      } catch (refreshError) {
        console.error("Error refreshing portfolio:", refreshError);
      }
    }, 5000); // Esperar 5 segundos para dar tiempo a que las transacciones se procesen

    return results;
  };

  return { consolidateToEth };
} 