'use client'

import { cn } from '@/lib/utils/tailwind'

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return <div className={cn('animate-pulse rounded-md bg-gray-700/30', className)} />
}

export function TokenSkeleton() {
    return (
        <div className='flex items-center justify-between border-b border-gray-800 p-3'>
            <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-3 w-16' />
                </div>
            </div>
            <div className='space-y-2 text-right'>
                <Skeleton className='ml-auto h-4 w-20' />
                <Skeleton className='ml-auto h-3 w-12' />
            </div>
        </div>
    )
}

export function NFTSkeleton() {
    return (
        <div className='relative overflow-hidden rounded-lg'>
            <Skeleton className='h-40 w-full' />
            <div className='space-y-2 p-3'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
            </div>
        </div>
    )
}

export function TransactionSkeleton() {
    return (
        <div className='flex items-center justify-between border-b border-gray-800 p-3'>
            <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-3 w-32' />
                </div>
            </div>
            <div className='space-y-2 text-right'>
                <Skeleton className='ml-auto h-4 w-16' />
                <Skeleton className='ml-auto h-3 w-24' />
            </div>
        </div>
    )
}
