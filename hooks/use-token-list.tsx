"use client"

import { Chain, useChainService } from "@/services/chain-service"
import { useEffect, useState } from "react"
import useSWR from "swr"

// Token list URLs - using popular maintained lists
const TOKEN_LISTS = {
  default: "https://tokens.uniswap.org",
  extended: "https://tokens.coingecko.com/uniswap/all.json"
}

interface TokenInfo {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

interface TokenList {
  name: string
  timestamp: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: TokenInfo[]
}

interface TokenData {
  id: string
  symbol: string
  name: string
  contractAddress?: string
  decimals: number
  logoURI?: string
}

// Helper function to fetch token list
async function fetchTokenList(url: string): Promise<TokenList> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch token list from ${url}`)
  }
  return response.json()
}

export function useTokenList() {
  const { chains } = useChainService()
  const [selectedChain, setSelectedChain] = useState("")
  const [selectedToken, setSelectedToken] = useState("")
  const [availableTokens, setAvailableTokens] = useState<TokenData[]>([])
  
  // Fetch token list
  const { data: tokenList, error: tokenListError } = useSWR<TokenList>(
    TOKEN_LISTS.default,
    fetchTokenList,
    { revalidateOnFocus: false }
  )

  const selectedTokenData = availableTokens.find(t => t.id === selectedToken)

  // Update available tokens when chain changes
  useEffect(() => {
    if (selectedChain && tokenList) {
      const chainData = chains.find(c => c.id === selectedChain)
      if (chainData) {
        // Convert chain ID to number for comparison with token list
        const chainIdNumber = parseInt(chainData.id)
        
        // Filter tokens by chain ID
        const tokensForChain = tokenList.tokens
          .filter(token => token.chainId === chainIdNumber)
          // Map to our format
          .map(token => ({
            id: `${token.symbol.toLowerCase()}-${chainData.name.toLowerCase()}`,
            symbol: token.symbol,
            name: token.name,
            contractAddress: token.address,
            decimals: token.decimals,
            logoURI: token.logoURI
          }))
          
        // Add native token if not present
        const nativeToken = getNativeToken(chainData)
        if (nativeToken.length > 0 && !tokensForChain.some(token => token.id === nativeToken[0].id)) {
          tokensForChain.push({
            ...nativeToken[0],
            contractAddress: '',
            logoURI: undefined
          })
        }
      
        setAvailableTokens(tokensForChain)
        // Reset selected token when chain changes
        setSelectedToken("")
      }
    } else {
      setAvailableTokens([])
      setSelectedToken("")
    }
  }, [selectedChain, chains, tokenList])

  // Helper function to get native token for a chain
  const getNativeToken = (chain: Chain) => {
    const chainName = chain.name.toLowerCase()
    
    // Map of chain names to their native tokens
    const nativeTokens: Record<string, {symbol: string, name: string, decimals: number}> = {
      "ethereum": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "polygon": { symbol: "MATIC", name: "Polygon", decimals: 18 },
      "arbitrum": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "optimism": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "base": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "avalanche": { symbol: "AVAX", name: "Avalanche", decimals: 18 },
    }
    
    const nativeToken = nativeTokens[chainName]
    if (!nativeToken) return []
    
    return [{
      id: nativeToken.symbol.toLowerCase() + (chainName !== "ethereum" ? `-${chainName}` : ""),
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      decimals: nativeToken.decimals,
      logoURI: undefined,
      contractAddress: undefined
    }]
  }

  return {
    chains,
    selectedChain,
    setSelectedChain,
    selectedToken,
    setSelectedToken,
    availableTokens,
    selectedTokenData,
    tokenListError
  }
} 