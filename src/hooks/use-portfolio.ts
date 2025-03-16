import { oktoState } from '@/okto/state'
import { PortfolioService } from '@/services/portfolio.service'
import { useObservable } from '@legendapp/state/react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook to handle portfolio data loading and management
 * This hook ensures that portfolio data is loaded efficiently and consistently
 */
export function usePortfolio() {
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const initialLoadAttemptedRef = useRef(false)

    // Helper function to safely get authentication state
    const getAuthState = useCallback(() => {
        try {
            // Check if isAuthenticated is an observable with a get method
            if (isAuthenticated && typeof isAuthenticated.get === 'function') {
                return isAuthenticated.get()
            }
            // Fallback to direct value if it's a boolean
            if (typeof isAuthenticated === 'boolean') {
                return isAuthenticated
            }
            // Default to false if we can't determine
            return false
        } catch (error) {
            console.error('💼 [use-portfolio] Error getting auth state:', error)
            return false
        }
    }, [isAuthenticated])

    // Function to load portfolio data with proper error handling and state management
    const loadPortfolioData = useCallback(
        async (forceRefresh = false) => {
            // Don't attempt to load if not authenticated
            if (!getAuthState()) {
                console.log('💼 [use-portfolio] Not authenticated, skipping portfolio load')
                return null
            }

            setIsLoading(true)
            setError(null)

            try {
                const result = await PortfolioService.loadPortfolioData(forceRefresh)
                return result
            } catch (err) {
                console.error('💼 [use-portfolio] Error loading portfolio:', err)
                setError(err instanceof Error ? err : new Error('Unknown error loading portfolio'))
                return null
            } finally {
                setIsLoading(false)
            }
        },
        [getAuthState],
    )

    // Initial load effect - runs once when component mounts
    useEffect(() => {
        const loadInitialData = async () => {
            if (initialLoadAttemptedRef.current) {
                return
            }

            if (getAuthState()) {
                // Check if we already have valid portfolio data
                const currentPortfolio = PortfolioService.getPortfolioData()
                const hasValidData =
                    PortfolioService.isValidPortfolioData(currentPortfolio) &&
                    currentPortfolio?.lastUpdated &&
                    Date.now() - currentPortfolio.lastUpdated < 5 * 60 * 1000 // Less than 5 minutes old

                if (!hasValidData) {
                    console.log('💼 [use-portfolio] No valid data on mount, loading initial data')
                    initialLoadAttemptedRef.current = true
                    await loadPortfolioData(true)
                } else {
                    console.log('💼 [use-portfolio] Using cached portfolio data')
                    initialLoadAttemptedRef.current = true
                }
            }
        }

        loadInitialData()
    }, [getAuthState, loadPortfolioData])

    // Effect to reload data when authentication state changes
    useEffect(() => {
        const authState = getAuthState()

        if (authState && initialLoadAttemptedRef.current) {
            // Check if we need to refresh the data
            const currentPortfolio = PortfolioService.getPortfolioData()
            const needsRefresh = PortfolioService.needsRefresh(currentPortfolio)

            if (needsRefresh) {
                console.log('💼 [use-portfolio] Auth state is true and data needs refresh')
                loadPortfolioData()
            }
        }
    }, [getAuthState, loadPortfolioData])

    // Get the current portfolio data
    const portfolio = PortfolioService.getPortfolioData()

    return {
        portfolio,
        isLoading,
        error,
        loadPortfolioData,
        hasValidData: PortfolioService.isValidPortfolioData(portfolio),
    }
}
