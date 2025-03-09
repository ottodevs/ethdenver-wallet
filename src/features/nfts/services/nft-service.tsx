'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import type { UserOp } from '@okto_web3/react-sdk'
import { getPortfolioNFT, nftTransfer, useOkto } from '@okto_web3/react-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface NFT {
    id: string
    name: string
    image: string
    collection: string
    collectionAddress: string
    tokenId: string
    chain: string
    caip2Id: string
}

// NFT cache with timeout
const NFT_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
let nftCache: {
    data: NFT[] | null
    timestamp: number
} = {
    data: null,
    timestamp: 0,
}

export function useNftService() {
    const oktoClient = useOkto()
    const { selectedAccount } = useOktoAccount()
    const { isAuthenticated } = useAuth()
    const [nfts, setNfts] = useState<NFT[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasInitialized, setHasInitialized] = useState(false)

    const fetchNFTs = useCallback(
        async (forceRefresh = false) => {
            if (!oktoClient || !selectedAccount || !isAuthenticated) {
                setIsLoading(false)
                setHasInitialized(true)
                return
            }

            const now = Date.now()

            // Use cached data if available and not forcing refresh
            if (!forceRefresh && nftCache.data && now - nftCache.timestamp < NFT_CACHE_DURATION) {
                setNfts(nftCache.data)
                setIsLoading(false)
                setHasInitialized(true)
                return
            }

            // Only set loading to true on first load or when dependencies change
            if (!hasInitialized) {
                setIsLoading(true)
            }

            try {
                const response = await getPortfolioNFT(oktoClient)

                // Handle different response formats
                let nftData

                if (response && typeof response === 'object' && 'data' in response) {
                    nftData = response.data
                } else {
                    nftData = response
                }

                // Check if nftData exists and is an array
                if (Array.isArray(nftData) && nftData.length > 0) {
                    // Transform the NFT data
                    const formattedNFTs: NFT[] = nftData.map(nft => ({
                        id: nft.nftId || `nft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: nft.nftName || 'Unnamed NFT',
                        image: nft.image || '/placeholder-nft.svg',
                        collection: nft.collectionName || 'Unknown Collection',
                        collectionAddress: nft.collectionAddress || '',
                        tokenId: nft.nftId || '',
                        chain: (nft.networkName || 'ethereum').toLowerCase(),
                        caip2Id: getCaip2IdForChain((nft.networkName || 'ethereum').toLowerCase()),
                    }))

                    // Update cache
                    nftCache = {
                        data: formattedNFTs,
                        timestamp: now,
                    }

                    setNfts(formattedNFTs)
                } else {
                    // If nftData is not an array or is empty, set empty array (no error)
                    console.log('No NFTs found for this user')
                    setNfts([])
                }
            } catch (err) {
                console.error('Failed to fetch NFTs:', err)

                // Handle specific error cases
                if (
                    err &&
                    typeof err === 'object' &&
                    'response' in err &&
                    err.response &&
                    typeof err.response === 'object' &&
                    'data' in err.response
                ) {
                    const errorData = err.response.data
                    // Check for the specific "No Active Collections Found" error
                    if (
                        errorData &&
                        typeof errorData === 'object' &&
                        'status' in errorData &&
                        'error' in errorData &&
                        errorData.status === 'error' &&
                        errorData.error &&
                        typeof errorData.error === 'object' &&
                        'message' in errorData.error &&
                        'errorCode' in errorData.error &&
                        (errorData.error.message === 'No Active Collections Found' ||
                            errorData.error.errorCode === 'ER-TECH-0001')
                    ) {
                        console.log('No active NFT collections found - treating as empty state')
                        setNfts([])
                        setError(null)
                        return
                    }
                }

                // Check if error is related to no NFTs found
                if (
                    err instanceof Error &&
                    (err.message.includes('No NFTs found') ||
                        err.message.includes('not found') ||
                        err.message.includes('empty') ||
                        err.message.includes('No Active Collections'))
                ) {
                    // For "No NFTs found" or similar messages, just set empty array without error
                    setNfts([])
                    setError(null)
                } else {
                    // For other errors, show the error message
                    setError('Failed to load NFT data')
                }
            } finally {
                setIsLoading(false)
                setHasInitialized(true)
            }
        },
        [oktoClient, selectedAccount, isAuthenticated, hasInitialized],
    )

    // Initial fetch
    useEffect(() => {
        fetchNFTs()
    }, [fetchNFTs])

    // Memoize the transferNFT function
    const transferNFT = useCallback(
        async (nft: NFT, recipientAddress: string) => {
            if (!oktoClient) {
                throw new Error('Okto client not initialized')
            }

            try {
                const nftParams = {
                    caip2Id: nft.caip2Id,
                    collectionAddress: nft.collectionAddress as `0x${string}`,
                    nftId: nft.tokenId,
                    recipientWalletAddress: recipientAddress as `0x${string}`,
                    amount: BigInt(1),
                    nftType: 'ERC721' as const,
                }

                const userOp = await nftTransfer(oktoClient, nftParams)
                const signedUserOp = await oktoClient.signUserOp(userOp as UserOp)
                const txHash = await oktoClient.executeUserOp(signedUserOp)

                return txHash
            } catch (error) {
                console.error('NFT transfer failed:', error)
                throw error
            }
        },
        [oktoClient],
    )

    // Helper function to get CAIP-2 ID for a chain
    function getCaip2IdForChain(chain: string): string {
        const chainMap: Record<string, string> = {
            ethereum: 'eip155:1',
            polygon: 'eip155:137',
            arbitrum: 'eip155:42161',
            optimism: 'eip155:10',
            base: 'eip155:8453',
        }

        return chainMap[chain] || 'eip155:1' // Default to Ethereum mainnet
    }

    // Memoize return value
    const returnValue = useMemo(
        () => ({
            nfts,
            transferNFT,
            isLoading,
            error,
            refetch: () => fetchNFTs(true),
        }),
        [nfts, transferNFT, isLoading, error, fetchNFTs],
    )

    return returnValue
}
