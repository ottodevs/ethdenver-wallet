'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
// import { useChainService } from "@/services/chain-service"
import { ArrowDown, Check } from 'lucide-react'
import { useState } from 'react'

interface SwapInterfaceProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SwapInterface({ open, onOpenChange }: SwapInterfaceProps) {
    const { tokens } = useOktoPortfolio()
    // const { chains } = useChainService()

    const [fromToken, setFromToken] = useState('')
    const [toToken, setToToken] = useState('')
    const [amount, setAmount] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const fromTokenData = tokens.find(t => t.id === fromToken)
    const toTokenData = tokens.find(t => t.id === toToken)

    // This is a placeholder for swap functionality
    // In a real implementation, you would integrate with a DEX or swap service
    const handleSwap = async () => {
        if (!fromTokenData || !toTokenData || !amount) return

        setStatus('loading')
        setErrorMessage('')

        try {
            // Simulate a swap delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // For now, we'll just simulate success
            // In a real implementation, you would call a swap service
            setStatus('success')
        } catch (error) {
            console.error('Swap failed:', error)
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Swap failed')
        }
    }

    const handleClose = () => {
        if (status !== 'loading') {
            onOpenChange(false)
            // Reset form after animation completes
            setTimeout(() => {
                setFromToken('')
                setToToken('')
                setAmount('')
                setStatus('idle')
                setErrorMessage('')
            }, 300)
        }
    }

    const swapContent = (
        <div className='space-y-4'>
            {status === 'idle' && (
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='fromToken'>From</Label>
                        <select
                            id='fromToken'
                            className='border-input bg-background w-full rounded-md border px-3 py-2'
                            value={fromToken}
                            onChange={e => setFromToken(e.target.value)}>
                            <option value=''>Select a token</option>
                            {tokens.map(token => (
                                <option key={token.id} value={token.id}>
                                    {token.symbol} - {token.balance.toFixed(4)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='amount'>Amount</Label>
                        <Input
                            id='amount'
                            type='number'
                            placeholder='0.0'
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        {fromTokenData && (
                            <p className='text-muted-foreground text-xs'>
                                Available: {fromTokenData.balance.toFixed(4)} {fromTokenData.symbol}
                            </p>
                        )}
                    </div>

                    <div className='flex justify-center'>
                        <div className='rounded-full bg-[#181723] p-2'>
                            <ArrowDown className='h-5 w-5 text-[#4364F9]' />
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='toToken'>To</Label>
                        <select
                            id='toToken'
                            className='border-input bg-background w-full rounded-md border px-3 py-2'
                            value={toToken}
                            onChange={e => setToToken(e.target.value)}>
                            <option value=''>Select a token</option>
                            {tokens
                                .filter(t => t.id !== fromToken)
                                .map(token => (
                                    <option key={token.id} value={token.id}>
                                        {token.symbol}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {fromTokenData && toTokenData && amount && (
                        <div className='rounded-md bg-[#181723] p-3'>
                            <p className='text-sm'>
                                Estimated: {parseFloat(amount) * 0.98} {toTokenData.symbol}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                                1 {fromTokenData.symbol} ≈ {(fromTokenData.valueUsd / toTokenData.valueUsd).toFixed(6)}{' '}
                                {toTokenData.symbol}
                            </p>
                        </div>
                    )}

                    <div className='flex space-x-2'>
                        <Button variant='outline' className='flex-1' onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            className='flex-1 bg-[#4364F9] text-white hover:bg-[#3a58da]'
                            onClick={handleSwap}
                            disabled={!fromToken || !toToken || !amount}>
                            Swap
                        </Button>
                    </div>
                </div>
            )}

            {status === 'loading' && (
                <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                    <div className='relative mb-2 h-16 w-16'>
                        {/* Outer spinning ring */}
                        <div className='absolute inset-0 animate-spin rounded-full border-t-2 border-b-2 border-[#4364F9]' />

                        {/* Middle pulsing ring */}
                        <div className='absolute inset-2 animate-pulse rounded-full border-r-2 border-l-2 border-[#4364F9]/60' />

                        {/* Inner spinning ring (opposite direction) */}
                        <div className='animate-reverse absolute inset-4 animate-spin rounded-full border-t-2 border-b-2 border-[#4364F9]/40' />

                        {/* Center icon */}
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <span className='animate-bounce text-xl'>💱</span>
                        </div>
                    </div>

                    <p className='text-center font-medium'>Processing your swap...</p>
                    <p className='text-muted-foreground text-center text-sm'>
                        Please wait while we process your swap. This may take a moment.
                    </p>
                </div>
            )}

            {status === 'success' && (
                <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#4364F9]/10'>
                        <Check className='h-8 w-8 text-[#4364F9]' />
                    </div>
                    <p className='text-center font-medium'>Swap Successful!</p>
                    <p className='text-muted-foreground text-center text-sm'>
                        Your swap has been successfully processed.
                    </p>
                    <Button onClick={handleClose} className='bg-[#4364F9] text-white hover:bg-[#3a58da]'>
                        Close
                    </Button>
                </div>
            )}

            {status === 'error' && (
                <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                        <span className='text-2xl font-bold text-red-600'>!</span>
                    </div>
                    <p className='text-center font-medium'>Swap Failed</p>
                    <p className='text-muted-foreground text-center text-sm'>
                        {errorMessage || 'There was an error processing your swap.'}
                    </p>
                    <div className='flex space-x-2'>
                        <Button variant='outline' onClick={handleClose}>
                            Close
                        </Button>
                        <Button
                            onClick={() => setStatus('idle')}
                            className='bg-[#4364F9] text-white hover:bg-[#3a58da]'>
                            Try Again
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title='Swap'
            description='Swap tokens at the best rates'
            contentClassName='max-w-md bg-gradient-to-br from-[#252531] to-[#13121E]'>
            <div className='space-y-4 pb-6'>{swapContent}</div>
        </ResponsiveDialog>
    )
}
