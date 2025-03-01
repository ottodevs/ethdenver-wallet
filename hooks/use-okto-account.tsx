"use client";

import { getAccount, useOkto } from "@okto_web3/react-sdk";
import { useEffect, useState } from "react";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    if (!oktoClient) return;
    
    const checkAuthStatus = async () => {
      try {
        // Check if user is authenticated
        const authStatus = oktoClient.isLoggedIn();
        console.log("Okto authentication status:", authStatus);
        setIsAuthenticated(authStatus);
      } catch (err) {
        console.error("Failed to check authentication status:", err);
        setIsAuthenticated(false);
      }
    };
    
    // Check immediately and then periodically
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [oktoClient]);

  // Fetch accounts only when authenticated
  useEffect(() => {
    async function fetchAccounts() {
      if (!oktoClient || !isAuthenticated) {
        if (!isAuthenticated) {
          console.log("Not authenticated, skipping account fetch");
        }
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching accounts...");
        const accountsResponse = await getAccount(oktoClient);
        console.log("Accounts response:", accountsResponse);
        
        if (accountsResponse && accountsResponse.length > 0) {
          const formattedAccounts = accountsResponse.map(account => ({
            address: account.address,
            networkName: account.networkName,
            networkId: account.caipId
          }));
          
          setAccounts(formattedAccounts);
          setSelectedAccount(formattedAccounts[0]); // Default to first account
          console.log("Accounts loaded successfully");
        } else {
          console.log("No accounts found in response");
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
    isLoading,
    error,
    isAuthenticated
  };
} 