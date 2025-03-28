import { isAuthenticated } from '@/okto/authenticate'
import { oktoState } from '@/okto/state'
import { createAuthenticatedFetcher } from '@/okto/utils/fetcher'
import { observable } from '@legendapp/state'
import { useCallback, useEffect, useState } from 'react'

// Define transaction state
export const transactionsState$ = observable({
    transactions: [] as Transaction[],
    pendingTransactions: [] as Transaction[],
    isLoading: false,
    error: null as Error | null,
    hasInitialized: false,
    lastUpdated: 0, // Timestamp of last successful update
})

// Transaction type
export interface Transaction {
    id: string
    type: string // 'send', 'receive', 'swap', etc.
    hash: string
    token: string
    amount: string
    timestamp: number
    status: string // 'pending', 'completed', 'failed'
    symbol: string
    explorerUrl?: string
    networkName?: string
    networkSymbol?: string
    to?: string
    from?: string
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Hook to access and manage Okto transaction data
 */
export function useOktoTransactions() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [hasInitialized, setHasInitialized] = useState(false)
    const [lastAuthState, setLastAuthState] = useState(false)

    // Get transactions from the observable state
    const transactions = transactionsState$.transactions.get()
    const pendingTransactions = transactionsState$.pendingTransactions.get()
    const lastUpdated = transactionsState$.lastUpdated.get()

    // Check if cache is valid
    const isCacheValid = lastUpdated > 0 && Date.now() - lastUpdated < CACHE_DURATION

    // Refresh function with improved error handling and caching
    const refetch = useCallback(
        async (forceRefresh = false) => {
            if (!isAuthenticated()) {
                console.log('💸 [useOktoTransactions] Not authenticated, skipping refetch')
                setError(new Error('Not authenticated'))
                return null
            }

            // Check if we have recent data and don't need to refresh
            if (!forceRefresh && isCacheValid && transactions.length > 0) {
                console.log('💸 [useOktoTransactions] Using cached transaction data')
                setHasInitialized(true)
                transactionsState$.hasInitialized.set(true)
                return true
            }

            try {
                setIsLoading(true)
                transactionsState$.isLoading.set(true)
                setError(null)
                transactionsState$.error.set(null)

                console.log('💸 [useOktoTransactions] Fetching transactions...')

                // Create an authenticated fetcher
                const fetchWithAuth = await createAuthenticatedFetcher()
                if (!fetchWithAuth) {
                    console.error('💸 [useOktoTransactions] Failed to create authenticated fetcher')
                    const fetcherError = new Error('Failed to create authenticated fetcher')
                    setError(fetcherError)
                    transactionsState$.error.set(fetcherError)
                    return null
                }

                // Fetch activity data directly from the API with timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

                try {
                    console.log('💸 [useOktoTransactions] Calling API endpoint: /portfolio/activity?page=1&size=10')
                    const response = await fetchWithAuth('/portfolio/activity?page=1&size=10', {
                        signal: controller.signal,
                    })

                    clearTimeout(timeoutId)

                    console.log('💸 [useOktoTransactions] API response:', response)

                    if (!response || !response.data || !response.data.activity) {
                        console.error('💸 [useOktoTransactions] Invalid activity response:', response)
                        const responseError = new Error('Invalid activity response')
                        setError(responseError)
                        transactionsState$.error.set(responseError)
                        return null
                    }

                    const activityData = response.data
                    console.log('💸 [useOktoTransactions] Activity data received:', {
                        count: activityData.count,
                        activities: activityData.activity.length,
                    })

                    if (activityData && activityData.activity) {
                        // Convert activity to transactions
                        const fetchedTransactions = activityData.activity.map(
                            (activity: {
                                id: string
                                transfer_type: string
                                tx_hash: string
                                name: string
                                quantity: string
                                timestamp: number
                                status: boolean
                                symbol: string
                                network_explorer_url: string
                                network_name: string
                                network_symbol: string
                            }) => {
                                // Create a unique ID by combining the activity ID with the hash if available
                                const uniqueId = activity.tx_hash
                                    ? `${activity.id}-${activity.tx_hash.substring(0, 8)}`
                                    : activity.id

                                return {
                                    id: uniqueId,
                                    type: activity.transfer_type === 'RECEIVE' ? 'receive' : 'send',
                                    hash: activity.tx_hash,
                                    token: activity.name,
                                    amount: activity.quantity,
                                    timestamp: activity.timestamp,
                                    status: activity.status ? 'completed' : 'failed',
                                    symbol: activity.symbol,
                                    explorerUrl: activity.network_explorer_url,
                                    networkName: activity.network_name,
                                    networkSymbol: activity.network_symbol,
                                }
                            },
                        )

                        // Update state
                        transactionsState$.transactions.set(fetchedTransactions)
                        // Update last updated timestamp
                        transactionsState$.lastUpdated.set(Date.now())
                        console.log('💸 [useOktoTransactions] Transactions fetched:', fetchedTransactions.length)
                    } else {
                        // If no activity data, set empty array
                        transactionsState$.transactions.set([])
                        // Still update timestamp to prevent immediate refetching
                        transactionsState$.lastUpdated.set(Date.now())
                        console.log('💸 [useOktoTransactions] No transactions found')
                    }

                    // Mark as initialized
                    setHasInitialized(true)
                    transactionsState$.hasInitialized.set(true)

                    return true
                } catch (fetchError: unknown) {
                    clearTimeout(timeoutId)

                    // Handle abort error
                    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                        console.error('💸 [useOktoTransactions] Request timed out')
                        throw new Error('Request timed out. Please try again.')
                    }

                    throw fetchError
                }
            } catch (err) {
                console.error('💸 [useOktoTransactions] Error fetching transactions:', err)
                const errorToSet = err instanceof Error ? err : new Error(String(err))
                setError(errorToSet)
                transactionsState$.error.set(errorToSet)

                // If we have cached data, still mark as initialized to show something
                if (transactions.length > 0) {
                    setHasInitialized(true)
                    transactionsState$.hasInitialized.set(true)
                }

                return null
            } finally {
                setIsLoading(false)
                transactionsState$.isLoading.set(false)
            }
        },
        [transactions, isCacheValid],
    )

    // Add a pending transaction (for optimistic UI)
    const addPendingTransaction = useCallback((transaction: Transaction) => {
        // Ensure the transaction has a unique ID
        const uniqueId = transaction.hash
            ? `${transaction.id}-${transaction.hash.substring(0, 8)}-${Date.now()}`
            : `${transaction.id}-${Date.now()}`

        const pendingTx = {
            ...transaction,
            id: uniqueId,
            status: 'pending',
        }

        const currentPending = transactionsState$.pendingTransactions.get()
        transactionsState$.pendingTransactions.set([pendingTx, ...currentPending])
        console.log('💸 [useOktoTransactions] Added pending transaction:', pendingTx.id)
    }, [])

    // Update a pending transaction
    const updatePendingTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
        const currentPending = transactionsState$.pendingTransactions.get()
        // Find the transaction by ID, which might be a compound ID
        const index = currentPending.findIndex(tx => tx.id === id)

        if (index !== -1) {
            // If status is completed or failed, move to regular transactions
            if (updates.status === 'completed' || updates.status === 'failed') {
                const updatedTx = { ...currentPending[index], ...updates }

                // Remove from pending
                const newPending = [...currentPending]
                newPending.splice(index, 1)
                transactionsState$.pendingTransactions.set(newPending)

                // Add to regular transactions with a unique ID if moving to completed
                if (updates.status === 'completed' && updatedTx.hash) {
                    // Create a more permanent ID for completed transactions
                    updatedTx.id = `${updatedTx.id.split('-')[0]}-${updatedTx.hash.substring(0, 8)}`
                }

                const currentTxs = transactionsState$.transactions.get()
                transactionsState$.transactions.set([updatedTx, ...currentTxs])

                console.log(`💸 [useOktoTransactions] Moved transaction ${id} from pending to ${updates.status}`)
            } else {
                // Just update the pending transaction
                const newPending = [...currentPending]
                newPending[index] = { ...newPending[index], ...updates }
                transactionsState$.pendingTransactions.set(newPending)
                console.log(`💸 [useOktoTransactions] Updated pending transaction ${id}`)
            }
        } else {
            console.warn(`💸 [useOktoTransactions] Pending transaction ${id} not found`)
        }
    }, [])

    // Initial load when authenticated - with improved caching logic
    useEffect(() => {
        const isAuth = isAuthenticated()

        if (isAuth) {
            // Check if we need to initialize
            const needsInitialization =
                !hasInitialized || (transactions.length === 0 && !transactionsState$.isLoading.get())

            // Check if cache is stale
            const isCacheStale = !isCacheValid

            if (needsInitialization) {
                console.log('💸 [useOktoTransactions] Initial load triggered')
                refetch(false) // Don't force refresh on initial load
            } else if (isCacheStale) {
                console.log('💸 [useOktoTransactions] Cache is stale, refreshing in background')
                // If cache is stale but we have data, refresh in background
                refetch(true).catch(err => {
                    console.error('💸 [useOktoTransactions] Background refresh error:', err)
                })
            }
        }
    }, [hasInitialized, refetch, transactions.length, isCacheValid])

    // Subscribe to authentication changes
    useEffect(() => {
        const unsubscribe = oktoState.auth.isAuthenticated.onChange(isAuth => {
            const currentAuthState = !!isAuth
            console.log('💸 [useOktoTransactions] Auth state changed:', currentAuthState, 'previous:', lastAuthState)

            if (currentAuthState && !lastAuthState) {
                // User just logged in, reset and refetch
                console.log('💸 [useOktoTransactions] User logged in, refreshing transactions')
                setHasInitialized(false)
                transactionsState$.hasInitialized.set(false)

                // Add a slight delay to ensure auth is complete
                setTimeout(() => {
                    refetch(true) // Force refresh after login
                }, 500)
            } else if (!currentAuthState && lastAuthState) {
                // User logged out, clear data
                console.log('💸 [useOktoTransactions] User logged out, clearing transaction data')
                transactionsState$.transactions.set([])
                transactionsState$.pendingTransactions.set([])
                transactionsState$.error.set(null)
                transactionsState$.isLoading.set(false)
                transactionsState$.hasInitialized.set(false)
                transactionsState$.lastUpdated.set(0)
                setHasInitialized(false)
                setIsLoading(false)
                setError(null)
            }

            setLastAuthState(currentAuthState)
        })

        return unsubscribe
    }, [refetch, lastAuthState])

    // Safe refetch function with authentication check
    const safeRefetch = useCallback(
        async (forceRefresh = false) => {
            if (!isAuthenticated()) {
                console.log('💸 [useOktoTransactions] Not authenticated, skipping refetch')
                return null
            }
            return refetch(forceRefresh)
        },
        [refetch],
    )

    return {
        transactions,
        pendingTransactions,
        isLoading: isLoading || transactionsState$.isLoading.get(),
        error: error || transactionsState$.error.get(),
        hasInitialized: hasInitialized || transactionsState$.hasInitialized.get(),
        refetch: safeRefetch,
        addPendingTransaction,
        updatePendingTransaction,
        lastUpdated,
        isCacheValid,
    }
}
