import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchNftPortfolio } from '@/okto/explorer/nft'
import { oktoState } from '@/okto/state'
import { useObservable } from '@legendapp/state/react'

// Define types for NFT data
interface NftPortfolioData {
    count: number
    details: NftDetail[]
}

interface NftDetail {
    nft_id: string
    nft_name: string
    description: string
    image: string
    collection_name: string
    collection_address: string
    collection_image: string
    network_name: string
    quantity: string
    token_uri: string
    explorer_smart_contract_url: string
}

/**
 * Hook to access and manage Okto NFT portfolio data
 */
export function useOktoNft() {
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const [data, setData] = useState<NftPortfolioData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [hasNoCollections, setHasNoCollections] = useState(false)
    const refreshAttemptedRef = useRef(false)
    const refreshInProgressRef = useRef(false)
    const retryCountRef = useRef(0)
    const maxRetries = 3
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Refetch function with debouncing and retry logic
    const refetch = useCallback(async () => {
        // Prevent concurrent refreshes
        if (refreshInProgressRef.current) {
            console.log('🖼️ [useOktoNft] Refresh already in progress, skipping')
            return null
        }

        // Check if authenticated
        if (!isAuthenticated.get()) {
            console.log('🖼️ [useOktoNft] Not authenticated, skipping refresh')
            setIsLoading(false)
            return null
        }

        try {
            refreshInProgressRef.current = true
            setIsLoading(true)
            setError(null)
            setHasNoCollections(false)
            refreshAttemptedRef.current = true

            console.log('🖼️ [useOktoNft] Refreshing NFT portfolio data...')
            const result = await fetchNftPortfolio()

            console.log('🖼️ [useOktoNft] NFT data fetched:', result)

            // If result is null, it could be due to "No Active Collections" error
            // We'll check this in the catch block if an error is thrown
            if (result === null) {
                // Don't set an error, just mark as no collections
                setHasNoCollections(true)
                setIsLoading(false)
                retryCountRef.current = 0
                refreshInProgressRef.current = false
                return null
            }

            // Check if the result is an empty portfolio (no collections)
            if (result && result.count === 0 && (!result.details || result.details.length === 0)) {
                console.log('🖼️ [useOktoNft] Empty portfolio detected, setting hasNoCollections flag')
                setHasNoCollections(true)
                setData(result)
                setIsLoading(false)
                retryCountRef.current = 0
                refreshInProgressRef.current = false
                return result
            }

            setData(result)
            setIsLoading(false)
            retryCountRef.current = 0
            refreshInProgressRef.current = false
            return result
        } catch (err) {
            console.error('🖼️ [useOktoNft] Error fetching NFT portfolio:', err)

            // Check if this is the "No Active Collections Found" error
            const errorMessage = err instanceof Error ? err.message : String(err)
            if (errorMessage.includes('No Active Collections Found')) {
                console.log('🖼️ [useOktoNft] No active collections found, setting state')
                setHasNoCollections(true)
                setIsLoading(false)
                setError(null) // This is not a real error, just a state
                retryCountRef.current = 0
                refreshInProgressRef.current = false
                return null
            }

            setError(err instanceof Error ? err : new Error(String(err)))

            // Retry logic for other errors
            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                console.log(
                    `🖼️ [useOktoNft] Error refreshing, retry ${retryCountRef.current}/${maxRetries} in ${backoffTime}ms`,
                )

                // Clear any existing timeout
                if (refreshTimeoutRef.current) {
                    clearTimeout(refreshTimeoutRef.current)
                }

                refreshTimeoutRef.current = setTimeout(() => {
                    refreshInProgressRef.current = false
                    refetch()
                }, backoffTime)
            } else {
                setIsLoading(false)
                refreshInProgressRef.current = false
            }

            return null
        } finally {
            if (retryCountRef.current >= maxRetries || hasNoCollections) {
                refreshInProgressRef.current = false
            }
        }
    }, [isAuthenticated, hasNoCollections])

    // Initial load and subscription to authentication changes
    useEffect(() => {
        let isMounted = true

        const checkAndLoadData = async () => {
            if (!isMounted) return

            // If authenticated and no data has been loaded yet
            if (isAuthenticated.get() && !refreshAttemptedRef.current) {
                console.log('🖼️ [useOktoNft] Initial NFT data load')
                await refetch()
            }

            // If not authenticated, reset loading state
            if (!isAuthenticated.get()) {
                setIsLoading(false)
                setData(null)
                setHasNoCollections(false)
                retryCountRef.current = 0
                refreshAttemptedRef.current = false
            }
        }

        // Check for data on mount and when authentication changes
        checkAndLoadData()

        // Subscribe to authentication changes
        const unsubscribe = oktoState.auth.isAuthenticated.onChange(() => {
            if (isAuthenticated.get()) {
                console.log('🖼️ [useOktoNft] Authentication state changed to authenticated, refreshing data')
                refreshAttemptedRef.current = false
                retryCountRef.current = 0
                setHasNoCollections(false)
                checkAndLoadData()
            } else {
                console.log('🖼️ [useOktoNft] Authentication state changed to not authenticated')
                setIsLoading(false)
                setData(null)
                setHasNoCollections(false)
                retryCountRef.current = 0
                refreshAttemptedRef.current = false
            }
        })

        // Cleanup function
        return () => {
            isMounted = false
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }
            unsubscribe()
        }
    }, [isAuthenticated, refetch])

    return {
        data,
        isLoading: isLoading && isAuthenticated.get(),
        error,
        refetch,
        hasNoCollections,
    }
}
