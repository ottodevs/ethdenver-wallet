import { observer } from '@legendapp/state/react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useOktoNft } from '@/features/shared/hooks/use-okto-nft'

type NftDetail = {
    nft_id: string
    nft_name: string
    image: string
    collection_name: string
    network_name: string
    explorer_smart_contract_url: string
}
// NFT item component (memoized)
const NftItem = memo(function NftItem({
    // id,
    name,
    image,
    collectionName,
    network,
    explorerUrl,
}: {
    id: string
    name: string
    image: string
    collectionName: string
    network: string
    explorerUrl: string
}) {
    // Open NFT in explorer
    const openInExplorer = useCallback(() => {
        if (explorerUrl) {
            window.open(explorerUrl, '_blank')
        }
    }, [explorerUrl])

    return (
        <div className='group relative overflow-hidden rounded-lg border dark:border-gray-800'>
            <div className='aspect-square overflow-hidden'>
                {image ? (
                    <Image
                        src={image}
                        alt={name || 'NFT'}
                        width={300}
                        height={300}
                        className='h-full w-full object-cover transition-transform group-hover:scale-105'
                        onError={e => {
                            // Fallback for broken images
                            ;(e.target as HTMLImageElement).src = '/images/nft-placeholder.png'
                        }}
                    />
                ) : (
                    <div className='flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700'>
                        <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>No Image</span>
                    </div>
                )}
            </div>
            <div className='p-3'>
                <h3 className='line-clamp-1 font-medium' title={name}>
                    {name || 'Unnamed NFT'}
                </h3>
                <div className='flex items-center justify-between'>
                    <p className='line-clamp-1 text-sm text-gray-500 dark:text-gray-400' title={collectionName}>
                        {collectionName || 'Unknown Collection'}
                    </p>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>{network}</span>
                </div>
            </div>
            {explorerUrl && (
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={openInExplorer}
                    className='absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 dark:bg-white/20 dark:hover:bg-white/30'
                    title='View on Explorer'>
                    <ExternalLink className='h-4 w-4' />
                </Button>
            )}
        </div>
    )
})

// Collection component
const Collection = memo(function Collection({
    name,
    image,
    // address,
    nfts,
}: {
    name: string
    image: string
    address: string
    nfts: Array<{
        nft_id: string
        nft_name: string
        image: string
        collection_name: string
        network_name: string
        explorer_smart_contract_url: string
    }>
}) {
    return (
        <div className='space-y-3'>
            <div className='flex items-center gap-3'>
                <div className='relative h-8 w-8 overflow-hidden rounded-full'>
                    {image ? (
                        <Image
                            src={image}
                            alt={name}
                            width={32}
                            height={32}
                            className='h-full w-full object-cover'
                            onError={e => {
                                // Fallback for broken images
                                ;(e.target as HTMLImageElement).src = '/images/nft-placeholder.png'
                            }}
                        />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700'>
                            <span className='text-xs font-bold'>{name.substring(0, 2)}</span>
                        </div>
                    )}
                </div>
                <h3 className='text-lg font-semibold'>{name}</h3>
                <span className='text-sm text-gray-500 dark:text-gray-400'>{nfts.length} items</span>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {nfts.map(nft => (
                    <NftItem
                        key={nft.nft_id}
                        id={nft.nft_id}
                        name={nft.nft_name}
                        image={nft.image}
                        collectionName={nft.collection_name}
                        network={nft.network_name}
                        explorerUrl={nft.explorer_smart_contract_url}
                    />
                ))}
            </div>
        </div>
    )
})

// Empty state component
const EmptyState = memo(function EmptyState() {
    return (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800'>
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-6 w-6 text-gray-400'>
                    <rect width='20' height='16' x='2' y='4' rx='2' />
                    <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
                </svg>
            </div>
            <h3 className='mb-1 text-lg font-medium'>No NFTs found</h3>
            <p className='mb-4 max-w-md text-sm text-gray-500 dark:text-gray-400'>
                Your wallet doesn&apos;t have any NFT collections yet. Once you receive NFTs, they will appear here.
            </p>
        </div>
    )
})

// Loading skeleton component
const NftGallerySkeleton = memo(function NftGallerySkeleton() {
    return (
        <div className='space-y-6'>
            {Array.from({ length: 2 }).map((_, collectionIndex) => (
                <div key={collectionIndex} className='space-y-3'>
                    <div className='flex items-center gap-3'>
                        <Skeleton className='h-8 w-8 rounded-full' />
                        <Skeleton className='h-6 w-40' />
                        <Skeleton className='h-4 w-16' />
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className='overflow-hidden rounded-lg border dark:border-gray-800'>
                                <Skeleton className='aspect-square w-full' />
                                <div className='space-y-2 p-3'>
                                    <Skeleton className='h-5 w-3/4' />
                                    <div className='flex items-center justify-between'>
                                        <Skeleton className='h-4 w-1/2' />
                                        <Skeleton className='h-3 w-12' />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
})

// Error boundary component
const ErrorBoundary = memo(function ErrorBoundary({
    error,
    onRetry,
    isRetrying = false,
}: {
    error: Error | null
    onRetry: () => void
    isRetrying?: boolean
}) {
    if (!error) return null

    return (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/20'>
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-6 w-6 text-red-500'>
                    <circle cx='12' cy='12' r='10' />
                    <line x1='12' y1='8' x2='12' y2='12' />
                    <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
            </div>
            <h3 className='mb-1 text-lg font-medium'>Error loading NFTs</h3>
            <p className='mb-4 max-w-md text-sm text-gray-500 dark:text-gray-400'>
                {error.message.includes('No Active Collections Found')
                    ? "You don't have any NFT collections yet."
                    : `There was a problem loading your NFTs: ${error.message}`}
            </p>
            <Button variant='outline' size='sm' onClick={onRetry} disabled={isRetrying} className='gap-1'>
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>Try Again</span>
            </Button>
        </div>
    )
})

// Main NFTGallery component
export const NFTGallery = observer(function NFTGallery() {
    const { data, hasNoCollections, error, isLoading, refetch } = useOktoNft()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [componentError, setComponentError] = useState<Error | null>(null)
    const totalCount = data?.count ?? 0

    // Reset component error when data changes
    useEffect(() => {
        if (data) {
            setComponentError(null)
        }
    }, [data])

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        setComponentError(null)
        try {
            await refetch()
        } catch (err) {
            console.log('Failed to refresh NFT gallery:', err)
            // Don't set error for "No Active Collections" case
            if (err instanceof Error && !err.message.includes('No Active Collections Found')) {
                if (err instanceof Error) {
                    setComponentError(err)
                } else {
                    setComponentError(new Error(String(err)))
                }
            } else if (err instanceof Error && err.message.includes('No Active Collections Found')) {
                // Set hasNoCollections flag manually if we catch this specific error
                console.log('Setting hasNoCollections flag due to caught error')
            }
        } finally {
            setIsRefreshing(false)
        }
    }, [refetch])

    // Show error state with a more user-friendly message
    if (error || componentError) {
        const displayError = error || componentError
        // Don't show error UI for "No Active Collections" case
        if (displayError && displayError.message.includes('No Active Collections Found')) {
            return <EmptyState />
        }

        return <ErrorBoundary error={displayError} onRetry={handleRefresh} isRetrying={isRefreshing} />
    }

    // Show empty state when there are no collections
    if (hasNoCollections || (!isLoading && (!data || !data.details || data.details.length === 0))) {
        return <EmptyState />
    }

    // Show loading state
    if (isLoading) {
        return <NftGallerySkeleton />
    }

    // Group NFTs by collection
    const nftsByCollection =
        data?.details?.reduce(
            (acc, nft) => {
                try {
                    const collectionAddress = nft.collection_address
                    if (!acc[collectionAddress]) {
                        acc[collectionAddress] = {
                            name: nft.collection_name || 'Unknown Collection',
                            image: nft.collection_image || '',
                            address: collectionAddress,
                            nfts: [],
                        }
                    }
                    acc[collectionAddress].nfts.push(nft)
                } catch (err) {
                    console.error('Error processing NFT:', err, nft)
                }
                return acc
            },
            {} as Record<string, { name: string; image: string; address: string; nfts: NftDetail[] }>,
        ) || {}

    const collections = Object.values(nftsByCollection)

    // Show empty state if no collections after processing
    if (collections.length === 0) {
        return <EmptyState />
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-xl font-semibold'>NFT Gallery</h2>
                    {totalCount > 0 && (
                        <p className='text-sm text-gray-500 dark:text-gray-400'>{totalCount} NFTs in your wallet</p>
                    )}
                </div>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className='gap-1'>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </Button>
            </div>

            <div className='space-y-8'>
                {collections.map(collection => (
                    <Collection
                        key={collection.address}
                        name={collection.name}
                        image={collection.image}
                        address={collection.address}
                        nfts={collection.nfts}
                    />
                ))}
            </div>
        </div>
    )
})
