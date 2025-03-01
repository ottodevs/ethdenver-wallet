"use client";

import { useEffect, useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
import { getChains } from "@okto_web3/react-sdk";

export interface Chain {
  id: string;
  name: string;
  icon: string;
  caip2Id: string;
}

export function useChainService() {
  const oktoClient = useOkto();
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChains() {
      if (!oktoClient) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const chainsData = await getChains(oktoClient);
        
        // Transform the chains data
        const formattedChains: Chain[] = chainsData.map(chain => {
          // Map network name to CAIP-2 ID
          const caip2Id = getCaip2IdForChain(chain.networkName.toLowerCase());
          
          return {
            id: chain.chainId,
            name: chain.networkName,
            icon: chain.logo || "/chain-icons/ethereum.svg", // Fallback icon
            caip2Id
          };
        });
        
        setChains(formattedChains);
        
        // Set default selected chain
        if (formattedChains.length > 0) {
          setSelectedChain(formattedChains[0]);
        }
      } catch (err) {
        console.error("Failed to fetch chains:", err);
        setError("Failed to load blockchain networks");
        
        // Fallback to empty state
        setChains([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChains();
  }, [oktoClient]);

  const selectChain = (chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
    }
  };

  // Helper function to get CAIP-2 ID for a chain
  function getCaip2IdForChain(chainName: string): string {
    const chainMap: Record<string, string> = {
      ethereum: "eip155:1",
      polygon: "eip155:137",
      arbitrum: "eip155:42161",
      optimism: "eip155:10",
      base: "eip155:8453"
    };
    
    return chainMap[chainName] || "eip155:1"; // Default to Ethereum mainnet
  }

  return {
    chains,
    selectedChain,
    selectChain,
    isLoading,
    error
  };
} 