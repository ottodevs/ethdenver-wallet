import { useCallback, useEffect, useRef, useState } from 'react'

import { getCurrentPortfolio, portfolioState$, refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import { useObservable } from '@legendapp/state/react'

/**
 * Hook to access and manage Okto portfolio data
 */
export function useOktoPortfolio() {
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const portfolio = useObservable(portfolioState$)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const refreshAttemptedRef = useRef(false)
    const refreshInProgressRef = useRef(false)
    const retryCountRef = useRef(0)
    const maxRetries = 5
    const lastRefreshTimestampRef = useRef(0)
    const minRefreshInterval = 2000 // 2 seconds

    // Refetch function with debouncing and retry logic
    const refetch = useCallback(async () => {
        // Prevent concurrent refreshes and respect minimum refresh interval
        const now = Date.now()
        if (refreshInProgressRef.current || now - lastRefreshTimestampRef.current < minRefreshInterval) {
            console.log('💼 [useOktoPortfolio] Refresh already in progress or too soon, skipping')
            return getCurrentPortfolio() // Return current data instead of null
        }

        // Check if authenticated
        if (!isAuthenticated.get()) {
            console.log('💼 [useOktoPortfolio] Not authenticated, skipping refresh')
            setIsLoading(false)
            return getCurrentPortfolio() // Return current data instead of null
        }

        try {
            refreshInProgressRef.current = true
            lastRefreshTimestampRef.current = now
            setIsLoading(true)
            setError(null)
            refreshAttemptedRef.current = true

            console.log('💼 [useOktoPortfolio] Refreshing portfolio data...')
            const result = await refreshPortfolio()

            // Check if we got valid data
            const currentData = portfolio.get() || getCurrentPortfolio()
            const hasValidData =
                currentData &&
                (currentData.aggregated_data || (currentData.group_tokens && currentData.group_tokens.length > 0))

            if (hasValidData) {
                console.log('💼 [useOktoPortfolio] Successfully refreshed portfolio data')
                retryCountRef.current = 0
                setIsLoading(false)
                setIsInitialLoad(false)
                return result || currentData // Ensure we return data
            } else {
                // If no valid data and we haven't exceeded max retries, try again with backoff
                if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++
                    const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                    console.log(
                        `💼 [useOktoPortfolio] No data after refresh, retry ${retryCountRef.current}/${maxRetries} in ${backoffTime}ms`,
                    )

                    setTimeout(() => {
                        refreshInProgressRef.current = false
                        refetch()
                    }, backoffTime)
                } else {
                    console.log('💼 [useOktoPortfolio] Max retries exceeded, giving up')
                    setIsLoading(false)
                    setIsInitialLoad(false)
                }
                return currentData // Return current data instead of null
            }
        } catch (err) {
            console.error('💼 [useOktoPortfolio] Error refreshing portfolio:', err)
            setError(err instanceof Error ? err : new Error(String(err)))

            // Get current data to return even in case of error
            const currentData = portfolio.get() || getCurrentPortfolio()

            // Retry logic for errors
            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                console.log(
                    `💼 [useOktoPortfolio] Error refreshing, retry ${retryCountRef.current}/${maxRetries} in ${backoffTime}ms`,
                )

                setTimeout(() => {
                    refreshInProgressRef.current = false
                    refetch()
                }, backoffTime)
            } else {
                setIsLoading(false)
                setIsInitialLoad(false)
            }

            return currentData // Return current data instead of null
        } finally {
            if (retryCountRef.current >= maxRetries) {
                refreshInProgressRef.current = false
            }
        }
    }, [isAuthenticated, portfolio])

    // Initial load and subscription to authentication changes
    useEffect(() => {
        let isMounted = true
        const refreshTimer: NodeJS.Timeout | null = null

        const checkAndLoadData = async () => {
            if (!isMounted) return

            // If authenticated and no data has been loaded yet
            if (isAuthenticated.get() && isInitialLoad && !refreshAttemptedRef.current) {
                console.log('💼 [useOktoPortfolio] Initial portfolio data load')
                await refetch()
            } else if (isAuthenticated.get() && !refreshAttemptedRef.current) {
                // If authenticated but not initial load, still try to refresh once
                console.log('💼 [useOktoPortfolio] Refreshing portfolio data on mount')
                refreshAttemptedRef.current = true
                await refetch()
            }

            // If not authenticated, reset loading state
            if (!isAuthenticated.get()) {
                setIsLoading(false)
                setIsInitialLoad(true)
                retryCountRef.current = 0
                refreshAttemptedRef.current = false
            }
        }

        // Check for data on mount and when authentication changes
        checkAndLoadData()

        // Subscribe to authentication changes
        const unsubscribe = oktoState.auth.isAuthenticated.onChange(() => {
            if (isAuthenticated.get()) {
                console.log('💼 [useOktoPortfolio] Authentication state changed to authenticated, refreshing data')
                refreshAttemptedRef.current = false
                retryCountRef.current = 0
                setIsInitialLoad(true)
                checkAndLoadData()
            } else {
                console.log('💼 [useOktoPortfolio] Authentication state changed to not authenticated')
                setIsLoading(false)
                setIsInitialLoad(true)
                retryCountRef.current = 0
                refreshAttemptedRef.current = false
            }
        })

        return () => {
            isMounted = false
            if (refreshTimer) clearTimeout(refreshTimer)
            unsubscribe()
        }
    }, [isAuthenticated, refetch, isInitialLoad])

    // Get the current portfolio data
    const data = portfolio.get() || getCurrentPortfolio()

    return {
        data,
        isLoading: isLoading && isAuthenticated.get(),
        error,
        refetch,
    }
}
