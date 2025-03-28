import type { OktoPortfolioData } from '@/types/okto'
import { observable } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query'
import { QueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '../authenticate'
import { OKTO_API_URL } from '../client'
import { oktoState } from '../state'
import { createAuthenticatedFetcher } from '../utils/fetcher'
import { getCurrentWallets, refreshWallets } from './wallet'

// Create a query client instance if it doesn't exist
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30000, // 30 seconds
            refetchOnWindowFocus: true,
        },
    },
})

// Track if a portfolio fetch is in progress to prevent duplicate calls
let isFetchingPortfolio = false
let lastFetchTimestamp = 0
const FETCH_DEBOUNCE_MS = 1000 // 1 second debounce

// Default portfolio data with zero values for display purposes
const DEFAULT_PORTFOLIO_DATA: OktoPortfolioData = {
    aggregated_data: {
        holdings_count: '0',
        holdings_price_inr: '0.00',
        holdings_price_usdt: '0.00',
        total_holding_price_inr: '0.00',
        total_holding_price_usdt: '0.00',
    },
    group_tokens: [],
}

/**
 * Fetches portfolio data for the authenticated user
 */
export async function fetchPortfolio(): Promise<OktoPortfolioData | null> {
    // Prevent duplicate calls within debounce period
    const now = Date.now()
    if (isFetchingPortfolio) {
        console.log('💼 [okto-portfolio] Fetch already in progress, skipping')
        return null
    }

    if (now - lastFetchTimestamp < FETCH_DEBOUNCE_MS) {
        // Return current data if within debounce period
        const currentData = portfolioState$.get()
        if (currentData) {
            console.log('💼 [okto-portfolio] Within debounce period, returning current data')
            return currentData
        }
    }

    try {
        isFetchingPortfolio = true
        lastFetchTimestamp = now
        console.log('💼 [okto-portfolio] Starting portfolio fetch')

        // Check if user is authenticated
        if (!isAuthenticated()) {
            console.log('💼 [okto-portfolio] User not authenticated, aborting fetch')
            isFetchingPortfolio = false
            return null
        }

        // First try to get wallets from getCurrentWallets
        let wallets = getCurrentWallets()
        console.log('💼 [okto-portfolio] Current wallets:', wallets?.length || 0)

        // If that fails, try to get wallets from oktoState
        if (!wallets || wallets.length === 0) {
            const stateWallets = oktoState.auth.wallets.get()
            console.log('💼 [okto-portfolio] State wallets:', stateWallets?.length || 0)
            if (stateWallets && stateWallets.length > 0) {
                wallets = stateWallets
                console.log('💼 [okto-portfolio] Using wallets from state')
            }
        }

        if (!wallets || wallets.length === 0) {
            // Try to fetch wallets first
            try {
                console.log('💼 [okto-portfolio] No wallets found, refreshing wallets')
                const fetchedWallets = await refreshWallets()
                console.log('💼 [okto-portfolio] Refreshed wallets:', fetchedWallets?.length || 0)

                if (!fetchedWallets || fetchedWallets.length === 0) {
                    // One last attempt - check oktoState again after refresh
                    const stateWalletsAfterRefresh = oktoState.auth.wallets.get()
                    console.log(
                        '💼 [okto-portfolio] State wallets after refresh:',
                        stateWalletsAfterRefresh?.length || 0,
                    )
                    if (stateWalletsAfterRefresh && stateWalletsAfterRefresh.length > 0) {
                        wallets = stateWalletsAfterRefresh
                        console.log('💼 [okto-portfolio] Using wallets from state after refresh')
                    } else {
                        console.log('💼 [okto-portfolio] No wallets found after all attempts')

                        // Return current portfolio data if available instead of null
                        const currentPortfolio = portfolioState$.get()
                        if (currentPortfolio) {
                            console.log('💼 [okto-portfolio] Returning existing portfolio data')
                            isFetchingPortfolio = false
                            return currentPortfolio
                        }

                        // Initialize with default data if nothing else is available
                        console.log('💼 [okto-portfolio] Initializing with default portfolio data')
                        portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
                        isFetchingPortfolio = false
                        return DEFAULT_PORTFOLIO_DATA
                    }
                } else {
                    wallets = fetchedWallets
                    console.log('💼 [okto-portfolio] Using freshly fetched wallets')
                }
            } catch (error) {
                console.error('💼 [okto-portfolio] Error refreshing wallets:', error)

                // Return current portfolio data if available instead of null
                const currentPortfolio = portfolioState$.get()
                if (currentPortfolio) {
                    console.log('💼 [okto-portfolio] Returning existing portfolio data after wallet refresh error')
                    isFetchingPortfolio = false
                    return currentPortfolio
                }

                // Initialize with default data if nothing else is available
                console.log('💼 [okto-portfolio] Initializing with default portfolio data after wallet refresh error')
                portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
                isFetchingPortfolio = false
                return DEFAULT_PORTFOLIO_DATA
            }
        }

        // Create an authenticated fetcher
        console.log('💼 [okto-portfolio] Creating authenticated fetcher')
        const fetchWithAuth = await createAuthenticatedFetcher()
        if (!fetchWithAuth) {
            console.error('💼 [okto-portfolio] Failed to create authenticated fetcher')

            // Return current portfolio data if available instead of null
            const currentPortfolio = portfolioState$.get()
            if (currentPortfolio) {
                console.log('💼 [okto-portfolio] Returning existing portfolio data after fetcher creation error')
                isFetchingPortfolio = false
                return currentPortfolio
            }

            // Initialize with default data if nothing else is available
            console.log('💼 [okto-portfolio] Initializing with default portfolio data after fetcher creation error')
            portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
            isFetchingPortfolio = false
            return DEFAULT_PORTFOLIO_DATA
        }

        // Use the fetcher to make the API call to the correct endpoint
        console.log('💼 [okto-portfolio] Fetching portfolio data from API')
        try {
            // Log the URL that will be used for the API call
            console.log('💼 [okto-portfolio] API URL:', `${OKTO_API_URL}/aggregated-portfolio`)

            const response = await fetchWithAuth('/aggregated-portfolio')
            console.log('💼 [okto-portfolio] Portfolio API response:', response?.status)

            // Check if the response is valid
            if (!response || response.status !== 'success' || !response.data) {
                console.error('💼 [okto-portfolio] Invalid portfolio response:', response)

                // Return current portfolio data if available instead of null
                const currentPortfolio = portfolioState$.get()
                if (currentPortfolio) {
                    console.log('💼 [okto-portfolio] Returning existing portfolio data after invalid API response')
                    isFetchingPortfolio = false
                    return currentPortfolio
                }

                // Initialize with default data if nothing else is available
                console.log('💼 [okto-portfolio] Initializing with default portfolio data after invalid API response')
                portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
                isFetchingPortfolio = false
                return DEFAULT_PORTFOLIO_DATA
            }

            // Update the portfolio state directly to ensure it's available immediately
            const portfolioData = response.data as OktoPortfolioData
            console.log(
                '💼 [okto-portfolio] Portfolio data received:',
                portfolioData.aggregated_data ? 'has aggregated data' : 'no aggregated data',
                portfolioData.group_tokens ? `has ${portfolioData.group_tokens.length} tokens` : 'no tokens',
            )
            portfolioState$.set(portfolioData)

            // Return the portfolio data
            console.log('💼 [okto-portfolio] Successfully fetched portfolio data:', response.data)
            return portfolioData
        } catch (error) {
            console.error('💼 [okto-portfolio] Error in API call:', error)

            // Return current portfolio data if available instead of null
            const currentPortfolio = portfolioState$.get()
            if (currentPortfolio) {
                console.log('💼 [okto-portfolio] Returning existing portfolio data after API error')
                isFetchingPortfolio = false
                return currentPortfolio
            }

            // Initialize with default data if nothing else is available
            console.log('💼 [okto-portfolio] Initializing with default portfolio data after API error')
            portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
            isFetchingPortfolio = false
            return DEFAULT_PORTFOLIO_DATA
        } finally {
            isFetchingPortfolio = false
        }
    } catch (error) {
        console.error('💼 [okto-portfolio] Error fetching portfolio:', error)

        // Return current portfolio data if available instead of null
        const currentPortfolio = portfolioState$.get()
        if (currentPortfolio) {
            console.log('💼 [okto-portfolio] Returning existing portfolio data after general error')
            isFetchingPortfolio = false
            return currentPortfolio
        }

        // Initialize with default data if nothing else is available
        console.log('💼 [okto-portfolio] Initializing with default portfolio data after general error')
        portfolioState$.set(DEFAULT_PORTFOLIO_DATA)
        isFetchingPortfolio = false
        return DEFAULT_PORTFOLIO_DATA
    }
}

/**
 * Observable state for portfolio using Legend State with Tanstack Query
 */
export const portfolioState$ = observable(
    syncedQuery({
        queryClient,
        query: {
            queryKey: ['okto-portfolio'],
            queryFn: fetchPortfolio,
            enabled: isAuthenticated(),
            staleTime: 30000, // 30 seconds
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
    }),
)

// Initialize portfolio state with default data
portfolioState$.set(DEFAULT_PORTFOLIO_DATA)

// Configure persistence with LocalStorage
syncObservable(portfolioState$, {
    persist: {
        name: 'okto-portfolio-data',
        plugin: ObservablePersistLocalStorage,
    },
})

/**
 * Get current portfolio data without observation
 */
export function getCurrentPortfolio(): OktoPortfolioData {
    const portfolio = portfolioState$.get()
    return portfolio || DEFAULT_PORTFOLIO_DATA
}

/**
 * Manually refresh portfolio data
 * @param forceRefresh If true, ignores debounce and cache
 */
export function refreshPortfolio(forceRefresh = false) {
    // Check if authenticated before proceeding
    if (!isAuthenticated()) {
        console.log('💼 [okto-portfolio] Not authenticated, skipping refresh')
        return Promise.resolve(null)
    }

    // Check if a fetch is already in progress
    if (isFetchingPortfolio && !forceRefresh) {
        console.log('💼 [okto-portfolio] Fetch already in progress, skipping refresh')
        return Promise.resolve(portfolioState$.get() || null)
    }

    // Implement debouncing, but skip if forceRefresh is true
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTimestamp < FETCH_DEBOUNCE_MS) {
        console.log('💼 [okto-portfolio] Too soon to refresh, returning current data')
        return Promise.resolve(portfolioState$.get() || null)
    }

    console.log(`💼 [okto-portfolio] ${forceRefresh ? 'Force refreshing' : 'Refreshing'} portfolio data`)

    // Invalidate the query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['okto-portfolio'] })

    // Reset the fetching flag to ensure we can fetch again
    isFetchingPortfolio = false

    // Also directly fetch portfolio to ensure immediate update
    return fetchPortfolio()
        .then(data => {
            if (data) {
                console.log('💼 [okto-portfolio] Portfolio refresh successful:', {
                    hasAggregatedData: !!data.aggregated_data,
                    tokenCount: data.group_tokens?.length || 0,
                })

                // Ensure the data has a lastUpdated timestamp
                if (!data.lastUpdated) {
                    const dataWithTimestamp = {
                        ...data,
                        lastUpdated: Date.now(),
                    }

                    // Update the state directly to ensure it's available immediately
                    portfolioState$.set(dataWithTimestamp)
                    return dataWithTimestamp
                }

                return data
            } else {
                console.log('💼 [okto-portfolio] Portfolio refresh returned no data')

                // If no data was returned but we have existing data, return that
                const existingData = portfolioState$.get()
                if (existingData) {
                    console.log('💼 [okto-portfolio] Returning existing portfolio data')
                    return existingData
                }

                // If we have no existing data, return default data
                console.log('💼 [okto-portfolio] Returning default portfolio data')
                const defaultData = {
                    ...DEFAULT_PORTFOLIO_DATA,
                    lastUpdated: Date.now(),
                }
                portfolioState$.set(defaultData)
                return defaultData
            }
        })
        .catch(error => {
            console.error('💼 [okto-portfolio] Error during portfolio refresh:', error)

            // If there's an error but we have existing data, return that
            const existingData = portfolioState$.get()
            if (existingData) {
                console.log('💼 [okto-portfolio] Returning existing portfolio data after error')
                return existingData
            }

            // If we have no existing data, return default data
            console.log('💼 [okto-portfolio] Returning default portfolio data after error')
            const defaultData = {
                ...DEFAULT_PORTFOLIO_DATA,
                lastUpdated: Date.now(),
            }
            portfolioState$.set(defaultData)
            return defaultData
        })
}
