'use client'

import { ConsolidateConfirmationModal } from '@/components/consolidate-confirmation-modal'
import { TokenDetail } from '@/components/token-detail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton as TokenSkeleton } from '@/components/ui/skeleton'
import { useTokenConsolidationService } from '@/features/assets/services/token-consolidation-service'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import { portfolioState$ } from '@/features/shared/state/portfolio-state'
import { useWallet } from '@/features/wallet/hooks/use-wallet'
import { observer } from '@legendapp/state/react'
import { Coins, Eye, EyeOff, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const TokenList = observer(function TokenList({ animated = true }: { animated?: boolean }) {
    const { privacyMode, togglePrivacyMode } = useWallet()
    const { refetch } = useOktoPortfolio()
    const [showTokenDetail, setShowTokenDetail] = useState<string | null>(null)
    const { consolidateToEth } = useTokenConsolidationService()
    const [isConsolidating, setIsConsolidating] = useState(false)
    const [showConsolidateModal, setShowConsolidateModal] = useState(false)
    const [showRefreshButton, setShowRefreshButton] = useState(false)

    // Get the values from the observable state
    const tokens = portfolioState$.tokens.get()
    const isLoading = portfolioState$.isLoading.get()
    const error = portfolioState$.error.get()
    const hasInitialized = portfolioState$.lastUpdated.get() > 0 || !!error

    // Calculate the low-value tokens
    const smallValueTokens = tokens.filter(token => token.valueUsd < 10 && !token.isNative)
    const totalSmallTokensValue = smallValueTokens.reduce((sum, t) => sum + t.valueUsd, 0)

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

    const handleOpenConsolidateModal = () => {
        setShowConsolidateModal(true)
    }

    const handleConsolidate = async () => {
        setIsConsolidating(true)
        try {
            const results = await consolidateToEth()

            if (results.length === 0) {
                toast.info('No tokens to consolidate', {
                    description: "You don't have any tokens under $10 to consolidate",
                })
            } else {
                toast.success(`Consolidating ${results.length} tokens to ETH`, {
                    description: 'Your low-value tokens are being converted to ETH',
                })

                // Refresh the token list after consolidation
                setTimeout(async () => {
                    await refetch(true)
                }, 3000)
            }
        } catch (error) {
            console.error('Consolidation failed:', error)
            toast.error('Failed to consolidate tokens', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            })
        } finally {
            setIsConsolidating(false)
            setShowConsolidateModal(false)
        }
    }

    // Show refresh button if there's an error or no tokens after initialization
    useEffect(() => {
        if ((error || (hasInitialized && tokens.length === 0)) && !isLoading) {
            setShowRefreshButton(true)
        } else {
            setShowRefreshButton(false)
        }
    }, [error, hasInitialized, tokens.length, isLoading])

    if (error) {
        return (
            <div className='p-4 text-center'>
                <p className='mb-2 text-red-400'>{error}</p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch(true)}
                        className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2'>
                        Retry
                    </button>
                )}
            </div>
        )
    }

    if (isLoading || !hasInitialized) {
        return (
            <div className='space-y-1'>
                {Array(3)
                    .fill(0)
                    .map((_, i) => (
                        <TokenSkeleton key={`skeleton-${i}`} />
                    ))}
            </div>
        )
    }

    if (tokens.length === 0 && hasInitialized && !isLoading) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center'>
                <Coins className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>No tokens found in your wallet</p>
                {showRefreshButton && (
                    <button
                        onClick={() => refetch(true)}
                        className='bg-primary text-primary-foreground hover:bg-primary/90 mt-3 rounded-md px-4 py-2'>
                        Refresh
                    </button>
                )}
            </div>
        )
    }

    const ListComponent = animated ? motion.div : 'div'
    const TokenComponent = animated ? motion.div : 'div'

    return (
        <>
            <ListComponent
                className='px-4'
                variants={animated ? container : undefined}
                initial={animated ? 'hidden' : undefined}
                animate={animated ? 'show' : undefined}>
                <div className='mb-2 flex items-center justify-between'>
                    <h3 className='text-sm font-medium'>Your Assets</h3>
                    <div className='flex items-center gap-2'>
                        <Button variant='ghost' size='icon' onClick={togglePrivacyMode} className='h-8 w-8'>
                            {privacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </Button>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <Share2 className='h-4 w-4' />
                        </Button>
                    </div>
                </div>

                {tokens.map(token => {
                    return (
                        <TokenComponent
                            key={token.id}
                            variants={animated ? item : undefined}
                            className='border-border hover:bg-muted/50 mb-4 flex items-center justify-between rounded-md border-b p-2 pb-4'
                            onClick={() => setShowTokenDetail(token.id)}>
                            <div className='flex items-center gap-3'>
                                <div className='flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white'>
                                    <div className='relative flex h-6 w-6 items-center justify-center'>
                                        <Image
                                            src={token.icon}
                                            alt={token.name}
                                            width={24}
                                            height={24}
                                            className='object-contain'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className='font-medium'>{token.name}</div>
                                    <div className='text-muted-foreground text-xs'>
                                        {privacyMode ? '••••••' : `${token.balance} ${token.symbol}`}
                                    </div>
                                </div>
                            </div>
                            <div className='text-right'>
                                <div className='font-medium'>
                                    {privacyMode ? '••••••' : `$${token.valueUsd.toFixed(2)}`}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                    {privacyMode ? '••••••' : `$${(token.valueUsd / token.balance).toFixed(2)}`}
                                </div>
                            </div>
                        </TokenComponent>
                    )
                })}

                {smallValueTokens.length > 0 && (
                    <Card className='bg-muted/30 mb-4 cursor-pointer overflow-hidden border-dashed'>
                        <CardContent className='p-3'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white'>
                                        <span className='text-primary text-xs font-medium'>
                                            +{smallValueTokens.length}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className='text-sm font-medium'>
                                            {smallValueTokens.length} tokens under $10
                                        </h3>
                                        <p className='text-muted-foreground text-xs'>
                                            Total value: ${totalSmallTokensValue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size='sm'
                                    onClick={e => {
                                        e.stopPropagation()
                                        handleOpenConsolidateModal()
                                    }}
                                    disabled={isConsolidating}>
                                    {isConsolidating ? 'Consolidating...' : 'Consolidate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </ListComponent>

            {showTokenDetail && <TokenDetail tokenId={showTokenDetail} onClose={() => setShowTokenDetail(null)} />}

            <ConsolidateConfirmationModal
                open={showConsolidateModal}
                onConfirm={handleConsolidate}
                isLoading={isConsolidating}
                onOpenChange={setShowConsolidateModal}
                tokensCount={smallValueTokens.length}
                totalValue={totalSmallTokensValue}
            />
        </>
    )
})
