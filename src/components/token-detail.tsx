'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWallet } from '@/features/wallet/hooks/use-wallet'
import { settings$ } from '@/lib/stores/app.store'
import { cn } from '@/lib/utils/tailwind'
import { Check, Copy } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface TokenDetailProps {
    tokenId: string
    onClose: () => void
}

export function TokenDetail({ tokenId, onClose }: TokenDetailProps) {
    const { tokens, getTokenDistribution } = useWallet()
    const privacyMode = settings$.privacyMode.get()
    const token = tokens.find(t => t.id === tokenId)
    const [copied, setCopied] = useState(false)

    if (!token) return null

    const distribution = getTokenDistribution(tokenId)
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500']

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <div className='relative h-6 w-6 overflow-hidden rounded-full'>
                            <Image
                                src={token.icon || '/placeholder.svg'}
                                alt={token.name}
                                fill
                                className='object-cover'
                            />
                        </div>
                        {token.name} ({token.symbol})
                    </DialogTitle>
                    <DialogDescription>Distribution across chains</DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    <div className='flex h-4 w-full overflow-hidden rounded-full'>
                        {distribution.map((item, i) => (
                            <div
                                key={item.chain}
                                className={cn(colors[i % colors.length], 'h-full')}
                                style={{ width: `${(item.amount / token.balance) * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className='space-y-2'>
                        {distribution.map(item => (
                            <Card key={item.chain} className='overflow-hidden'>
                                <CardContent className='p-3'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <Badge variant='outline'>{item.chain}</Badge>
                                            <span className='text-sm font-medium'>
                                                {privacyMode
                                                    ? '••••••'
                                                    : `${item.amount.toLocaleString()} ${token.symbol}`}
                                            </span>
                                        </div>
                                        <div className='text-right'>
                                            <span className='text-muted-foreground text-sm'>
                                                {privacyMode
                                                    ? '••••••'
                                                    : `$${((item.amount * token.valueUsd) / token.balance).toFixed(2)}`}
                                            </span>
                                            <span className='text-muted-foreground ml-2 text-xs'>
                                                {privacyMode
                                                    ? '••%'
                                                    : `(${((item.amount / token.balance) * 100).toFixed(1)}%)`}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className='border-t pt-2'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>Contract Address</span>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='h-8 gap-1 text-xs'
                                onClick={() => handleCopy(token.id || '')}>
                                {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        <p className='text-muted-foreground mt-1 font-mono text-xs break-all'>
                            {privacyMode ? '••••••••••••••••••••••••••••••••••••••••••' : token.id || '0x1234...5678'}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
