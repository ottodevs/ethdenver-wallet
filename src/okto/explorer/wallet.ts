import { observable } from '@legendapp/state'
import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query'
import { QueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '../authenticate'
import { oktoState } from '../state'
import type { OktoWallet, OktoWalletsResponse } from '../types'
import { createAuthenticatedFetcher } from '../utils/fetcher'

// Create a query client instance
const queryClient = new QueryClient()

/**
 * Fetches all wallets for the authenticated user
 */
export async function fetchWallets(): Promise<OktoWallet[]> {
    console.log('👛 [okto-wallet] Starting wallet fetch')
    try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
            console.log('👛 [okto-wallet] User not authenticated, aborting fetch')
            return []
        }

        // Create an authenticated fetcher
        console.log('👛 [okto-wallet] Creating authenticated fetcher')
        const fetchWithAuth = await createAuthenticatedFetcher()
        if (!fetchWithAuth) {
            console.log('👛 [okto-wallet] Failed to create authenticated fetcher, trying to recover')
            // Try to recover from localStorage
            try {
                const authData = localStorage.getItem('okto_auth_state')
                if (authData) {
                    console.log('👛 [okto-wallet] Found auth data in localStorage, attempting to re-authenticate')
                    const { authenticateWithIdToken } = await import('../authenticate')
                    const parsedAuth = JSON.parse(authData)
                    if (parsedAuth && parsedAuth.idToken) {
                        console.log('👛 [okto-wallet] Re-authenticating with stored ID token')
                        await authenticateWithIdToken(parsedAuth.idToken)
                        // Try creating the fetcher again
                        console.log('👛 [okto-wallet] Creating authenticated fetcher after re-authentication')
                        const retryFetcher = await createAuthenticatedFetcher()
                        if (!retryFetcher) {
                            console.log(
                                '👛 [okto-wallet] Failed to create authenticated fetcher after re-authentication',
                            )
                            return []
                        }
                        // Continue with the retry fetcher
                        console.log(
                            '👛 [okto-wallet] Successfully created authenticated fetcher after re-authentication',
                        )
                        return await fetchWalletsWithAuth(retryFetcher)
                    }
                }
                console.log('👛 [okto-wallet] No valid auth data found in localStorage')
            } catch (error) {
                console.error('👛 [okto-wallet] Error during recovery attempt:', error)
                return []
            }

            console.log('👛 [okto-wallet] Recovery failed, returning empty wallet list')
            return []
        }

        console.log('👛 [okto-wallet] Successfully created authenticated fetcher, fetching wallets')
        return await fetchWalletsWithAuth(fetchWithAuth)
    } catch (error) {
        console.error('👛 [okto-wallet] Error fetching wallets:', error)
        return []
    }
}

/**
 * Helper function to fetch wallets with an authenticated fetcher
 */
async function fetchWalletsWithAuth(
    fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<OktoWalletsResponse>,
): Promise<OktoWallet[]> {
    try {
        console.log('👛 [okto-wallet] Making API call to /wallets endpoint')
        // Use the fetcher to make the API call
        const response = await fetchWithAuth('/wallets')
        console.log('👛 [okto-wallet] Received response from /wallets endpoint:', response)

        // Extract wallets from response
        const wallets = response?.data || ([] as OktoWallet[])
        console.log('👛 [okto-wallet] Extracted wallets:', wallets.length)

        // Update the okto state with the wallets
        if (wallets && wallets.length > 0) {
            console.log('👛 [okto-wallet] Updating okto state with wallets')
            oktoState.auth.wallets.set(wallets)
            console.log('👛 [okto-wallet] Wallets updated in state')

            // Invalidate portfolio queries immediately
            console.log('👛 [okto-wallet] Invalidating portfolio queries')
            queryClient.invalidateQueries({ queryKey: ['okto-portfolio'] })
        } else {
            console.log('👛 [okto-wallet] No wallets found in response')
        }

        return wallets
    } catch (error) {
        console.error('👛 [okto-wallet] Error in fetchWalletsWithAuth:', error)
        return []
    }
}

/**
 * Observable state for wallets using Legend App State with Tanstack Query
 */
export const walletsState$ = observable(
    syncedQuery({
        queryClient,
        query: {
            queryKey: ['okto-wallets'],
            queryFn: fetchWallets,
            enabled: isAuthenticated(),
            staleTime: 60000, // 1 minute
        },
    }),
)

/**
 * Get current wallets without observation
 */
export function getCurrentWallets(): OktoWallet[] | undefined {
    return walletsState$.get()
}

/**
 * Manually refresh wallets data
 */
export function refreshWallets() {
    // Check if authenticated before proceeding
    if (!isAuthenticated()) {
        console.log('👛 [okto-wallet] Not authenticated, skipping wallet refresh')
        return Promise.resolve([])
    }

    console.log('👛 [okto-wallet] Starting wallet refresh')

    // First invalidate the query
    queryClient.invalidateQueries({ queryKey: ['okto-wallets'] })

    // Directly fetch wallets to ensure immediate update and return the promise
    return fetchWallets()
        .then(wallets => {
            console.log('👛 [okto-wallet] Wallet refresh completed, wallets:', wallets?.length || 0)

            // Ensure portfolio is refreshed after wallets
            if (wallets && wallets.length > 0) {
                console.log('👛 [okto-wallet] Invalidating portfolio queries after wallet refresh')
                queryClient.invalidateQueries({ queryKey: ['okto-portfolio'] })
            }

            return wallets
        })
        .catch(error => {
            console.error('👛 [okto-wallet] Error refreshing wallets:', error)

            // Return current wallets from state if available
            const stateWallets = oktoState.auth.wallets.get()
            if (stateWallets && stateWallets.length > 0) {
                console.log('👛 [okto-wallet] Returning wallets from state after refresh error:', stateWallets.length)
                return stateWallets
            }

            return []
        })
}
