'use client'

import type { Transaction } from '@/features/shared/hooks/use-okto-transactions'
import { useOktoTransactions } from '@/features/shared/hooks/use-okto-transactions'
import { transactionsState$ } from '@/features/shared/state/transactions-state'
import { oktoState } from '@/okto/state'
import { observer, useObservable } from '@legendapp/state/react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const TransactionHistory = observer(function TransactionHistory({ animated = true }: { animated?: boolean }) {
    const { refetch } = useOktoTransactions()
    const [showRefreshButton, setShowRefreshButton] = useState(false)
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const [isLoading, setIsLoading] = useState(true)
    const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const retryCountRef = useRef(0)
    const maxRetries = 3
    const [debugInfo, setDebugInfo] = useState<string | null>(null)
    const [lastAuthState, setLastAuthState] = useState(false)

    // Get the values from the observable state
    const transactions = transactionsState$.transactions.get()
    const pendingTransactions = transactionsState$.pendingTransactions.get()
    const stateIsLoading = transactionsState$.isLoading.get()
    const error = transactionsState$.error.get()
    const hasInitialized = transactionsState$.hasInitialized.get()

    // Combine pending and confirmed transactions for the UI using useMemo
    const allTransactions = useMemo(
        () => [...pendingTransactions, ...transactions],
        [pendingTransactions, transactions],
    )

    // Generate unique keys for transactions to avoid duplicate ID warnings
    const getUniqueTransactionKey = useCallback((tx: Transaction) => {
        // Create a unique key using hash (if available) and id
        // If hash is not available, use id with a timestamp or random suffix
        if (tx.hash) {
            return `${tx.hash}-${tx.id}`
        }
        // For pending transactions that might not have a hash yet
        return `${tx.id}-${tx.timestamp || Date.now()}`
    }, [])

    // Show refresh button if there's an error or no transactions after initialization
    useEffect(() => {
        if ((error || (hasInitialized && (!allTransactions || allTransactions.length === 0))) && !stateIsLoading) {
            setShowRefreshButton(true)
        } else {
            setShowRefreshButton(false)
        }
    }, [error, hasInitialized, allTransactions, stateIsLoading])

    // Listen for authentication state changes
    useEffect(() => {
        const currentAuthState = isAuthenticated.get()
        console.log('💸 [transaction-history] Auth state changed:', currentAuthState, 'previous:', lastAuthState)

        // If user just logged in, trigger a refresh
        if (currentAuthState && !lastAuthState) {
            console.log('💸 [transaction-history] User authenticated, checking transaction data')
            const hasValidData = transactions.length > 0

            if (!hasValidData) {
                console.log('💸 [transaction-history] No valid transaction data after auth, refreshing')
                setIsLoading(true)
                setDebugInfo('Refreshing transactions after login...')

                // Slight delay to ensure auth is fully processed
                setTimeout(async () => {
                    try {
                        const result = await refetch(true) // Force refresh
                        console.log('💸 [transaction-history] Post-login refresh result:', result)

                        if (result) {
                            const currentTransactions = transactionsState$.transactions.get()
                            setDebugInfo(`Loaded ${currentTransactions.length} transactions after login`)
                        } else {
                            setDebugInfo('No transactions after login refresh')
                        }
                    } catch (error) {
                        console.error('💸 [transaction-history] Error in post-login refresh:', error)
                        setDebugInfo(
                            `Error refreshing after login: ${error instanceof Error ? error.message : 'Unknown'}`,
                        )
                    } finally {
                        setIsLoading(false)
                    }
                }, 500)
            } else {
                console.log('💸 [transaction-history] Already have valid transaction data after auth')
                setDebugInfo(`Already loaded ${transactions.length} transactions`)
                setIsLoading(false)
            }
        }

        setLastAuthState(currentAuthState)
    }, [isAuthenticated, transactions, refetch, lastAuthState])

    // Attempt to refresh transaction data if authenticated but no data
    useEffect(() => {
        const checkAndRefreshTransactions = async () => {
            // Clear any existing timeout
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
                refreshTimeoutRef.current = null
            }

            console.log('💸 [transaction-history] Auth state:', isAuthenticated.get())
            console.log('💸 [transaction-history] Transactions data:', transactions.length)
            console.log('💸 [transaction-history] State loading:', stateIsLoading)
            console.log('💸 [transaction-history] Has initialized:', hasInitialized)

            if (!isAuthenticated.get()) {
                console.log('💸 [transaction-history] Not authenticated, skipping refresh')
                setIsLoading(false)
                return
            }

            const hasValidData = transactions.length > 0

            console.log('💸 [transaction-history] Has valid data:', hasValidData)

            // If we have valid data, we're not loading
            if (hasValidData) {
                console.log('💸 [transaction-history] Valid data found, setting loading to false')
                setIsLoading(false)
                retryCountRef.current = 0
                setDebugInfo(`${transactions.length} transactions loaded`)
                return
            }

            // If we're authenticated but don't have data, and haven't exceeded max retries
            if (isAuthenticated.get() && !hasValidData && retryCountRef.current < maxRetries && !hasAttemptedRefresh) {
                console.log('💸 [transaction-history] No valid data, attempting refresh')
                setIsLoading(true)
                setHasAttemptedRefresh(true)
                retryCountRef.current += 1
                setDebugInfo(`Refreshing transactions (attempt ${retryCountRef.current}/${maxRetries})`)

                try {
                    console.log('💸 [transaction-history] Calling refetch()')
                    const result = await refetch(true) // Force refresh
                    console.log('💸 [transaction-history] Refresh result:', result)

                    // Check if we have data after refresh
                    const currentTransactions = transactionsState$.transactions.get()
                    console.log('💸 [transaction-history] Transactions after refresh:', currentTransactions.length)

                    if (currentTransactions.length > 0) {
                        console.log('💸 [transaction-history] Refresh successful, setting loading to false')
                        setIsLoading(false)
                        setDebugInfo(`${currentTransactions.length} transactions refreshed`)
                    } else {
                        // If still no data, schedule another retry with exponential backoff
                        console.log('💸 [transaction-history] Still no data after refresh, scheduling retry')
                        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                        setDebugInfo(`No transactions after refresh, retrying in ${backoffTime / 1000}s`)

                        refreshTimeoutRef.current = setTimeout(() => {
                            setHasAttemptedRefresh(false) // Reset to trigger another attempt
                        }, backoffTime)
                    }
                } catch (error) {
                    // If error, retry with backoff
                    console.error('💸 [transaction-history] Error refreshing transactions:', error)
                    const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                    setDebugInfo(`Error refreshing: ${error instanceof Error ? error.message : 'Unknown error'}`)

                    refreshTimeoutRef.current = setTimeout(() => {
                        setHasAttemptedRefresh(false) // Reset to trigger another attempt
                    }, backoffTime)
                }
            } else if (retryCountRef.current >= maxRetries) {
                // If we've exceeded max retries, stop loading
                console.log('💸 [transaction-history] Max retries exceeded, stopping attempts')
                setIsLoading(false)
                setDebugInfo(`Max retries (${maxRetries}) exceeded`)
            }
        }

        // Use requestIdleCallback or setTimeout to defer initialization
        // This ensures the UI renders first, then we load data
        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    checkAndRefreshTransactions()
                })
            } else {
                setTimeout(checkAndRefreshTransactions, 100)
            }
        }

        // Cleanup function to clear any timeouts
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
                refreshTimeoutRef.current = null
            }
        }
    }, [isAuthenticated, transactions, refetch, hasAttemptedRefresh, stateIsLoading, hasInitialized])

    // Animation variants for Framer Motion
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    }

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    }

    // Show loading state
    if (isLoading || stateIsLoading || !hasInitialized) {
        return (
            <div className='space-y-4' data-testid='transaction-history-loading'>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className='flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/30'
                        data-testid='transaction-skeleton-item'>
                        <div className='flex items-center gap-3'>
                            <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800' />
                            <div className='space-y-2'>
                                <div className='h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                                <div className='h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <div className='h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                            <div className='h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10'>
                <div className='mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/30'>
                    <RefreshCw className='h-6 w-6 text-red-500 dark:text-red-400' />
                </div>
                <p
                    className='mb-3 text-center text-sm font-medium text-red-600 dark:text-red-400'
                    data-testid='error-message'>
                    Failed to load transactions
                </p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch(true)}
                        className='inline-flex items-center gap-2 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                        data-testid='retry-button'>
                        <RefreshCw className='h-4 w-4' />
                        Retry
                    </button>
                )}
                {debugInfo && <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>}
            </div>
        )
    }

    // Si no hay transacciones después de la inicialización, mostrar estado vacío
    if (hasInitialized && allTransactions.length === 0) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/30'>
                <div className='mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800'>
                    <RefreshCw className='h-6 w-6 text-gray-500 dark:text-gray-400' />
                </div>
                <p
                    className='mb-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400'
                    data-testid='empty-state-message'>
                    No transactions found
                </p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch(true)}
                        className='bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors'
                        data-testid='refresh-button'>
                        <RefreshCw className='h-4 w-4' />
                        Refresh
                    </button>
                )}
                {debugInfo && <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>}
            </div>
        )
    }

    // Helper function to format small numbers in a readable way
    const formatSmallAmount = (amount: number): string => {
        // For very small numbers, use significant digits instead of fixed decimals
        if (amount === 0) return '0'

        if (Math.abs(amount) < 0.000001) {
            // Use scientific notation for extremely small numbers
            return amount.toExponential(2)
        }

        if (Math.abs(amount) < 0.0001) {
            return amount.toFixed(8)
        }

        if (Math.abs(amount) < 0.01) {
            return amount.toFixed(6)
        }

        if (Math.abs(amount) < 1) {
            return amount.toFixed(4)
        }

        return amount.toFixed(2)
    }

    // Format amount with appropriate precision
    const formatAmount = (amount: number | string | undefined): string => {
        if (amount === undefined || amount === null) return '0'

        // Convert string to number if needed
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

        // Handle NaN
        if (isNaN(numAmount)) return '0'

        return formatSmallAmount(numAmount)
    }

    // Format USD value
    const formatUsdValue = (amount: number | string | undefined, symbol: string): string => {
        if (amount === undefined || amount === null) return ''

        // Convert string to number if needed
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

        // Handle NaN
        if (isNaN(numAmount)) return ''

        // Skip USD value for very small amounts
        if (Math.abs(numAmount) < 0.01) return ''

        // Estimate USD value based on common token prices (very simplified)
        let usdValue = 0
        if (symbol.toUpperCase() === 'ETH') {
            usdValue = numAmount * 3000 // Simplified ETH price estimate
        } else if (symbol.toUpperCase() === 'BTC') {
            usdValue = numAmount * 50000 // Simplified BTC price estimate
        } else if (
            symbol.toUpperCase() === 'USDT' ||
            symbol.toUpperCase() === 'USDC' ||
            symbol.toUpperCase() === 'DAI'
        ) {
            usdValue = numAmount // Stablecoins
        } else {
            return '' // Skip for unknown tokens
        }

        if (usdValue < 0.01) return ''

        return `$${usdValue.toFixed(2)}`
    }

    // Format timestamp to relative time
    const formatTimestamp = (timestamp: number | string | undefined): string => {
        if (!timestamp) return 'Recently'

        try {
            // Convert string to number if needed
            timestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp

            // Handle invalid timestamps
            if (isNaN(timestamp) || timestamp <= 0) {
                return 'Recently'
            }

            // Check if timestamp is in seconds (Unix timestamp) and convert to milliseconds if needed
            if (timestamp < 1000000000000) {
                timestamp = timestamp * 1000
            }

            // Cap future timestamps to now
            const now = Date.now()
            if (timestamp > now) {
                timestamp = now // Cap at current time if in future
            }

            // Check if timestamp is unreasonably old (before 2020)
            const year2020 = new Date('2020-01-01').getTime()
            if (timestamp < year2020) {
                return 'Recently' // Default for suspicious timestamps
            }

            return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
        } catch (error) {
            console.error('Error formatting timestamp:', error)
            return 'Recently' // Fallback for any errors
        }
    }

    // Helper function to get transaction type text
    const getTypeText = (type: string): string => {
        const lowerType = type.toLowerCase()
        if (lowerType === 'send' || lowerType === 'sent') return 'Sent'
        if (lowerType === 'receive' || lowerType === 'received') return 'Received'
        if (lowerType === 'swap') return 'Swapped'
        if (lowerType === 'deposit') return 'Received'
        if (lowerType === 'withdraw') return 'Withdrew'
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    // Helper function to get transaction icon color
    const getTransactionColor = (type: string, status: string): string => {
        const lowerType = type.toLowerCase()
        const lowerStatus = status?.toLowerCase()

        // Failed transactions are always gray
        if (lowerStatus === 'failed' || lowerStatus === 'error' || lowerStatus === 'false') {
            return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }

        // Pending transactions are yellow
        if (lowerStatus === 'pending') {
            return 'bg-yellow-100 text-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-400'
        }

        // Completed transactions use the standard colors
        if (lowerType === 'send' || lowerType === 'sent' || lowerType === 'withdraw') {
            return 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
        }

        return 'bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400'
    }

    // Helper function to get status class
    const getStatusClass = (status: string): string => {
        if (!status) return 'text-muted-foreground'

        const lowerStatus = status.toLowerCase()
        if (lowerStatus === 'completed' || lowerStatus === 'success' || lowerStatus === 'true') return 'text-green-500'
        if (lowerStatus === 'pending') return 'text-yellow-500'
        if (lowerStatus === 'failed' || lowerStatus === 'error' || lowerStatus === 'false') return 'text-red-500'
        return 'text-muted-foreground'
    }

    // Format status text properly
    const formatStatus = (status: string): string => {
        if (!status) return ''

        if (status.toLowerCase() === 'true') return 'Completed'
        if (status.toLowerCase() === 'false') return 'Failed'

        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }

    // Use motion.div for animations or regular div if animations are disabled
    const ListComponent = animated ? motion.div : 'div'
    const TransactionComponent = animated ? motion.div : 'div'

    return (
        <ListComponent
            className='space-y-4 px-4'
            variants={animated ? container : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'show' : undefined}
            data-testid='transaction-list'>
            {allTransactions.map(tx => {
                // Format USD value if available - try multiple properties
                const usdValue = formatUsdValue(tx.amount || 0, tx.symbol || '')
                const formattedAmount = formatAmount(tx.amount)
                const isOutgoing = (tx.type || '').toLowerCase() === 'send' || (tx.type || '').toLowerCase() === 'sent'
                const uniqueKey = getUniqueTransactionKey(tx)
                const transactionColor = getTransactionColor(tx.type || '', tx.status || '')
                const isPending = (tx.status || '').toLowerCase() === 'pending'

                return (
                    <TransactionComponent
                        key={uniqueKey}
                        variants={animated ? item : undefined}
                        className={`border-border hover:bg-muted/50 mb-4 flex items-center rounded-lg border p-3 shadow-sm transition-colors ${
                            isPending ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                        }`}
                        data-testid='transaction-item'>
                        <div className='mr-4'>
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${transactionColor}`}>
                                {isOutgoing ? (
                                    <ArrowUpRight className='h-5 w-5' />
                                ) : (
                                    <ArrowDownLeft className='h-5 w-5' />
                                )}
                            </div>
                        </div>

                        <div className='min-w-0 flex-1'>
                            <div className='flex items-center justify-between'>
                                <div className='truncate font-medium'>
                                    {getTypeText(tx.type || '')} {tx.symbol || ''}
                                    {tx.networkName && (
                                        <span className='text-muted-foreground ml-1 text-xs'>on {tx.networkName}</span>
                                    )}
                                </div>
                                <div className='ml-2 text-right'>
                                    <span
                                        className={`font-medium ${
                                            isPending
                                                ? 'text-yellow-500 dark:text-yellow-400'
                                                : isOutgoing
                                                  ? 'text-red-500 dark:text-red-400'
                                                  : 'text-green-500 dark:text-green-400'
                                        }`}
                                        data-testid='transaction-amount'>
                                        {isOutgoing ? '-' : '+'}
                                        {formattedAmount} {tx.symbol || ''}
                                    </span>
                                    {usdValue && <div className='text-muted-foreground text-xs'>{usdValue}</div>}
                                </div>
                            </div>

                            <div className='mt-1 flex items-center justify-between'>
                                <div className='text-muted-foreground text-xs'>
                                    {formatTimestamp(tx.timestamp)}
                                    {tx.status && (
                                        <span className={`ml-2 ${getStatusClass(tx.status)}`}>
                                            • {formatStatus(tx.status)}
                                        </span>
                                    )}
                                </div>
                                {tx.hash && tx.explorerUrl && (
                                    <a
                                        href={tx.explorerUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-muted-foreground hover:text-primary ml-2 inline-flex items-center gap-1 text-xs'
                                        onClick={e => e.stopPropagation()}>
                                        View <ExternalLink className='h-3 w-3' />
                                        <span className='sr-only'>transaction</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </TransactionComponent>
                )
            })}

            {/* Show loading indicator for subsequent loads */}
            {(stateIsLoading || isLoading) && hasInitialized && (
                <div className='p-2 text-center'>
                    <div className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent' />
                    {debugInfo && <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>}
                </div>
            )}

            {/* Show debug info in non-production environment */}
            {debugInfo && process.env.NODE_ENV !== 'production' && !isLoading && !stateIsLoading && (
                <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>
            )}
        </ListComponent>
    )
})
