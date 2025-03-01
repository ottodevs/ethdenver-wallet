"use client";

import { useEffect, useState } from "react";
import { useOkto, UserOp } from "@okto_web3/react-sdk";
import { getPortfolioNFT, nftTransfer } from "@okto_web3/react-sdk";
import { useOktoAccount } from "@/hooks/use-okto-account";

export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  collectionAddress: string;
  tokenId: string;
  chain: string;
  caip2Id: string;
}

export function useNftService() {
  const oktoClient = useOkto();
  const { selectedAccount } = useOktoAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      if (!oktoClient || !selectedAccount) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const nftData = await getPortfolioNFT(oktoClient);
        
        // Transform the NFT data
        const formattedNFTs: NFT[] = nftData.map(nft => ({
          id: nft.nftId,
          name: nft.nftName,
          image: nft.image || "/placeholder-nft.svg",
          collection: nft.collectionName,
          collectionAddress: nft.collectionAddress,
          tokenId: nft.nftId,
          chain: nft.networkName.toLowerCase(),
          caip2Id: getCaip2IdForChain(nft.networkName.toLowerCase())
        }));
        
        setNfts(formattedNFTs);
      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        setError("Failed to load NFT data");
        
        // Fallback to empty state
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, [oktoClient, selectedAccount]);

  const transferNFT = async (nft: NFT, recipientAddress: string) => {
    if (!oktoClient) {
      throw new Error("Okto client not initialized");
    }

    try {
      const nftParams = {
        caip2Id: nft.caip2Id,
        collectionAddress: nft.collectionAddress as `0x${string}`,
        nftId: nft.tokenId,
        recipientWalletAddress: recipientAddress as `0x${string}`,
        amount: BigInt(1),
        nftType: "ERC721" as const, // Assuming ERC721, adjust as needed
      };
      
      const userOp = await nftTransfer(oktoClient, nftParams);
      const signedUserOp = await oktoClient.signUserOp(userOp as UserOp);
      const txHash = await oktoClient.executeUserOp(signedUserOp);
      
      return txHash;
    } catch (error) {
      console.error("NFT transfer failed:", error);
      throw error;
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
    
    return chainMap[chain] || "eip155:1"; // Default to Ethereum mainnet
  }

  return {
    nfts,
    transferNFT,
    isLoading,
    error
  };
} 