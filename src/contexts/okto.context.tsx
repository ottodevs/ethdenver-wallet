'use client'

import { useAuth } from '@/hooks/use-auth'
import { usePortfolio } from '@/hooks/use-portfolio'
import type { OktoWallet } from '@/okto/types'
import { AuthService } from '@/services/auth.service'
import type { OktoPortfolioData } from '@/types/okto'
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'

// Define the return type for refreshData
type RefreshDataResult = Promise<{
    auth: { wallets: OktoWallet[] | null; portfolio: OktoPortfolioData | null } | null
    portfolio: OktoPortfolioData | null
} | null>

// Define the Okto context type
interface OktoContextType {
    isInitialized: boolean
    isAuthenticated: boolean
    isInitializing: boolean
    isError: boolean
    errorMessage: string | null
    refreshData: (forceRefresh?: boolean) => RefreshDataResult
}

// Create a context for Okto with default values
const OktoContext = createContext<OktoContextType>({
    isInitialized: false,
    isAuthenticated: false,
    isInitializing: false,
    isError: false,
    errorMessage: null,
    refreshData: async () => null,
})

/**
 * Hook to access the Okto context
 */
export function useOkto() {
    return useContext(OktoContext)
}

/**
 * Provider component for Okto authentication and data
 */
export default function OktoProvider({ children }: { children: ReactNode }) {
    // Use our custom hooks for authentication and portfolio data
    const auth = useAuth()
    const { loadPortfolioData } = usePortfolio()

    // Combine the refresh functions from both hooks
    const refreshData = useCallback(
        async (forceRefresh = false) => {
            if (!AuthService.isAuthenticated()) return null

            // First refresh auth data
            const authResult = await auth.refreshData(forceRefresh)

            // Then refresh portfolio data
            const portfolioResult = await loadPortfolioData(forceRefresh)

            return {
                auth: authResult,
                portfolio: portfolioResult,
            }
        },
        [auth, loadPortfolioData],
    )

    // Add an effect to monitor authentication state changes
    useEffect(() => {
        if (auth.isAuthenticated) {
            console.log('🔄 [okto-context] Auth state changed to authenticated, refreshing data immediately')
            // Force a refresh when authentication state changes to true
            refreshData(true).catch(error => {
                console.error('Error refreshing data after auth state change:', error)
            })
        }
    }, [auth.isAuthenticated, refreshData])

    // Create the context value
    const contextValue: OktoContextType = {
        isInitialized: auth.isInitialized,
        isAuthenticated: auth.isAuthenticated,
        isInitializing: auth.isInitializing,
        isError: auth.isError,
        errorMessage: auth.errorMessage,
        refreshData,
    }

    return <OktoContext.Provider value={contextValue}>{children}</OktoContext.Provider>
}
