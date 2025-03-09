'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOktoNFTs } from '@/features/shared/hooks/use-okto-nfts'
import { nftsState$ } from '@/features/shared/state/nfts-state'
import { observer } from '@legendapp/state/react'
import { ImageIcon } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

export const NFTGallery = observer(function NFTGallery({ animated = true }: { animated?: boolean }) {
    const { transferNFT, refetch } = useOktoNFTs()
    const [selectedNft, setSelectedNft] = useState<string | null>(null)
    const [transferModalOpen, setTransferModalOpen] = useState(false)
    const [recipient, setRecipient] = useState('')
    const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Obtenemos los valores del estado observable
    const nfts = nftsState$.nfts.get()
    const isLoading = nftsState$.isLoading.get()
    const error = nftsState$.error.get()
    const hasInitialized = nftsState$.hasInitialized.get() || nftsState$.lastUpdated.get() > 0

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

    const handleTransfer = async () => {
        if (!selectedNft || !recipient) return

        const nft = nfts.find(n => n.id === selectedNft)
        if (!nft) return

        setTransferStatus('loading')
        setErrorMessage('')

        try {
            await transferNFT(nft, recipient)
            setTransferStatus('success')
        } catch (error) {
            console.error('NFT transfer failed:', error)
            setTransferStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Transfer failed')
        }
    }

    const handleNftClick = (nftId: string) => {
        setSelectedNft(nftId)
        setTransferModalOpen(true)
        setTransferStatus('idle')
        setRecipient('')
        setErrorMessage('')
    }

    if (isLoading && !hasInitialized) {
        return (
            <div className='flex h-[300px] items-center justify-center'>
                <p className='text-muted-foreground text-sm'>Loading NFTs...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className='flex h-[300px] items-center justify-center'>
                <p className='text-sm text-red-500'>{error}</p>
                <Button onClick={() => refetch(true)} className='mt-4'>
                    Retry
                </Button>
            </div>
        )
    }

    if (!nfts || nfts.length === 0) {
        return (
            <div className='flex h-[300px] flex-col items-center justify-center'>
                <ImageIcon className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>No NFTs found</p>
                {hasInitialized && (
                    <Button onClick={() => refetch(true)} className='mt-4'>
                        Refresh
                    </Button>
                )}
            </div>
        )
    }

    const GalleryComponent = animated ? motion.div : 'div'
    const NFTComponent = animated ? motion.div : 'div'

    return (
        <>
            <GalleryComponent
                className='grid grid-cols-2 gap-3 px-4'
                variants={animated ? container : undefined}
                initial={animated ? 'hidden' : undefined}
                animate={animated ? 'show' : undefined}>
                {nfts.map(nft => (
                    <NFTComponent
                        key={nft.id}
                        className='border-border cursor-pointer overflow-hidden rounded-lg border'
                        variants={animated ? item : undefined}
                        onClick={() => handleNftClick(nft.id)}>
                        <div className='relative aspect-square'>
                            <Image src={nft.image} alt={nft.name} fill className='object-cover' />
                        </div>
                        <div className='p-2'>
                            <div className='truncate font-medium'>{nft.name}</div>
                            <div className='text-muted-foreground truncate text-xs'>{nft.collection}</div>
                        </div>
                    </NFTComponent>
                ))}
            </GalleryComponent>

            <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer NFT</DialogTitle>
                    </DialogHeader>

                    {transferStatus === 'idle' && (
                        <div className='space-y-4'>
                            {selectedNft && (
                                <div className='flex items-center space-x-3'>
                                    <div className='h-16 w-16 overflow-hidden rounded-lg'>
                                        <Image
                                            src={nfts.find(n => n.id === selectedNft)?.image || ''}
                                            alt='NFT'
                                            className='h-full w-full object-cover'
                                        />
                                    </div>
                                    <div>
                                        <p className='font-medium'>{nfts.find(n => n.id === selectedNft)?.name}</p>
                                        <p className='text-muted-foreground text-sm'>
                                            {nfts.find(n => n.id === selectedNft)?.collection}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className='space-y-2'>
                                <Label htmlFor='recipient'>Recipient Address</Label>
                                <Input
                                    id='recipient'
                                    placeholder='0x...'
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                />
                            </div>

                            <div className='flex justify-end space-x-2'>
                                <Button variant='outline' onClick={() => setTransferModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleTransfer} disabled={!recipient}>
                                    Transfer
                                </Button>
                            </div>
                        </div>
                    )}

                    {transferStatus === 'loading' && (
                        <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                            <div className='border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent' />
                            <p className='text-center'>Processing transfer...</p>
                        </div>
                    )}

                    {transferStatus === 'success' && (
                        <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                                <svg
                                    className='h-6 w-6 text-green-600 dark:text-green-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M5 13l4 4L19 7'
                                    />
                                </svg>
                            </div>
                            <p className='text-center font-medium'>NFT Transfer Successful!</p>
                            <Button onClick={() => setTransferModalOpen(false)}>Close</Button>
                        </div>
                    )}

                    {transferStatus === 'error' && (
                        <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                                <span className='text-xl font-bold text-red-600 dark:text-red-400'>!</span>
                            </div>
                            <p className='text-center font-medium'>Transfer Failed</p>
                            <p className='text-muted-foreground text-center text-sm'>
                                {errorMessage || 'There was an error transferring your NFT.'}
                            </p>
                            <div className='flex space-x-2'>
                                <Button variant='outline' onClick={() => setTransferModalOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={handleTransfer} disabled={!recipient}>
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
})
