'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { Check, CreditCard } from 'lucide-react'
import { useState } from 'react'

interface BuyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BuyModal({ open, onOpenChange }: BuyModalProps) {
    const [amount, setAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [selectedCrypto, setSelectedCrypto] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const [txId, setTxId] = useState('')

    const cryptoOptions = [
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', rate: 2500 },
        { id: 'btc', name: 'Bitcoin', symbol: 'BTC', rate: 40000 },
        { id: 'usdc', name: 'USD Coin', symbol: 'USDC', rate: 1 },
        { id: 'sol', name: 'Solana', symbol: 'SOL', rate: 100 },
    ]

    const paymentMethods = [
        { id: 'card', name: 'Credit/Debit Card' },
        { id: 'bank', name: 'Bank Transfer' },
        { id: 'apple', name: 'Apple Pay' },
    ]

    const selectedCryptoData = cryptoOptions.find(c => c.id === selectedCrypto)

    const handleBuy = async () => {
        if (!selectedCryptoData || !paymentMethod || !amount) return

        setStatus('loading')
        setErrorMessage('')

        try {
            // Simulate a purchase delay
            await new Promise(resolve => setTimeout(resolve, 3000))

            // For now, we'll just simulate success
            setTxId(`tx_${Math.random().toString(36).substring(2, 15)}`)
            setStatus('success')
        } catch (error) {
            console.error('Purchase failed:', error)
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Purchase failed')
        }
    }

    const handleClose = () => {
        if (status !== 'loading') {
            onOpenChange(false)
            // Reset form after animation completes
            setTimeout(() => {
                setAmount('')
                setPaymentMethod('')
                setSelectedCrypto('')
                setStatus('idle')
                setErrorMessage('')
                setTxId('')
            }, 300)
        }
    }

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title='Buy Crypto'
            description='Purchase crypto with your preferred payment method'
            contentClassName='max-w-md bg-gradient-to-br from-[#252531] to-[#13121E]'>
            <div className='space-y-4 pb-6'>
                {status === 'idle' && (
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='amount'>Amount (USD)</Label>
                            <Input
                                id='amount'
                                type='number'
                                placeholder='0.00'
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='crypto'>Select Crypto</Label>
                            <select
                                id='crypto'
                                className='border-input bg-background w-full rounded-md border px-3 py-2'
                                value={selectedCrypto}
                                onChange={e => setSelectedCrypto(e.target.value)}>
                                <option value=''>Select a cryptocurrency</option>
                                {cryptoOptions.map(crypto => (
                                    <option key={crypto.id} value={crypto.id}>
                                        {crypto.name} ({crypto.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCryptoData && amount && (
                            <div className='rounded-md bg-[#181723] p-3'>
                                <p className='text-sm'>
                                    You will receive approximately:{' '}
                                    {(parseFloat(amount) / selectedCryptoData.rate).toFixed(6)}{' '}
                                    {selectedCryptoData.symbol}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                    Rate: 1 {selectedCryptoData.symbol} = ${selectedCryptoData.rate.toFixed(2)} USD
                                </p>
                            </div>
                        )}

                        <div className='space-y-2'>
                            <Label htmlFor='payment'>Payment Method</Label>
                            <select
                                id='payment'
                                className='border-input bg-background w-full rounded-md border px-3 py-2'
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}>
                                <option value=''>Select a payment method</option>
                                {paymentMethods.map(method => (
                                    <option key={method.id} value={method.id}>
                                        {method.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex space-x-2'>
                            <Button variant='outline' className='flex-1' onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                className='flex-1 bg-[#4364F9] text-white hover:bg-[#3a58da]'
                                onClick={handleBuy}
                                disabled={!selectedCrypto || !paymentMethod || !amount}>
                                Buy
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
                                <CreditCard className='h-6 w-6 animate-pulse text-[#4364F9]' />
                            </div>
                        </div>

                        <p className='text-center font-medium'>Processing your purchase...</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            Please wait while we process your payment. This may take a moment.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#4364F9]/10'>
                            <Check className='h-8 w-8 text-[#4364F9]' />
                        </div>
                        <p className='text-center font-medium'>Purchase Successful!</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            Your crypto purchase has been successfully processed.
                        </p>
                        {txId && <p className='text-center text-xs break-all'>Transaction ID: {txId}</p>}
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
                        <p className='text-center font-medium'>Purchase Failed</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            {errorMessage || 'There was an error processing your purchase.'}
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
        </ResponsiveDialog>
    )
}
