'use client'

import { settings$ } from '@/lib/stores/app.store'
import { oktoState } from '@/okto/state'
import { PortfolioService } from '@/services/portfolio.service'
import { observer, useObservable } from '@legendapp/state/react'
import { useEffect, useMemo, useState } from 'react'

/**
 * Debug Panel Component
 *
 * A floating panel that displays debug information in the top-right corner
 * Only visible in development mode and when enabled in settings
 */
export const DebugPanel = observer(function DebugPanel() {
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const debugMode = useObservable(settings$.debugMode)
    const [isMounted, setIsMounted] = useState(false)

    // Only render after component is mounted on client
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Get portfolio data
    const portfolio = PortfolioService.getPortfolioData()
    const hasValidData = PortfolioService.isValidPortfolioData(portfolio)

    // Memoize the debug info content to prevent unnecessary re-renders
    const debugContent = useMemo(() => {
        // Only show in development mode, when debug mode is enabled, and after client-side mount
        if (!isMounted || process.env.NODE_ENV === 'production' || !debugMode.get()) {
            return null
        }

        return (
            <div className='fixed top-4 right-4 z-50 rounded-lg bg-black/80 p-3 text-xs text-white shadow-lg backdrop-blur-sm'>
                <div className='mb-2 font-bold'>Debug Info</div>
                <div className='space-y-1'>
                    <div>Auth: {isAuthenticated.get() ? 'Yes' : 'No'}</div>
                    <div>Portfolio: {portfolio ? 'Loaded' : 'Not loaded'}</div>
                    <div>Valid Data: {hasValidData ? 'Yes' : 'No'}</div>
                    {portfolio?.aggregated_data && (
                        <div>Balance: ${portfolio.aggregated_data.total_holding_price_usdt || '0.00'}</div>
                    )}
                    <div>
                        Last Updated:{' '}
                        {portfolio?.lastUpdated ? new Date(portfolio.lastUpdated).toLocaleTimeString() : 'Never'}
                    </div>
                </div>
            </div>
        )
    }, [isMounted, debugMode, isAuthenticated, portfolio, hasValidData])

    // Don't render anything during SSR, in production, or if debug mode is disabled
    return debugContent
})
