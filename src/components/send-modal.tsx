'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
// import { useChainService } from '@/features/shared/services/chain-service'
import { Check } from 'lucide-react'
import { useState } from 'react'

interface SendModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SendModal({ open, onOpenChange }: SendModalProps) {
    // const { tokens } = useOktoPortfolio()
    // const { sendToken } = useTokenTransferService()
    // const { chains } = useChainService()

    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [selectedToken, setSelectedToken] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const [txHash, setTxHash] = useState('')

    // const selectedTokenData = tokens.find(t => t.id === selectedToken)

    const handleSend = async () => {
        // if (!selectedTokenData || !recipient || !amount) return

        setStatus('loading')
        setErrorMessage('')

        try {
            // Find the chain for the selected token
            // const tokenChain = selectedTokenData.chain
            // const chainData = chains.find(c => c.name.toLowerCase() === tokenChain)

            // if (!chainData) {
            //     throw new Error('Chain not found for selected token')
            // }

            // const result = await sendToken({
            //     tokenId: selectedTokenData.id,
            //     symbol: selectedTokenData.symbol,
            //     recipient,
            //     amount: parseFloat(amount),
            //     caip2Id: chainData.caip2Id,
            // })

            // setTxHash(result)
            setStatus('success')
        } catch (error) {
            console.error('Send transaction failed:', error)
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Transaction failed')
        }
    }

    const handleClose = () => {
        if (status !== 'loading') {
            onOpenChange(false)
            // Reset form after animation completes
            setTimeout(() => {
                setRecipient('')
                setAmount('')
                setSelectedToken('')
                setStatus('idle')
                setErrorMessage('')
                setTxHash('')
            }, 300)
        }
    }

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title='Send'
            description='Send tokens to another wallet address'
            contentClassName='max-w-md bg-gradient-to-br from-[#252531] to-[#13121E]'>
            <div className='space-y-4 pb-6'>
                {status === 'idle' && (
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='token'>Token</Label>
                            <select
                                id='token'
                                className='border-input bg-background w-full rounded-md border px-3 py-2'
                                value={selectedToken}
                                onChange={e => setSelectedToken(e.target.value)}>
                                <option value=''>Select a token</option>
                                {/* {tokens.map(token => (
                                        <option key={token.id} value={token.id}>
                                            {token.symbol} - {token.balance.toFixed(4)}
                                        </option>
                                    ))} */}
                            </select>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='recipient'>Recipient Address</Label>
                            <Input
                                id='recipient'
                                placeholder='0x...'
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                            />
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
                            {/* {selectedTokenData && (
                                <p className='text-muted-foreground text-xs'>
                                    Available: {selectedTokenData.balance.toFixed(4)} {selectedTokenData.symbol}
                                </p>
                            )} */}
                        </div>

                        <div className='flex space-x-2'>
                            <Button variant='outline' className='flex-1' onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                className='flex-1 bg-[#4364F9] text-white hover:bg-[#3a58da]'
                                onClick={handleSend}
                                disabled={!selectedToken || !recipient || !amount}>
                                Send
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
                                <span className='animate-bounce text-xl'>💸</span>
                            </div>
                        </div>

                        <p className='text-center font-medium'>Processing your transaction...</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            Please wait while we process your transaction. This may take a moment.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#4364F9]/10'>
                            <Check className='h-8 w-8 text-[#4364F9]' />
                        </div>
                        <p className='text-center font-medium'>Transaction Successful!</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            Your transaction has been successfully processed.
                        </p>
                        {txHash && <p className='text-center text-xs break-all'>Transaction Hash: {txHash}</p>}
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
                        <p className='text-center font-medium'>Transaction Failed</p>
                        <p className='text-muted-foreground text-center text-sm'>
                            {errorMessage || 'There was an error processing your transaction.'}
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
