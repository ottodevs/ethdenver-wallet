'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWallet } from '@/features/wallet/hooks/use-wallet'
import { useAuth } from '@/hooks/use-auth'
import type { UserOp } from '@okto_web3/react-sdk'
import { tokenTransfer, useOkto } from '@okto_web3/react-sdk'
import { useState } from 'react'

type TokenTransferParams = {
    amount: bigint
    recipient: `0x${string}`
    token: `0x${string}`
    caip2Id: string
}

export function TokenTransfer() {
    const oktoClient = useOkto()
    const { tokens } = useWallet()
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [selectedToken, setSelectedToken] = useState('')
    const [status, setStatus] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { isAuthenticated } = useAuth()

    async function handleTransfer() {
        if (!recipient || !amount || !selectedToken) {
            setStatus('Please fill all fields')
            return
        }

        if (!isAuthenticated) {
            setStatus('Authentication required')
            return
        }

        setIsLoading(true)
        setStatus('Preparing transfer...')

        try {
            const token = tokens.find(t => t.id === selectedToken)
            if (!token) throw new Error('Token not found')

            // Get the CAIP-2 ID for the chain
            const caip2IdMap: Record<string, string> = {
                ethereum: 'eip155:1',
                polygon: 'eip155:137',
                arbitrum: 'eip155:42161',
                optimism: 'eip155:10',
                base: 'eip155:8453',
            }

            const caip2Id = caip2IdMap[token.chain] || 'eip155:1'

            // Convert amount to BigInt with proper decimals (usually 18 for most tokens)
            const amountValue = parseFloat(amount)
            const amountInSmallestUnit = BigInt(amountValue * 10 ** 18)

            const transferParams: TokenTransferParams = {
                amount: amountInSmallestUnit,
                recipient: recipient as `0x${string}`,
                token: '' as `0x${string}`, // Empty string for native token, or token contract address
                caip2Id: caip2Id,
            }

            setStatus('Creating transfer operation...')
            const userOp = (await tokenTransfer(oktoClient, transferParams)) as UserOp

            setStatus('Signing operation...')
            const signedUserOp = await oktoClient.signUserOp(userOp)

            setStatus('Executing transfer...')
            const txHash = await oktoClient.executeUserOp(signedUserOp)

            setStatus(`Transfer successful! Transaction hash: ${txHash}`)
        } catch (error: unknown) {
            console.error('Transfer failed:', error)
            setStatus(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Tokens</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <Label htmlFor='token'>Token</Label>
                    <select
                        id='token'
                        value={selectedToken}
                        onChange={e => setSelectedToken(e.target.value)}
                        className='w-full rounded border p-2'>
                        <option value=''>Select a token</option>
                        {tokens.map(token => (
                            <option key={token.id} value={token.id}>
                                {token.symbol} - {token.balance.toFixed(4)}
                            </option>
                        ))}
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
                </div>

                <Button
                    onClick={handleTransfer}
                    disabled={isLoading || !recipient || !amount || !selectedToken}
                    className='w-full'>
                    {isLoading ? 'Processing...' : 'Send'}
                </Button>

                {status && <div className='bg-muted mt-4 rounded p-3 text-sm'>{status}</div>}
            </CardContent>
        </Card>
    )
}
