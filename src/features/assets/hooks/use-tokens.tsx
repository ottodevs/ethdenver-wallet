'use client'

import type { Chain } from '@/features/shared/services/chain-service'
import { useChainService } from '@/features/shared/services/chain-service'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

// Token list URLs - using local lists to avoid CSP issues
const TOKEN_LISTS = {
    default: '/api/tokens', // Change to a local API
    extended: '/api/tokens/extended', // Change to a local API
}

// Predefined tokens for the main chains
const PREDEFINED_TOKENS: Record<string, TokenData[]> = {
    ethereum: [
        { id: 'eth-ethereum', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        {
            id: 'usdc-ethereum',
            symbol: 'USDC',
            name: 'USD Coin',
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            decimals: 6,
        },
        {
            id: 'usdt-ethereum',
            symbol: 'USDT',
            name: 'Tether USD',
            contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6,
        },
        {
            id: 'dai-ethereum',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            decimals: 18,
        },
        {
            id: 'weth-ethereum',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
        },
    ],
    polygon: [
        { id: 'matic-polygon', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
        {
            id: 'usdc-polygon',
            symbol: 'USDC',
            name: 'USD Coin',
            contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            decimals: 6,
        },
        {
            id: 'usdt-polygon',
            symbol: 'USDT',
            name: 'Tether USD',
            contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            decimals: 6,
        },
        {
            id: 'dai-polygon',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            decimals: 18,
        },
        {
            id: 'weth-polygon',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            decimals: 18,
        },
    ],
    arbitrum: [
        { id: 'eth-arbitrum', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        {
            id: 'usdc-arbitrum',
            symbol: 'USDC',
            name: 'USD Coin',
            contractAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            decimals: 6,
        },
        {
            id: 'usdt-arbitrum',
            symbol: 'USDT',
            name: 'Tether USD',
            contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6,
        },
        {
            id: 'dai-arbitrum',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            contractAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            decimals: 18,
        },
        {
            id: 'weth-arbitrum',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18,
        },
    ],
    optimism: [
        { id: 'eth-optimism', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        {
            id: 'usdc-optimism',
            symbol: 'USDC',
            name: 'USD Coin',
            contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            decimals: 6,
        },
        {
            id: 'usdt-optimism',
            symbol: 'USDT',
            name: 'Tether USD',
            contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            decimals: 6,
        },
        {
            id: 'dai-optimism',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            contractAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            decimals: 18,
        },
        {
            id: 'weth-optimism',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0x4200000000000000000000000000000000000006',
            decimals: 18,
        },
    ],
    base: [
        { id: 'eth-base', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        {
            id: 'usdc-base',
            symbol: 'USDC',
            name: 'USD Coin',
            contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
        },
        {
            id: 'dai-base',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            contractAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            decimals: 18,
        },
        {
            id: 'weth-base',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0x4200000000000000000000000000000000000006',
            decimals: 18,
        },
    ],
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
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch token list from ${url}`)
        }
        return response.json()
    } catch (error) {
        console.warn(`Error fetching token list from ${url}, using predefined tokens:`, error)
        // Return an empty list in case of error
        return {
            name: 'Fallback Token List',
            timestamp: new Date().toISOString(),
            version: { major: 1, minor: 0, patch: 0 },
            tokens: [],
        }
    }
}

// Memoized helper function to get native token for a chain
const getNativeToken = (chain: Chain | undefined): TokenData[] => {
    if (!chain) return []

    const chainName = chain.name.toLowerCase()

    // Map of chain names to their native tokens
    const nativeTokens: Record<string, { symbol: string; name: string; decimals: number }> = {
        ethereum: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        polygon: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
        arbitrum: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        optimism: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        base: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        avalanche: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    }

    const nativeToken = nativeTokens[chainName]
    if (!nativeToken) return []

    return [
        {
            id: nativeToken.symbol.toLowerCase() + (chainName !== 'ethereum' ? `-${chainName}` : ''),
            symbol: nativeToken.symbol,
            name: nativeToken.name,
            decimals: nativeToken.decimals,
            logoURI: undefined,
            contractAddress: undefined,
        },
    ]
}

export function useTokens() {
    const { chains = [] } = useChainService()
    const [selectedChain, setSelectedChain] = useState('')
    const [selectedToken, setSelectedToken] = useState('')
    const [availableTokens, setAvailableTokens] = useState<TokenData[]>([])
    const [amount, setAmount] = useState('200')

    // Fetch token list using SWR for caching
    const { data: tokenList } = useSWR<TokenList>(TOKEN_LISTS.default, fetchTokenList, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 3600000, // 1 hour
    })

    // Memoize the selected token data to prevent recalculation on every render
    const selectedTokenData = useMemo(() => {
        return availableTokens.find(token => token.id === selectedToken)
    }, [availableTokens, selectedToken])

    // Update available tokens when selected chain or token list changes
    useEffect(() => {
        if (!selectedChain) {
            setAvailableTokens([])
            return
        }

        // Find the selected chain
        const chainData = chains.find(chain => chain.id.toString() === selectedChain.toString())
        if (!chainData) {
            console.warn(`Chain with ID ${selectedChain} not found`)
            setAvailableTokens([])
            return
        }

        // Get predefined tokens for this chain
        const chainName = chainData.name.toLowerCase()
        const predefinedTokensForChain = PREDEFINED_TOKENS[chainName] || []

        // Get native token for this chain
        const nativeTokensForChain = getNativeToken(chainData)

        // Combine predefined tokens with native tokens
        const combinedTokens = [...nativeTokensForChain, ...predefinedTokensForChain]

        // Add tokens from token list if available
        if (tokenList && tokenList.tokens) {
            const chainId = Number(selectedChain)
            const tokensFromList = tokenList.tokens
                .filter(token => token.chainId === chainId)
                .map(token => ({
                    id: `${token.symbol.toLowerCase()}-${chainName}`,
                    symbol: token.symbol,
                    name: token.name,
                    contractAddress: token.address,
                    decimals: token.decimals,
                    logoURI: token.logoURI,
                }))

            // Combine all tokens, removing duplicates by symbol
            const allTokens = [...combinedTokens]
            tokensFromList.forEach(token => {
                if (!allTokens.some(t => t.symbol === token.symbol)) {
                    allTokens.push(token)
                }
            })

            setAvailableTokens(allTokens)
        } else {
            setAvailableTokens(combinedTokens)
        }

        // Reset selected token if it's not available for this chain
        if (selectedToken) {
            const tokenStillAvailable = combinedTokens.some(token => token.id === selectedToken)
            if (!tokenStillAvailable) {
                setSelectedToken('')
            }
        }
    }, [selectedChain, tokenList, chains, selectedToken])

    // Set default token when available tokens change and no token is selected
    useEffect(() => {
        if (availableTokens.length > 0 && !selectedToken) {
            // Default to the first token (usually the native token)
            setSelectedToken(availableTokens[0].id)
        }
    }, [availableTokens, selectedToken])

    return {
        chains,
        selectedChain,
        setSelectedChain,
        selectedToken,
        setSelectedToken,
        selectedTokenData,
        availableTokens,
        amount,
        setAmount,
    }
}
