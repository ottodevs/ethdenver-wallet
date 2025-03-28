'use client'

import {
    fetchNetworks,
    getCaip2IdForChain,
    getNetworkByCaipId,
    getNetworkByChainId,
    networksState$,
    type OktoNetwork,
} from '@/okto/explorer/networks'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface Chain {
    id: number
    name: string
    icon: string
    caip2Id: string
}

export function useChainService() {
    // Initialize state from networksState$.getValue() to handle test mocks properly
    const initialState = (() => {
        try {
            const state = networksState$.getValue()
            return {
                networks: Array.isArray(state.networks) ? state.networks : [],
                isLoading: state.loading || false,
                error: state.error || null,
            }
        } catch (err) {
            console.error('Error getting initial networks state:', err)
            return {
                networks: [],
                isLoading: false,
                error: null,
            }
        }
    })()

    const [isLoading, setIsLoading] = useState(initialState.isLoading)
    const [error, setError] = useState<string | null>(initialState.error)
    const [hasInitialized, setHasInitialized] = useState(false)
    const [networks, setNetworks] = useState<OktoNetwork[]>(initialState.networks)

    // Fetch chains data - memoize to prevent recreation on every render
    const fetchChainsData = useCallback(
        async (forceRefresh = false) => {
            if (isLoading) return

            setIsLoading(true)
            setError(null)

            try {
                const fetchedNetworks = await fetchNetworks(forceRefresh)
                // Ensure networks is always an array
                setNetworks(Array.isArray(fetchedNetworks) ? fetchedNetworks : [])
                setHasInitialized(true)
            } catch (err) {
                console.error('Error fetching chains data:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch chains data')
            } finally {
                setIsLoading(false)
            }
        },
        [isLoading],
    )

    // Initialize data on mount - always call fetchNetworks for test compatibility
    useEffect(() => {
        // Always call fetchNetworks at least once for test compatibility
        if (!hasInitialized) {
            // If we already have networks from the initial state, just mark as initialized
            if (networks.length > 0) {
                setHasInitialized(true)
            } else {
                fetchChainsData()
            }
        }

        // Subscribe to network state changes
        let subscription: { unsubscribe: () => void } | undefined

        try {
            subscription = networksState$.subscribe(state => {
                // Ensure networks is always an array
                setNetworks(Array.isArray(state.networks) ? state.networks : [])
                setIsLoading(state.loading)
                // Make sure to propagate the error state from the networksState$ observable
                setError(state.error)
            })
        } catch (err) {
            console.error('Error subscribing to networks state:', err)
            setError(err instanceof Error ? err.message : 'Error subscribing to networks state')
        }

        return () => {
            // Safely unsubscribe if subscription exists
            if (subscription && typeof subscription.unsubscribe === 'function') {
                try {
                    subscription.unsubscribe()
                } catch (err) {
                    console.error('Error unsubscribing from networks state:', err)
                }
            }
        }
    }, [fetchChainsData, hasInitialized, networks.length])

    // Transform networks to chains format - memoize to prevent recalculation on every render
    const chains = useMemo(() => {
        // Ensure networks is an array before mapping
        if (!Array.isArray(networks)) {
            console.warn('Networks is not an array:', networks)
            return []
        }

        return networks.map(network => ({
            id: network.chain_id,
            name: network.network_name,
            icon: network.logo || `/chain-icons/${network.network_name.toLowerCase()}.svg`,
            caip2Id: network.caip_id,
        }))
    }, [networks])

    // Memoize the refetch function to prevent recreation on every render
    const refetch = useCallback((forceRefresh = true) => fetchChainsData(forceRefresh), [fetchChainsData])

    // Return the hook data
    return {
        chains,
        isLoading,
        error,
        hasInitialized,
        refetch,
        getCaip2IdForChain,
    }
}

// Export helper functions directly
export { getCaip2IdForChain, getNetworkByCaipId, getNetworkByChainId }
