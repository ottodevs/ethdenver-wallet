'use client'

import { fetchNetworks, networksState$, type OktoNetwork } from '@/okto/explorer/networks'
import { useCallback, useEffect, useState } from 'react'

/**
 * Hook to access and manage Okto networks data
 */
export function useOktoNetworks() {
    // Initialize state from networksState$.getValue() to handle test mocks properly
    const initialState = (() => {
        try {
            const state = networksState$.getValue()
            return {
                networks: Array.isArray(state.networks) ? state.networks : [],
                isLoading: state.loading || false,
                error: state.error || null,
                lastUpdated: state.lastUpdated || null,
            }
        } catch (err) {
            console.error('Error getting initial networks state:', err)
            return {
                networks: [],
                isLoading: false,
                error: null,
                lastUpdated: null,
            }
        }
    })()

    const [isLoading, setIsLoading] = useState(initialState.isLoading)
    const [error, setError] = useState<string | null>(initialState.error)
    const [hasInitialized, setHasInitialized] = useState(false)
    const [networks, setNetworks] = useState<OktoNetwork[]>(initialState.networks)
    const [lastUpdated, setLastUpdated] = useState<number | null>(initialState.lastUpdated)

    // Fetch networks data
    const fetchNetworksData = useCallback(
        async (forceRefresh = false) => {
            if (isLoading) return

            setIsLoading(true)
            setError(null)

            try {
                const fetchedNetworks = await fetchNetworks(forceRefresh)
                // Ensure networks is always an array
                setNetworks(Array.isArray(fetchedNetworks) ? fetchedNetworks : [])
                setLastUpdated(Date.now())
                setHasInitialized(true)
            } catch (err) {
                console.error('Error fetching networks data:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch networks data')
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
                fetchNetworksData()
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
                setLastUpdated(state.lastUpdated)
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
    }, [fetchNetworksData, hasInitialized, networks.length])

    // Return the hook data
    return {
        networks,
        isLoading,
        error,
        hasInitialized,
        lastUpdated,
        refetch: (forceRefresh = true) => fetchNetworksData(forceRefresh),
    }
}

/**
 * Hook to get a specific network by ID
 */
export function useNetwork(networkId?: string | number | null) {
    const { networks, isLoading, error, hasInitialized, refetch } = useOktoNetworks()

    // Find the network by ID (chain_id)
    const network = networkId
        ? networks.find(n => {
              if (typeof networkId === 'number') {
                  return n.chain_id === networkId
              }
              // Para compatibilidad con código existente que usa strings
              return n.chain_id.toString() === networkId || n.network_name.toLowerCase() === networkId.toLowerCase()
          })
        : undefined

    return {
        network,
        isLoading,
        error,
        hasInitialized,
        refetch,
    }
}

/**
 * Hook to get a specific network by CAIP ID
 */
export function useNetworkByCaipId(caipId?: string | null) {
    const { networks, isLoading, error, hasInitialized, refetch } = useOktoNetworks()

    // Find the network by CAIP ID
    const network = caipId ? networks.find(n => n.caip_id === caipId) : undefined

    return {
        network,
        isLoading,
        error,
        hasInitialized,
        refetch,
    }
}
