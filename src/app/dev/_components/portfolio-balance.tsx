'use client'

import { useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'

// List of common tokens to check balances for with improved contrast colors
const TOKENS = [
    {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        address: null, // Native token
        logoChar: 'Ξ',
        color: '#7B68EE', // Brighter purple for better contrast
        textColor: '#FFFFFF',
    },
    {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        logoChar: 'U',
        color: '#2775CA',
        textColor: '#FFFFFF',
    },
    {
        id: 'usdt',
        name: 'Tether',
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
        logoChar: 'T',
        color: '#26A17B',
        textColor: '#FFFFFF',
    },
    {
        id: 'dai',
        name: 'Dai',
        symbol: 'DAI',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI on Ethereum
        logoChar: 'D',
        color: '#F5AC37',
        textColor: '#000000', // Black text for yellow background
    },
]

type CustomToken = {
    id: string
    name: string
    symbol: string
    address: `0x${string}` | null
    color: string
    textColor: string
    logoChar: string
}

// Individual token balance component to avoid dependency issues
function TokenBalance({ token, address }: { token: CustomToken; address: `0x${string}` | undefined }) {
    const { data, isLoading } = useBalance({
        address,
        token: token.address ? (token.address as `0x${string}`) : undefined,
    })

    if (isLoading || !data || parseFloat(data.formatted) <= 0) {
        return null
    }

    return (
        <div className='flex items-center rounded-lg bg-gray-500 p-3 dark:bg-gray-800/50'>
            <div
                className='flex h-10 w-10 items-center justify-center rounded-full font-bold'
                style={{
                    backgroundColor: token.color,
                    color: token.textColor,
                }}>
                {token.logoChar}
            </div>
            <div className='ml-3 flex-1'>
                <div className='font-medium'>{token.name}</div>
                <div className='text-sm text-gray-600 dark:text-gray-300'>
                    {parseFloat(data.formatted).toLocaleString('en-US', { maximumFractionDigits: 6 })} {token.symbol}
                </div>
            </div>
        </div>
    )
}

export function PortfolioBalance() {
    const account = useAccount()
    const [isLoading, setIsLoading] = useState(true)
    const walletAddress = account.addresses?.[0] as `0x${string}` | undefined

    // Set loading state based on account connection
    useEffect(() => {
        // Short delay to allow balances to load
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [account.status, walletAddress])

    if (account.status !== 'connected') {
        return null
    }

    return (
        <div className='card'>
            <h2 className='mb-4 text-2xl font-bold'>Portfolio Balance</h2>

            {/* Assets list */}
            <div>
                <h3 className='mb-3 text-lg font-medium'>Asset Details</h3>

                {isLoading ? (
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
                ) : (
                    <div className='space-y-3'>
                        {TOKENS.map(token => (
                            <TokenBalance key={token.id} token={token as CustomToken} address={walletAddress} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
