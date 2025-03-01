"use client";

import { useEffect, useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
import { getAccount } from "@okto_web3/react-sdk";

interface OktoAccount {
  address: string;
  networkName: string;
  networkId: string;
}

export function useOktoAccount() {
  const oktoClient = useOkto();
  const [accounts, setAccounts] = useState<OktoAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<OktoAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      if (!oktoClient) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
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
  }, [oktoClient]);

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
    isLoading,
    error
  };
} 