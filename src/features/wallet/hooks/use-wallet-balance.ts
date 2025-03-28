import { portfolioState$, refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import { observable } from '@legendapp/state'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Observable state for wallet balance
export const walletBalance$ = observable({
    totalUsd: '0',
    isLoading: false,
    error: null as string | null,
    lastUpdated: null as Date | null,
})

// // Format balance with commas and 2 decimal places
// const formatBalance = (balance: string): string => {
//     const num = parseFloat(balance)
//     if (isNaN(num)) return '0.00'
//     return num.toLocaleString('en-US', {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//     })
// }

export function useWalletBalance() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Get portfolio data directly
    const portfolioData = portfolioState$.get()

    // Log portfolio data changes
    useEffect(() => {
        console.log('💰 [useWalletBalance] Portfolio data changed:', portfolioData)
    }, [portfolioData])

    // Extract raw balance from portfolio data
    const rawBalance = useMemo(() => {
        if (!portfolioData || !portfolioData.aggregated_data) {
            return '0.00'
        }
        const value = portfolioData.aggregated_data.total_holding_price_usdt || '0.00'
        return value
    }, [portfolioData])

    // Format the balance
    const formattedBalance = useMemo(() => {
        try {
            const value = parseFloat(rawBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            return value
        } catch (e) {
            console.error('💰 [useWalletBalance] Error formatting balance:', e)
            return '0.00'
        }
    }, [rawBalance])

    // Refresh function
    const refetch = useCallback(async () => {
        if (!oktoState.auth.isAuthenticated.get()) {
            setError('Not authenticated')
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            // Refresh wallets first
            const { refreshWallets } = await import('@/okto/explorer/wallet')
            await refreshWallets()

            // Then refresh portfolio
            await refreshPortfolio()

            console.log('💰 [use-wallet-balance] Refreshed wallet and portfolio data')
        } catch (err) {
            console.error('💰 [use-wallet-balance] Error refreshing balance:', err)
            setError(err instanceof Error ? err.message : 'Failed to refresh balance')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        const isAuthenticated = oktoState.auth.isAuthenticated.get()
        if (isAuthenticated && (!portfolioData || !portfolioData.aggregated_data)) {
            console.log('💰 [useWalletBalance] Initial load triggered')
            refetch()
        }
    }, [portfolioData, refetch])

    // Extract tokens from portfolio data
    const tokens = useMemo(() => {
        if (!portfolioData || !portfolioData.group_tokens) {
            return []
        }

        // Flatten group tokens into a single array of tokens
        return portfolioData.group_tokens.flatMap(group => {
            // If the group has tokens, return those
            if (group.tokens && group.tokens.length > 0) {
                return group.tokens.map(token => ({
                    id: token.id,
                    name: token.name,
                    symbol: token.symbol,
                    image: token.token_image,
                    balance: parseFloat(token.balance || '0'),
                    valueUsd: parseFloat(token.holdings_price_usdt || '0'),
                    chain: token.network_name,
                }))
            }

            // Otherwise, return the group itself as a token
            return [
                {
                    id: group.id,
                    name: group.name,
                    symbol: group.symbol,
                    image: group.token_image,
                    balance: parseFloat(group.balance || '0'),
                    valueUsd: parseFloat(group.holdings_price_usdt || '0'),
                    chain: group.network_name,
                },
            ]
        })
    }, [portfolioData])

    // Calculate total balance
    const totalBalanceUsd = useMemo(() => {
        if (!portfolioData || !portfolioData.aggregated_data) {
            return 0
        }
        return parseFloat(portfolioData.aggregated_data.total_holding_price_usdt || '0')
    }, [portfolioData])

    return {
        formattedBalance,
        isLoading,
        error,
        refetch,
        rawBalance,
        tokens,
        totalBalanceUsd,
    }
}
