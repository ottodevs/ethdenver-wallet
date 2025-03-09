'use client'

import { Skeleton as TransactionSkeleton } from '@/components/ui/skeleton'
import { useOktoTransactions } from '@/features/shared/hooks/use-okto-transactions'
import { transactionsState$ } from '@/features/shared/state/transactions-state'
import { observer } from '@legendapp/state/react'
import { formatDistanceToNow } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCw } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

export const TransactionHistory = observer(function TransactionHistory({ animated = true }: { animated?: boolean }) {
    const { refetch } = useOktoTransactions()
    const [showRefreshButton, setShowRefreshButton] = useState(false)

    // Obtenemos los valores del estado observable
    const transactions = transactionsState$.transactions.get()
    const pendingTransactions = transactionsState$.pendingTransactions.get()
    const isLoading = transactionsState$.isLoading.get()
    const error = transactionsState$.error.get()
    const hasInitialized = transactionsState$.hasInitialized.get()

    // Combinar transacciones pendientes y confirmadas para la UI usando useMemo
    const allTransactions = useMemo(
        () => [...pendingTransactions, ...transactions],
        [pendingTransactions, transactions],
    )

    // Show refresh button if there's an error or no transactions after initialization
    useEffect(() => {
        if ((error || (hasInitialized && (!allTransactions || allTransactions.length === 0))) && !isLoading) {
            setShowRefreshButton(true)
        } else {
            setShowRefreshButton(false)
        }
    }, [error, hasInitialized, allTransactions, isLoading])

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

    // Show skeletons during initial loading
    if (isLoading && !hasInitialized) {
        return (
            <div className='space-y-2'>
                {Array(3)
                    .fill(0)
                    .map((_, i) => (
                        <TransactionSkeleton key={`skeleton-${i}`} />
                    ))}
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center'>
                <p className='mb-3 text-sm text-red-500'>{error}</p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch()}
                        className='bg-primary/80 text-primary-foreground hover:bg-primary flex items-center gap-2 rounded-md px-4 py-2'>
                        <RefreshCw className='h-4 w-4' />
                        Retry
                    </button>
                )}
            </div>
        )
    }

    // Show empty state after loading is complete
    if ((!allTransactions || allTransactions.length === 0) && hasInitialized) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center'>
                <Clock className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='text-muted-foreground mb-3 text-sm'>No transactions found</p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch()}
                        className='bg-primary/80 text-primary-foreground hover:bg-primary flex items-center gap-2 rounded-md px-4 py-2'>
                        <RefreshCw className='h-4 w-4' />
                        Refresh
                    </button>
                )}
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

        if (Math.abs(amount) < 100) {
            return amount.toFixed(2)
        }

        // For larger numbers, no decimals needed
        return Math.round(amount).toString()
    }

    // Helper function to safely format transaction amounts
    const formatAmount = (amount: string | number): string => {
        if (amount === undefined || amount === null) return '0'

        let num: number
        if (typeof amount === 'number') {
            num = amount
        } else if (typeof amount === 'string') {
            num = parseFloat(amount)
            if (isNaN(num)) return '0'
        } else {
            return '0'
        }

        return formatSmallAmount(num)
    }

    // Helper function to format USD value
    const formatUsdValue = (value: string | number | null, symbol: string = ''): string => {
        // If value is null/undefined, try to find matching transaction by symbol
        if (value === null || value === undefined) {
            if (symbol) {
                const matchingTx = allTransactions.find(tx => tx.tokenSymbol === symbol)
                if (matchingTx && matchingTx.amount && typeof matchingTx.amount === 'number') {
                    return `$${parseFloat(matchingTx.amount).toFixed(2)}`
                }
            }
            return '' // Return empty string instead of "$0.00" to match HEAD behavior
        }

        let numValue: number
        if (typeof value === 'string') {
            numValue = parseFloat(value)
            if (isNaN(numValue)) return ''
        } else if (typeof value === 'number') {
            numValue = value
        } else {
            return ''
        }

        // Don't show USD value if it's zero or very small
        if (numValue === 0 || Math.abs(numValue) < 0.01) return ''

        return `$${numValue.toFixed(2)}`
    }

    // Helper function to format timestamp
    const formatTimestamp = (timestamp: number): string => {
        try {
            // Validate timestamp is reasonable (not in the future, not too far in the past)
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
            className='px-4'
            variants={animated ? container : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'show' : undefined}>
            {allTransactions.map(tx => {
                // Format USD value if available - try multiple properties
                const usdValue = formatUsdValue(tx.amount || 0, tx.tokenSymbol || '')
                const formattedAmount = formatAmount(tx.amount)
                const isOutgoing = (tx.type || '').toLowerCase() === 'send' || (tx.type || '').toLowerCase() === 'sent'

                return (
                    <TransactionComponent
                        key={tx.hash || tx.id}
                        variants={animated ? item : undefined}
                        className='hover:bg-muted/50 mb-4 flex rounded-md border-b border-[#272A3B] p-2 pb-4'>
                        <div className='mr-3'>
                            <div className={`rounded-full p-2 ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}>
                                {isOutgoing ? (
                                    <ArrowUpRight className='h-4 w-4 text-red-500' />
                                ) : (
                                    <ArrowDownLeft className='h-4 w-4 text-green-500' />
                                )}
                            </div>
                        </div>

                        <div className='min-w-0 flex-1'>
                            <div className='truncate font-medium'>
                                {getTypeText(tx.type || '')} {tx.tokenSymbol || ''}
                                {tx.networkName && (
                                    <span className='text-muted-foreground ml-1 text-xs'>on {tx.networkName}</span>
                                )}
                            </div>

                            <div className='text-muted-foreground text-xs'>
                                {formatTimestamp(tx.timestamp)}
                                {tx.status && (
                                    <span className={`ml-2 ${getStatusClass(tx.status)}`}>
                                        • {formatStatus(tx.status)}
                                    </span>
                                )}
                            </div>

                            <div className='flex items-baseline'>
                                <span className={`font-medium ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                                    {isOutgoing ? '-' : '+'}
                                    {formattedAmount} {tx.tokenSymbol || ''}
                                </span>
                                <span className='text-muted-foreground ml-2 text-xs'>{usdValue}</span>
                            </div>
                        </div>
                    </TransactionComponent>
                )
            })}

            {/* Show loading indicator for subsequent loads */}
            {isLoading && hasInitialized && (
                <div className='p-2 text-center'>
                    <div className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent' />
                </div>
            )}
        </ListComponent>
    )
})
