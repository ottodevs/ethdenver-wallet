'use client'

import { observer, useObservable } from '@legendapp/state/react'
import { Coins, Eye, EyeOff, Share2 } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { settings$, togglePrivacyMode } from '@/lib/stores/app.store'
import { portfolioState$, refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// Animation variants
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

// Memoized header actions component
const HeaderActions = memo(function HeaderActions() {
    return (
        <div className='flex items-center gap-2'>
            <PrivacyToggle />
            <Button variant='ghost' size='icon' className='h-8 w-8'>
                <Share2 className='h-4 w-4' />
            </Button>
        </div>
    )
})

// Privacy toggle component
const PrivacyToggle = memo(function PrivacyToggle() {
    return (
        <Button variant='ghost' size='icon' onClick={togglePrivacyMode} className='h-8 w-8'>
            <PrivacyToggleIcon />
        </Button>
    )
})

const PrivacyToggleIcon = observer(() => {
    const privacyMode = settings$.privacyMode.get()
    return privacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />
})

// Token item component (memoized)
const TokenItem = observer(function TokenItem({
    id,
    symbol,
    name,
    image,
    balance,
    valueUsd,
    chain,
}: {
    id: string
    symbol: string
    name: string
    image: string
    balance: number
    valueUsd: number
    chain: string
}) {
    const privacyMode = settings$.privacyMode.get()

    // Format the balance with appropriate decimal places
    const formattedBalance = balance.toLocaleString('en-US', {
        maximumFractionDigits: balance < 0.001 ? 8 : balance < 1 ? 4 : 2,
    })

    // Format the value with 2 decimal places
    const formattedValue = valueUsd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    return (
        <motion.div
            variants={item}
            className='mb-3 flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'
            data-testid={`token-item-${id}`}>
            <div className='flex items-center gap-3'>
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        width={40}
                        height={40}
                        className='rounded-full'
                        onError={e => {
                            // Fallback for broken images
                            e.currentTarget.src = 'https://placehold.co/40x40/6366f1/ffffff?text=' + symbol.charAt(0)
                        }}
                    />
                ) : (
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white'>
                        {symbol.charAt(0)}
                    </div>
                )}
                <div>
                    <div className='font-medium'>{name}</div>
                    <div className='text-muted-foreground text-sm'>
                        {privacyMode ? '••••••' : `${formattedBalance} ${symbol}`}
                    </div>
                </div>
            </div>
            <div className='text-right'>
                <div className='font-medium'>{privacyMode ? '••••••' : `$${formattedValue}`}</div>
                <div className='text-muted-foreground text-sm'>{chain}</div>
            </div>
        </motion.div>
    )
})

// Small value tokens consolidation card
const ConsolidationCard = observer(function ConsolidationCard() {
    // Find tokens with small values (less than $10)
    const portfolio = useObservable(portfolioState$)

    const smallValueTokens = useMemo(() => {
        const portfolioData = portfolio.get()
        if (!portfolioData || !portfolioData.group_tokens) return []

        return portfolioData.group_tokens.flatMap(group => {
            // If the group has tokens, filter those with small values
            if (group.tokens && group.tokens.length > 0) {
                return group.tokens
                    .filter(token => parseFloat(token.holdings_price_usdt || '0') < 10)
                    .map(token => ({
                        id: token.id,
                        name: token.name,
                        symbol: token.symbol,
                        valueUsd: parseFloat(token.holdings_price_usdt || '0'),
                    }))
            }

            // Otherwise, check if the group itself has a small value
            const valueUsd = parseFloat(group.holdings_price_usdt || '0')
            if (valueUsd < 10) {
                return [
                    {
                        id: group.id,
                        name: group.name,
                        symbol: group.symbol,
                        valueUsd,
                    },
                ]
            }

            return []
        })
    }, [portfolio])

    const totalValue = useMemo(() => {
        return smallValueTokens.reduce((sum, token) => sum + token.valueUsd, 0)
    }, [smallValueTokens])

    if (smallValueTokens.length === 0) return null

    return (
        <Card className='bg-muted/30 mb-4 overflow-hidden border-dashed'>
            <CardContent className='p-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white'>
                            <span className='text-primary text-xs font-medium'>+{smallValueTokens.length}</span>
                        </div>
                        <div>
                            <h3 className='text-sm font-medium'>{smallValueTokens.length} tokens under $10</h3>
                            <p className='text-muted-foreground text-xs'>Total value: ${totalValue.toFixed(2)}</p>
                        </div>
                    </div>
                    <Button
                        size='sm'
                        onClick={() => {
                            toast.info('Token consolidation coming soon!', {
                                description: 'This feature will be available in a future update.',
                            })
                        }}>
                        Consolidate
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
})

// Loading skeleton for token items
const TokenItemSkeleton = () => (
    <div className='mb-3 flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
        <div className='flex items-center gap-3'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div>
                <Skeleton className='mb-1 h-5 w-24' />
                <Skeleton className='h-4 w-16' />
            </div>
        </div>
        <div className='text-right'>
            <Skeleton className='mb-1 h-5 w-16' />
            <Skeleton className='h-4 w-12' />
        </div>
    </div>
)

// Empty state component
const EmptyTokenList = () => (
    <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800'>
        <div className='mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-700'>
            <Coins className='h-6 w-6 text-gray-500 dark:text-gray-400' />
        </div>
        <h3 className='mb-1 text-lg font-medium'>No tokens found</h3>
        <p className='text-muted-foreground mb-4 max-w-xs text-sm'>
            Your wallet doesn&apos;t have any tokens yet. Tokens will appear here once you receive them.
        </p>
    </div>
)

// Main token list component
export const TokenList = observer(function TokenList({ animated = true }: { animated?: boolean }) {
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const portfolio = useObservable(portfolioState$)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
    const [searchQuery] = useState('')
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const retryCountRef = useRef(0)
    const maxRetries = 3
    const [debugInfo, setDebugInfo] = useState<string | null>(null)
    const hasInitializedRef = useRef(false)
    const [error, setError] = useState<string | null>(null)

    // Memoize the setDebugInfo function to reduce renders
    const setDebugInfoMemo = useCallback((message: string | null) => {
        if (process.env.NODE_ENV === 'production') return
        setDebugInfo(message)
    }, [])

    // Extract tokens from portfolio data
    const tokens = useMemo(() => {
        const portfolioData = portfolio.get()
        console.log('🪙 [token-list] Portfolio data for tokens:', portfolioData)

        if (!portfolioData || !portfolioData.group_tokens) {
            console.log('🪙 [token-list] No portfolio data or tokens, returning empty array')
            return []
        }

        // Flatten group tokens into a single array of tokens
        const extractedTokens = portfolioData.group_tokens.flatMap(group => {
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

        console.log('🪙 [token-list] Extracted tokens:', extractedTokens.length)
        return extractedTokens
    }, [portfolio])

    // Use the memoized function instead of setDebugInfo directly
    useEffect(() => {
        if (isAuthenticated.get() && !hasInitializedRef.current) {
            hasInitializedRef.current = true

            setDebugInfoMemo('Refreshing after login...')

            refreshPortfolio()
                .then(result => {
                    if (result && result.group_tokens?.length) {
                        setDebugInfoMemo(`Loaded ${result.group_tokens.length} tokens after login`)
                    } else {
                        setDebugInfoMemo('No data after login refresh')
                    }
                })
                .catch(error => {
                    setDebugInfoMemo(
                        `Error loading tokens after login: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    )
                })
        } else if (isAuthenticated.get() && portfolio.get() && portfolio.get()?.group_tokens) {
            setDebugInfoMemo(`Already loaded ${portfolio.get()?.group_tokens.length} tokens`)
        }
    }, [isAuthenticated, portfolio, setDebugInfoMemo])

    // Attempt to refresh portfolio data if authenticated but no data
    useEffect(() => {
        const checkAndRefreshPortfolio = async () => {
            // Clear any existing timeout
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
                refreshTimeoutRef.current = null
            }

            console.log('🪙 [token-list] Auth state:', isAuthenticated.get())
            console.log('🪙 [token-list] Portfolio data:', portfolio.get())

            if (!isAuthenticated.get()) {
                console.log('🪙 [token-list] Not authenticated, skipping refresh')
                setIsLoading(false)
                return
            }

            const currentPortfolio = portfolio.get()
            const hasValidData =
                currentPortfolio && currentPortfolio.group_tokens && currentPortfolio.group_tokens.length > 0

            console.log('🪙 [token-list] Has valid data:', hasValidData)

            // Check if we need to refresh based on lastUpdated timestamp
            const shouldRefresh =
                !hasValidData ||
                !currentPortfolio.lastUpdated ||
                Date.now() - currentPortfolio.lastUpdated > 5 * 60 * 1000 // 5 minutes

            if (hasValidData && !shouldRefresh) {
                // We have valid data that's recent, so we're not loading
                console.log('🪙 [token-list] Valid recent data found, setting loading to false')
                setIsLoading(false)
                retryCountRef.current = 0
                setDebugInfoMemo(`${currentPortfolio.group_tokens.length} tokens loaded (cached)`)
                return
            }

            // If we're authenticated but don't have data or data is stale, and haven't exceeded max retries
            if (isAuthenticated.get() && shouldRefresh && retryCountRef.current < maxRetries && !hasAttemptedRefresh) {
                console.log('🪙 [token-list] No valid data or data is stale, attempting refresh')
                setIsLoading(true)
                setHasAttemptedRefresh(true)
                retryCountRef.current += 1
                setDebugInfoMemo(`Refreshing tokens (attempt ${retryCountRef.current}/${maxRetries})`)

                try {
                    console.log('🪙 [token-list] Calling refreshPortfolio()')
                    const refreshedData = await refreshPortfolio()
                    console.log('🪙 [token-list] Refresh result:', refreshedData)

                    // Check if we have data after refresh
                    const refreshedPortfolio = portfolio.get()
                    console.log('🪙 [token-list] Portfolio after refresh:', refreshedPortfolio)

                    if (
                        refreshedPortfolio &&
                        refreshedPortfolio.group_tokens &&
                        refreshedPortfolio.group_tokens.length > 0
                    ) {
                        console.log('🪙 [token-list] Refresh successful, setting loading to false')
                        setIsLoading(false)

                        // Add lastUpdated timestamp to the portfolio data
                        portfolioState$.set({
                            ...refreshedPortfolio,
                            lastUpdated: Date.now(),
                        })

                        setDebugInfoMemo(`${refreshedPortfolio.group_tokens.length} tokens refreshed`)
                    } else {
                        // If still no data, schedule another retry with exponential backoff
                        console.log('🪙 [token-list] Still no data after refresh, scheduling retry')
                        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                        setDebugInfoMemo(`No tokens after refresh, retrying in ${backoffTime / 1000}s`)

                        refreshTimeoutRef.current = setTimeout(() => {
                            setHasAttemptedRefresh(false) // Reset to trigger another attempt
                        }, backoffTime)
                    }
                } catch (error) {
                    // If error, retry with backoff
                    console.error('🪙 [token-list] Error refreshing portfolio:', error)
                    const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    setDebugInfoMemo(`Error refreshing: ${errorMessage}`)

                    // Set a specific error message that will be displayed in the UI
                    setError(`Error refreshing: ${errorMessage}`)

                    refreshTimeoutRef.current = setTimeout(() => {
                        setHasAttemptedRefresh(false) // Reset to trigger another attempt
                    }, backoffTime)
                }
            } else if (retryCountRef.current >= maxRetries) {
                // If we've exceeded max retries, stop loading
                console.log('🪙 [token-list] Max retries exceeded, stopping attempts')
                setIsLoading(false)
                setDebugInfoMemo(`Max retries (${maxRetries}) exceeded`)

                // Set a specific error message for max retries
                setError(`Error refreshing: Max retries (${maxRetries}) exceeded`)
            }
        }

        // Use requestIdleCallback or setTimeout to defer initialization
        // This ensures the UI renders first, then we load data
        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    checkAndRefreshPortfolio()
                })
            } else {
                setTimeout(checkAndRefreshPortfolio, 100)
            }
        } else {
            // Server-side - just check if we have data
            const currentPortfolio = portfolio.get()
            if (currentPortfolio && currentPortfolio.group_tokens && currentPortfolio.group_tokens.length > 0) {
                setIsLoading(false)
                setDebugInfoMemo(`${currentPortfolio.group_tokens.length} tokens loaded (SSR)`)
            }
        }

        // Cleanup function to clear any timeouts
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
                refreshTimeoutRef.current = null
            }
        }
    }, [isAuthenticated, portfolio, hasAttemptedRefresh, setDebugInfoMemo])

    // Memoize the filtered tokens to prevent recalculation on every render
    const _filteredTokens = useMemo(() => {
        const portfolioData = portfolio.get()
        if (!portfolioData?.group_tokens) return []

        return portfolioData.group_tokens
            .filter(token => {
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query)
            })
            .sort((a, b) => {
                const aValue = parseFloat(a.holdings_price_usdt || '0')
                const bValue = parseFloat(b.holdings_price_usdt || '0')
                return bValue - aValue
            })
    }, [portfolio, searchQuery])

    // Memoize the manual refresh handler
    const handleManualRefresh = useCallback(async () => {
        if (!isAuthenticated.get()) return

        setIsLoading(true)
        setIsRefreshing(true)
        setDebugInfoMemo('Manually refreshing tokens...')
        setError(null) // Clear any previous errors

        try {
            const result = await refreshPortfolio(true)

            if (result && result.group_tokens?.length) {
                setDebugInfoMemo(`Refreshed ${result.group_tokens.length} tokens`)
                toast.success('Tokens refreshed successfully')
            } else {
                setDebugInfoMemo('Refresh completed but no tokens found')
                toast.info('No tokens found')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setDebugInfoMemo(`Refresh error: ${errorMessage}`)
            setError(`Error refreshing: ${errorMessage}`)
            toast.error('Failed to refresh tokens')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [isAuthenticated, setDebugInfoMemo])

    // Determine which component to use based on animation flag
    const ListContainer = animated ? motion.div : 'div'
    const animationProps = animated
        ? {
              variants: container,
              initial: 'hidden',
              animate: 'show',
          }
        : {}

    // Render the component
    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>Tokens</h2>
                <HeaderActions />
            </div>

            {/* Debug info (only in development) */}
            {debugInfo && <div className='mb-2 text-xs text-gray-500 dark:text-gray-400'>{debugInfo}</div>}

            {/* Error message */}
            {error && (
                <div className='mb-2 text-sm text-red-500 dark:text-red-400' data-testid='token-list-error'>
                    {error}
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className='space-y-2'>
                    <TokenItemSkeleton />
                    <TokenItemSkeleton />
                    <TokenItemSkeleton />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && tokens.length === 0 && (
                <>
                    <EmptyTokenList />
                    <div className='mt-4 flex justify-center'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleManualRefresh}
                            disabled={isRefreshing || !isAuthenticated.get()}>
                            Refresh Tokens
                        </Button>
                    </div>
                </>
            )}

            {/* Token list */}
            {!isLoading && tokens.length > 0 && (
                <>
                    <ConsolidationCard />
                    <ListContainer {...animationProps} className='space-y-2'>
                        {tokens.map(token => (
                            <TokenItem
                                key={token.id}
                                id={token.id}
                                symbol={token.symbol}
                                name={token.name}
                                image={token.image}
                                balance={token.balance}
                                valueUsd={token.valueUsd}
                                chain={token.chain}
                            />
                        ))}
                    </ListContainer>
                    <div className='mt-4 flex justify-center'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleManualRefresh}
                            disabled={isRefreshing || !isAuthenticated.get()}>
                            {isRefreshing ? 'Refreshing...' : 'Refresh Tokens'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
})
