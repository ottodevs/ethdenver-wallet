'use client'

import { useWalletBalance } from '@/hooks/use-wallet-balance'
import { settings$ } from '@/lib/stores/app.store'
import { refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import type { OktoPortfolioData } from '@/types/okto'
import { use$ } from '@legendapp/state/react'
import { memo, useEffect, useState } from 'react'
import { BalanceAnimation } from './balance-animation'

interface BalanceAmountProps {
    initialPortfolio?: OktoPortfolioData | null
    className?: string
}

/**
 * BalanceAmount component - Displays the wallet balance
 * This component is only responsible for rendering the balance UI
 * All data fetching and state management is handled by the useWalletBalance hook
 */
export const BalanceAmount = memo(function BalanceAmount({ initialPortfolio, className = '' }: BalanceAmountProps) {
    // Get authentication state once on mount to avoid re-renders
    const isAuthenticated = use$(oktoState.auth.isAuthenticated)
    const [refreshTriggered, setRefreshTriggered] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [debugMode, setDebugMode] = useState(false)

    // Set mounted state after hydration
    useEffect(() => {
        setIsMounted(true)

        // Set up debug mode subscription
        const unsubscribe = settings$.debugMode.onChange(() => {
            setDebugMode(settings$.debugMode.get())
        })

        // Initialize debug mode
        setDebugMode(settings$.debugMode.get())

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [])

    // Log when the component renders with initial portfolio data
    useEffect(() => {
        console.log('💰 [balance-amount] Rendering BalanceAmount component')
        if (initialPortfolio) {
            console.log(
                '💰 [balance-amount] Rendering with initial portfolio data:',
                initialPortfolio.aggregated_data?.total_holding_price_usdt || '0.00',
            )
        }
    }, [initialPortfolio])

    // Use the wallet balance hook for all data and state management
    const { formattedBalance, isLoading, isPrivacyEnabled, debugInfo, hasData } = useWalletBalance({
        initialPortfolio,
    })

    // Refresh portfolio data when authenticated but no data - only once on mount
    useEffect(() => {
        const shouldRefresh = isAuthenticated && !hasData && !initialPortfolio && !refreshTriggered

        if (shouldRefresh) {
            console.log('💰 [balance-amount] Authenticated but no data, refreshing portfolio')
            setRefreshTriggered(true)
            refreshPortfolio().catch(err => {
                console.error('💰 [balance-amount] Error refreshing portfolio:', err)
            })
        }
    }, [isAuthenticated, hasData, initialPortfolio, refreshTriggered])

    // Log the formatted balance for debugging
    useEffect(() => {
        console.log('💰 [balance-amount] Current formatted balance:', formattedBalance)
    }, [formattedBalance])

    // Show loading skeleton if loading
    if (isLoading) {
        return (
            <div className={`mt-2 flex flex-col items-center justify-center ${className}`}>
                <div
                    data-testid='loading-skeleton'
                    className='h-12 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800'
                />
                {debugMode && debugInfo && (
                    <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>
                )}
            </div>
        )
    }

    // During SSR, render a placeholder to avoid hydration errors
    if (!isMounted) {
        return (
            <div className={`mt-2 flex flex-col items-center justify-center ${className}`}>
                <div data-testid='balance-amount' className='relative overflow-hidden'>
                    <div className='text-3xl font-bold'>$0.00</div>
                </div>
            </div>
        )
    }

    // Show the actual balance with animation
    return (
        <div className={`mt-2 flex flex-col items-center justify-center ${className}`}>
            <div data-testid='balance-amount' className='relative overflow-hidden'>
                <BalanceAnimation value={formattedBalance} isPrivacyEnabled={isPrivacyEnabled} />
            </div>
            {debugMode && debugInfo && <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>}
        </div>
    )
})
