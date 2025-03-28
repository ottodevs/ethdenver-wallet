import { settings$ } from '@/lib/stores/app.store'
import { portfolioState$ } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import { BalanceFormatterService } from '@/services/balance-formatter.service'
import { PortfolioService } from '@/services/portfolio.service'
import type { OktoPortfolioData } from '@/types/okto'
import { use$, useObservable } from '@legendapp/state/react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseWalletBalanceOptions {
    initialPortfolio?: OktoPortfolioData | null
}

interface WalletBalanceState {
    formattedBalance: string
    isLoading: boolean
    isPrivacyEnabled: boolean
    debugInfo: string | null
    hasData: boolean
}

/**
 * Hook for managing wallet balance data and state
 * Handles data fetching, formatting, and privacy mode
 */
export function useWalletBalance({ initialPortfolio }: UseWalletBalanceOptions = {}): WalletBalanceState {
    // Get authentication and privacy mode state
    const isAuthenticated = use$(oktoState.auth.isAuthenticated)
    const privacyModeObs = useObservable(settings$.privacyMode)
    const portfolioObs = useObservable(portfolioState$)

    // Use state to track privacy mode changes
    const [privacyMode, setPrivacyMode] = useState(() => privacyModeObs.get())
    const [portfolioState] = useState(() => portfolioObs.get())

    // Update privacy mode when it changes
    useEffect(() => {
        // Set up a subscription to privacy mode changes
        const unsubscribe = settings$.privacyMode.onChange(() => {
            setPrivacyMode(settings$.privacyMode.get())
        })
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [])

    const initialDataProcessedRef = useRef(false)
    const [debugInfo, setDebugInfo] = useState<string | null>(null)

    // Helper function to set debug info (only in development)
    const setDebugInfoMemo = useCallback((message: string | null) => {
        if (process.env.NODE_ENV === 'production') return

        // Always set debug info in test environment
        setDebugInfo(message)

        // Log debug info to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`💰 [use-wallet-balance] Debug: ${message}`)
        }
    }, [])

    // Process initial portfolio data from server-side rendering
    useEffect(() => {
        if (initialPortfolio && !initialDataProcessedRef.current) {
            console.log('💰 [use-wallet-balance] Initializing with server-side portfolio data')

            // Update the portfolio state with the initial data
            portfolioState$.set({
                ...initialPortfolio,
                lastUpdated: initialPortfolio.lastUpdated || Date.now(),
            })

            PortfolioService.setPortfolioData(initialPortfolio)
            initialDataProcessedRef.current = true

            const totalValue = initialPortfolio.aggregated_data?.total_holding_price_usdt || '0.00'
            setDebugInfoMemo(`Initialized with SSR data: ${BalanceFormatterService.formatAsCurrency(totalValue)}`)
        }
    }, [initialPortfolio, setDebugInfoMemo])

    // Use TanStack Query for data fetching and caching
    const { data: portfolioData, isLoading } = useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            if (!isAuthenticated) {
                return null
            }

            try {
                const result = await PortfolioService.loadPortfolioData(true)

                // Update the portfolio state directly
                if (result) {
                    portfolioState$.set({
                        ...result,
                        lastUpdated: Date.now(),
                    })
                }

                return result
            } catch (error) {
                console.error('💰 [use-wallet-balance] Error fetching portfolio:', error)
                setDebugInfoMemo(
                    `Error fetching portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`,
                )
                return null
            }
        },
        initialData: initialDataProcessedRef.current ? PortfolioService.getPortfolioData() : undefined,
        enabled: Boolean(isAuthenticated),
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 10000, // Consider data fresh for 10 seconds
    })

    // Format the balance for display - memoize to prevent recalculations
    const formattedBalance = useMemo(() => {
        // If not authenticated, always return $0.00
        if (!isAuthenticated) {
            setDebugInfoMemo('Not authenticated')
            return BalanceFormatterService.formatAsCurrency('0')
        }

        // Get the portfolio data from observable first, then fallback to query data or service
        const currentPortfolio = portfolioState || PortfolioService.getPortfolioData()

        if (!currentPortfolio || !currentPortfolio.aggregated_data) {
            setDebugInfoMemo('No portfolio data available')
            return BalanceFormatterService.formatAsCurrency('0')
        }

        // Set debug info when portfolio data is available
        const rawBalance = currentPortfolio.aggregated_data.total_holding_price_usdt || '0.00'
        const formattedValue = BalanceFormatterService.formatAsCurrency(rawBalance)

        // Set debug info with portfolio data details
        if (initialPortfolio) {
            setDebugInfoMemo('Using initial portfolio data')
        } else {
            setDebugInfoMemo(
                `Portfolio data loaded: ${formattedValue} (Last updated: ${new Date(currentPortfolio.lastUpdated || Date.now()).toLocaleTimeString()})`,
            )
        }

        return formattedValue
    }, [isAuthenticated, portfolioState, setDebugInfoMemo, initialPortfolio])

    // Check if we have valid data
    const hasData = Boolean(
        portfolioState ||
            portfolioData ||
            (PortfolioService.getPortfolioData() &&
                PortfolioService.isValidPortfolioData(PortfolioService.getPortfolioData())),
    )

    // Determine if we're in a loading state
    const isLoadingState = isLoading && !hasData && isAuthenticated

    // If we have initial portfolio data, we're not loading
    const finalIsLoading = initialPortfolio ? false : isLoadingState

    return {
        formattedBalance,
        isLoading: finalIsLoading,
        isPrivacyEnabled: privacyMode,
        debugInfo,
        hasData,
    }
}
