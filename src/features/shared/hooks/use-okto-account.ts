import { refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoActions, oktoState } from '@/okto/state'
import type { OktoWallet } from '@/okto/types'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook to access Okto account data
 */
export function useOktoAccount() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const refreshInProgressRef = useRef(false)
    const initialLoadDoneRef = useRef(false)
    const refreshAttemptsRef = useRef(0)

    // Get wallets and selected wallet from Okto state
    const wallets = oktoState.auth.wallets.get()
    const selectedWallet = oktoState.auth.selectedWallet.get()
    const isAuthenticated = oktoState.auth.isAuthenticated.get()

    // Get the selected account or the first wallet if no selected wallet
    const selectedAccount = selectedWallet || (wallets && wallets.length > 0 ? wallets[0] : null)

    // Refresh function with direct API call to ensure we get fresh data
    const refreshAccounts = useCallback(async () => {
        // Prevent concurrent refreshes
        if (refreshInProgressRef.current) {
            return null
        }

        try {
            refreshInProgressRef.current = true
            setIsLoading(true)
            setError(null)

            // Import and call refreshWallets directly from the API
            const { fetchWallets } = await import('@/okto/explorer/wallet')
            console.log('👛 [useOktoAccount] Fetching wallets...')
            const walletsResult = await fetchWallets()
            console.log('👛 [useOktoAccount] Wallets fetched:', walletsResult?.length || 0)

            // Explicitly update the global state with the fetched wallets
            if (walletsResult && walletsResult.length > 0) {
                oktoActions.setWallets(walletsResult)

                // If we have wallets but no selected wallet, select the first one
                if (!oktoState.auth.selectedWallet.get()) {
                    const firstWallet = walletsResult[0] as OktoWallet
                    oktoActions.setSelectedWallet(firstWallet)
                }

                // After refreshing wallets, also refresh portfolio
                try {
                    console.log('👛 [useOktoAccount] Refreshing portfolio after wallet fetch')
                    await refreshPortfolio()
                } catch (err) {
                    console.error('👛 [useOktoAccount] Error refreshing portfolio:', err)
                }
            } else {
                console.log('👛 [useOktoAccount] No wallets returned from API')
            }

            return walletsResult
        } catch (err) {
            console.error('👛 [useOktoAccount] Error refreshing accounts:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
            return null
        } finally {
            setIsLoading(false)
            refreshInProgressRef.current = false
            // Increment refresh attempts counter
            refreshAttemptsRef.current += 1
        }
    }, [])

    // Set selected wallet
    const selectWallet = useCallback(
        (walletId: string) => {
            if (!wallets) {
                return false
            }

            const wallet = wallets.find(w => w.caip_id === walletId || w.address === walletId)

            if (wallet) {
                oktoActions.setSelectedWallet(wallet)

                // Refresh portfolio after wallet selection
                refreshPortfolio().catch(err => {
                    console.error('👛 [useOktoAccount] Error refreshing portfolio after wallet selection:', err)
                })

                return true
            }

            return false
        },
        [wallets],
    )

    // Initial load - more aggressive to ensure we have wallets, but only once
    useEffect(() => {
        if (isAuthenticated && !initialLoadDoneRef.current) {
            console.log('👛 [useOktoAccount] Initial load triggered, authenticated:', isAuthenticated)
            console.log('👛 [useOktoAccount] Current wallets:', wallets?.length || 0)

            // If authenticated but no wallets, refresh accounts
            if (!wallets || wallets.length === 0) {
                console.log('👛 [useOktoAccount] No wallets found, refreshing accounts')
                refreshAccounts()
            }
            // If we have wallets but no selected wallet, select the first one
            else if (wallets.length > 0 && !selectedWallet) {
                console.log('👛 [useOktoAccount] Selecting first wallet')
                oktoActions.setSelectedWallet(wallets[0])

                // Also refresh portfolio to ensure we have data
                refreshPortfolio().catch(err => {
                    console.error('👛 [useOktoAccount] Error refreshing portfolio on initial load:', err)
                })
            }
            // If we have wallets and a selected wallet, still refresh portfolio to ensure data is fresh
            else if (wallets.length > 0 && selectedWallet) {
                console.log('👛 [useOktoAccount] Wallets and selected wallet found, refreshing portfolio')
                refreshPortfolio().catch(err => {
                    console.error('👛 [useOktoAccount] Error refreshing portfolio on initial load:', err)
                })
            }

            initialLoadDoneRef.current = true
        }
    }, [isAuthenticated, wallets, selectedWallet, refreshAccounts])

    // Subscribe to authentication changes
    useEffect(() => {
        const unsubscribe = oktoState.auth.isAuthenticated.onChange(isAuth => {
            if (isAuth) {
                // Reset initial load flag when auth changes
                initialLoadDoneRef.current = false
                // Reset refresh attempts counter
                refreshAttemptsRef.current = 0
            }
        })

        return unsubscribe
    }, [])

    // Retry mechanism for wallet fetching
    useEffect(() => {
        // Only retry if authenticated, no wallets, and we haven't tried too many times
        if (
            isAuthenticated &&
            (!wallets || wallets.length === 0) &&
            refreshAttemptsRef.current < 3 &&
            !refreshInProgressRef.current
        ) {
            console.log(`👛 [useOktoAccount] Retry attempt ${refreshAttemptsRef.current + 1} for wallet fetch`)

            // Add a delay before retrying to avoid hammering the API
            const retryTimeout = setTimeout(
                () => {
                    refreshAccounts()
                },
                2000 * (refreshAttemptsRef.current + 1),
            ) // Increasing backoff

            return () => clearTimeout(retryTimeout)
        }
    }, [isAuthenticated, wallets, refreshAccounts])

    return {
        wallets: wallets || [],
        selectedAccount,
        isLoading,
        error,
        refreshAccounts,
        selectWallet,
        hasWallets: !!(wallets && wallets.length > 0),
    }
}
