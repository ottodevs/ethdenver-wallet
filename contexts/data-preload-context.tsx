"use client";

import { useAuth } from "@/contexts/auth-context";
import { TokenBalance } from "@/hooks/use-okto-portfolio";
import { Transaction } from "@/hooks/use-okto-transactions";
import { Chain } from "@/services/chain-service";
import { NFT } from "@/services/nft-service";
import { getChains, getPortfolio, getPortfolioActivity, getPortfolioNFT, useOkto } from "@okto_web3/react-sdk";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

// Cache keys
const CACHE_KEYS = {
  PORTFOLIO: "okto_cache_portfolio",
  TRANSACTIONS: "okto_cache_transactions",
  NFTS: "okto_cache_nfts",
  CHAINS: "okto_cache_chains",
  TIMESTAMP: "okto_cache_timestamp"
};

// Cache duration (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Background refresh interval (2 minutes)
const REFRESH_INTERVAL = 2 * 60 * 1000;

interface PreloadedData {
  portfolio: {
    tokens: TokenBalance[];
    totalBalanceUsd: number;
  } | null;
  transactions: Transaction[] | null;
  nfts: NFT[] | null;
  chains: Chain[] | null;
  lastUpdated: number;
}

interface DataPreloadContextType {
  data: PreloadedData;
  isLoading: boolean;
  error: string | null;
  refreshData: (forceRefresh?: boolean) => Promise<void>;
}

const DataPreloadContext = createContext<DataPreloadContextType | undefined>(undefined);

export function DataPreloadProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const oktoClient = useOkto();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreloadedData>({
    portfolio: null,
    transactions: null,
    nfts: null,
    chains: null,
    lastUpdated: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cached data from localStorage on mount - do this immediately
  useEffect(() => {
    const loadCachedData = () => {
      try {
        if (typeof window === 'undefined') return;
        
        const cachedTimestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
        if (!cachedTimestamp) return;
        
        const timestamp = parseInt(cachedTimestamp, 10);
        if (Date.now() - timestamp > CACHE_DURATION) return;
        
        const portfolio = JSON.parse(localStorage.getItem(CACHE_KEYS.PORTFOLIO) || 'null');
        const transactions = JSON.parse(localStorage.getItem(CACHE_KEYS.TRANSACTIONS) || 'null');
        const nfts = JSON.parse(localStorage.getItem(CACHE_KEYS.NFTS) || 'null');
        const chains = JSON.parse(localStorage.getItem(CACHE_KEYS.CHAINS) || 'null');
        
        if (portfolio || transactions || nfts || chains) {
          setData({
            portfolio,
            transactions,
            nfts,
            chains,
            lastUpdated: timestamp
          });
          setIsLoading(false); // Set loading to false immediately when we have cached data
          console.log("Loaded cached data from localStorage");
        }
      } catch (err) {
        console.error("Error loading cached data:", err);
        // Continue with empty data if cache loading fails
      }
    };
    
    loadCachedData();
  }, []);

  // Save data to localStorage
  const saveToCache = (newData: PreloadedData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CACHE_KEYS.PORTFOLIO, JSON.stringify(newData.portfolio));
      localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(newData.transactions));
      localStorage.setItem(CACHE_KEYS.NFTS, JSON.stringify(newData.nfts));
      localStorage.setItem(CACHE_KEYS.CHAINS, JSON.stringify(newData.chains));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, newData.lastUpdated.toString());
    } catch (err) {
      console.error("Error saving data to cache:", err);
    }
  };

  // Helper function to get CAIP-2 ID for a chain
  function getCaip2IdForChain(chain: string): string {
    const chainMap: Record<string, string> = {
      ethereum: "eip155:1",
      polygon: "eip155:137",
      arbitrum: "eip155:42161",
      optimism: "eip155:10",
      base: "eip155:8453"
    };
    
    return chainMap[chain.toLowerCase()] || "eip155:1"; // Default to Ethereum mainnet
  }

  // Fetch all data
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Skip if data is fresh and not forcing refresh
    if (!forceRefresh && 
        data.lastUpdated && 
        Date.now() - data.lastUpdated < CACHE_DURATION) {
      setIsLoading(false);
      return;
    }
    
    if (!oktoClient) {
      console.error("Okto client not available");
      setError("Wallet connection not available");
      setIsLoading(false);
      return;
    }
   
    const isAuth = await checkAuthStatus();
    if (!isAuth) {
      console.log("User not authenticated");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching fresh data from API...");
      
      // Fetch all data in parallel for better performance
      const [portfolioData, transactionsData, nftsData, chainsData] = await Promise.all([
        getPortfolio(oktoClient),
        getPortfolioActivity(oktoClient),
        getPortfolioNFT(oktoClient),
        getChains(oktoClient)
      ]);
      
      // Transform portfolio data
      const formattedTokens = portfolioData.groupTokens.map((group) => ({
        id: group.id,
        name: group.name,
        symbol: group.symbol,
        icon: group.tokenImage || "/placeholder.svg?height=40&width=40",
        chain: group.networkName.toLowerCase(),
        balance: parseFloat(group.balance),
        valueUsd: parseFloat(group.holdingsPriceUsdt),
        contractAddress: group.tokenAddress || "",
        isNative: !group.tokenAddress || group.tokenAddress === ""
      }));
      
      const totalUsd = parseFloat(portfolioData.aggregatedData.totalHoldingPriceUsdt);
      
      // Transform transactions data
      const formattedTransactions = Array.isArray(transactionsData) ? transactionsData.map((tx) => {
        return {
          id: tx?.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: tx?.transferType?.toLowerCase() || "unknown",
          status: tx?.status?.toLowerCase() || "unknown",
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
      }) : [];
      
      // Transform NFT data
      const formattedNfts: NFT[] = [];
      if (Array.isArray(nftsData) && nftsData.length > 0) {
        nftsData.forEach(nft => {
          formattedNfts.push({
            id: nft.nftId || `nft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: nft.nftName || "Unnamed NFT",
            image: nft.image || "/placeholder-nft.svg",
            collection: nft.collectionName || "Unknown Collection",
            collectionAddress: nft.collectionAddress || "",
            tokenId: nft.nftId || "",
            chain: (nft.networkName || "ethereum").toLowerCase(),
            caip2Id: getCaip2IdForChain((nft.networkName || "ethereum").toLowerCase())
          });
        });
      }
      
      // Transform chains data
      const formattedChains = chainsData.map((chain) => ({
        id: chain.chainId,
        name: chain.networkName,
        icon: chain.logo || "/chain-icons/ethereum.svg",
        caip2Id: getCaip2IdForChain(chain.networkName.toLowerCase())
      }));
      
      // Update state with all fetched data
      const newData = {
        portfolio: {
          tokens: formattedTokens,
          totalBalanceUsd: totalUsd
        },
        transactions: formattedTransactions,
        nfts: formattedNfts,
        chains: formattedChains,
        lastUpdated: Date.now()
      };
      
      setData(newData);
      saveToCache(newData);
      setIsInitialized(true);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  }, [data.lastUpdated, oktoClient, checkAuthStatus]);

  // Fetch data when authentication changes or component mounts
  useEffect(() => {
    if (isAuthenticated && oktoClient && !isInitialized) {
      console.log("Initial data fetch triggered");
      fetchAllData(true); // Force refresh on initial load
    }
  }, [isAuthenticated, oktoClient, fetchAllData, isInitialized]);

  // Set up background refresh
  useEffect(() => {
    if (!isAuthenticated || !oktoClient) return;
    
    const intervalId = setInterval(() => {
      console.log("Background refresh triggered");
      fetchAllData();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, oktoClient, fetchAllData]);

  return (
    <DataPreloadContext.Provider
      value={{
        data,
        isLoading,
        error,
        refreshData: fetchAllData
      }}
    >
      {children}
    </DataPreloadContext.Provider>
  );
}

export function usePreloadedData() {
  const context = useContext(DataPreloadContext);
  if (context === undefined) {
    throw new Error("usePreloadedData must be used within a DataPreloadProvider");
  }
  return context;
} 