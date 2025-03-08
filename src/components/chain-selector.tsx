"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { getChains, useOkto } from "@okto_web3/react-sdk";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Chain {
  id: string;
  name: string;
  icon: string;
}

export function ChainSelector() {
  const oktoClient = useOkto();
  const { isAuthenticated } = useAuth();
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChains() {
      if (!oktoClient || !isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const chainsData = await getChains(oktoClient);
        
        // Transform the chains data
        const formattedChains: Chain[] = chainsData.map(chain => ({
          id: chain.chainId,
          name: chain.networkName,
          icon: chain.logo || "/chain-icons/ethereum.svg" // Fallback icon
        }));
        
        setChains(formattedChains);
        
        // Set default selected chain
        if (formattedChains.length > 0) {
          setSelectedChain(formattedChains[0].id);
        }
      } catch (error) {
        console.error("Error fetching chains:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChains();
  }, [oktoClient, isAuthenticated]);

  const handleChainChange = (value: string) => {
    setSelectedChain(value);
    // You might want to trigger other actions when chain changes
  };

  if (isLoading || chains.length === 0) {
    return null;
  }

  return (
    <Select value={selectedChain} onValueChange={handleChainChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select network" />
      </SelectTrigger>
      <SelectContent>
        {chains.map(chain => (
          <SelectItem key={chain.id} value={chain.id}>
            <div className="flex items-center">
              <Image 
                src={chain.icon} 
                alt={chain.name} 
                className="w-4 h-4 mr-2"
                onError={(e) => {
                  e.currentTarget.src = "/chain-icons/default.svg";
                }}
              />
              {chain.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 