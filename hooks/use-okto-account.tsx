"use client";

import { useAuth } from "@/contexts/auth-context";
import { getAccount, useOkto } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";

interface OktoAccount {
  address: string;
  networkName: string;
  networkId: string;
}

export function useOktoAccount() {
  const oktoClient = useOkto();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<OktoAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<OktoAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts only when authenticated
  useEffect(() => {
    async function fetchAccounts() {
      if (!oktoClient || !isAuthenticated) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching accounts...");
        const accountsResponse = await getAccount(oktoClient);
        
        if (accountsResponse && accountsResponse.length > 0) {
          const formattedAccounts = accountsResponse.map(account => ({
            address: account.address,
            networkName: account.networkName,
            networkId: account.caipId
          }));
          
          setAccounts(formattedAccounts);
          setSelectedAccount(formattedAccounts[0]); // Default to first account
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
        setError("Failed to load wallet accounts");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccounts();
  }, [oktoClient, isAuthenticated]);

  const selectAccount = (address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account) {
      setSelectedAccount(account);
    }
  };

  return {
    accounts,
    selectedAccount,
    selectAccount,
    isLoading: isLoading || authLoading,
    error,
    isAuthenticated
  };
} 