import { cn } from '@/lib/utils/tailwind'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot='skeleton' className={cn('animate-pulse rounded-md bg-gray-700/30', className)} {...props} />
}

function TokenSkeleton() {
    return (
        <div className='flex items-center justify-between border-b border-gray-800 p-3'>
            <div className='flex items-center'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='ml-3'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='mt-1 h-3 w-16' />
                </div>
            </div>
            <div className='text-right'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='mt-1 h-3 w-12' />
            </div>
        </div>
    )
}

function NFTSkeleton() {
    return (
        <div className='relative overflow-hidden rounded-lg'>
            <Skeleton className='aspect-square w-full' />
            <div className='p-3'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='mt-2 h-3 w-1/2' />
            </div>
        </div>
    )
}

function TransactionSkeleton() {
    return (
        <div className='flex items-center justify-between border-b border-gray-800 p-3'>
            <div className='flex items-center'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='ml-3'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='mt-1 h-3 w-32' />
                </div>
            </div>
            <div className='text-right'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='mt-1 h-3 w-20' />
            </div>
        </div>
    )
}

export { NFTSkeleton, Skeleton, TokenSkeleton, TransactionSkeleton }
