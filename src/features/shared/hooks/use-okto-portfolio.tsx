'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { portfolioState$, syncPortfolio } from '@/features/shared/state/portfolio-state'
import { useOkto } from '@okto_web3/react-sdk'
import { useEffect } from 'react'

export const useOktoPortfolio = () => {
    const oktoClient = useOkto()
    const { selectedAccount } = useOktoAccount()
    const { isAuthenticated } = useAuth()

    // Get values from the observable state
    const tokens = portfolioState$.tokens.get()
    const totalBalanceUsd = portfolioState$.totalBalanceUsd.get()
    const isLoading = portfolioState$.isLoading.get()
    const error = portfolioState$.error.get()
    const lastUpdated = portfolioState$.lastUpdated.get()

    // Sync when dependencies change
    useEffect(() => {
        if (oktoClient && selectedAccount && isAuthenticated) {
            console.log('[useOktoPortfolio] Dependencies changed, syncing portfolio')
            syncPortfolio(oktoClient)
        }
    }, [oktoClient, selectedAccount, isAuthenticated])

    return {
        tokens,
        totalBalanceUsd,
        isLoading,
        error,
        isInitialized: lastUpdated > 0,
        refetch: (forceRefresh = true) => syncPortfolio(oktoClient, forceRefresh),
    }
}
