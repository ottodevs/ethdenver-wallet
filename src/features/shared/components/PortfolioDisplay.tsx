import { Button } from '@/components/ui/button'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import type { OktoTokenGroup } from '@/types/okto'
import { RefreshCw } from 'lucide-react'

/**
 * Displays the user's portfolio of tokens from Okto
 */
export function PortfolioDisplay() {
    const { data, isLoading, error, refetch } = useOktoPortfolio()

    // Loading state
    if (isLoading) {
        return (
            <div data-testid='portfolio-loading' className='space-y-4 p-4'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-bold'>Portfolio</h2>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => refetch()}
                        data-testid='portfolio-refresh'
                        disabled>
                        <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                        Loading...
                    </Button>
                </div>
                <div className='space-y-3'>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className='flex animate-pulse items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50'>
                            <div className='h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700' />
                            <div className='ml-3 flex-1'>
                                <div className='mb-2 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700' />
                                <div className='h-3 w-1/6 rounded bg-gray-200 dark:bg-gray-700' />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div data-testid='portfolio-error' className='p-4'>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-xl font-bold'>Portfolio</h2>
                    <Button variant='outline' size='sm' onClick={() => refetch()} data-testid='portfolio-refresh'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Refresh
                    </Button>
                </div>
                <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
                    <p>Error loading portfolio: {error.message}</p>
                </div>
            </div>
        )
    }

    // Empty state
    if (!data.group_tokens || data.group_tokens.length === 0) {
        return (
            <div data-testid='portfolio-empty' className='p-4'>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-xl font-bold'>Portfolio</h2>
                    <Button variant='outline' size='sm' onClick={() => refetch()} data-testid='portfolio-refresh'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Refresh
                    </Button>
                </div>
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400'>
                    <p>No tokens found in your portfolio.</p>
                </div>
            </div>
        )
    }

    // Data state
    return (
        <div data-testid='portfolio-data' className='p-4'>
            <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Portfolio</h2>
                <Button variant='outline' size='sm' onClick={() => refetch()} data-testid='portfolio-refresh'>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Refresh
                </Button>
            </div>

            <div className='space-y-3'>
                {data.group_tokens.map((token: OktoTokenGroup) => (
                    <TokenItem key={token.id} token={token} />
                ))}
            </div>
        </div>
    )
}

// Token item component
function TokenItem({ token }: { token: OktoTokenGroup }) {
    const balance = parseFloat(token.balance)
    const valueUsd = parseFloat(token.holdings_price_usdt)

    return (
        <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50'>
            <div className='flex items-center'>
                {token.token_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={token.token_image}
                        alt={token.name}
                        className='h-10 w-10 rounded-full'
                        width={40}
                        height={40}
                    />
                ) : (
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700'>
                        {token.symbol.substring(0, 2)}
                    </div>
                )}
                <div className='ml-3'>
                    <div className='font-medium'>{token.name}</div>
                    <div className='text-sm text-gray-500'>{token.symbol}</div>
                </div>
            </div>
            <div className='text-right'>
                <div className='font-medium'>{balance}</div>
                <div className='text-sm text-gray-500'>${valueUsd.toFixed(2)}</div>
            </div>
        </div>
    )
}
