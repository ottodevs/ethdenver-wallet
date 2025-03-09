'use client'

import { cn } from '@/lib/utils/tailwind'
import Image from 'next/image'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    showLogo?: boolean
    className?: string
    text?: string
}

export function LoadingSpinner({ size = 'md', showLogo = true, className, text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
    }

    const logoSizes = {
        sm: 16,
        md: 24,
        lg: 32,
    }

    return (
        <div className={cn('flex flex-col items-center justify-center', className)}>
            <div className={cn('relative', sizeClasses[size])}>
                {/* Outer spinning ring */}
                <div className='absolute inset-0 animate-spin rounded-full border-t-2 border-b-2 border-blue-500' />

                {/* Middle pulsing ring */}
                <div className='absolute inset-2 animate-pulse rounded-full border-r-2 border-l-2 border-blue-500/60' />

                {/* Inner spinning ring (opposite direction) */}
                <div className='animate-reverse absolute inset-4 animate-spin rounded-full border-t-2 border-b-2 border-blue-500/40' />

                {/* Center logo */}
                {showLogo && (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <Image
                            src='/logo.svg'
                            alt='Loading'
                            width={logoSizes[size]}
                            height={logoSizes[size]}
                            className='animate-bounce'
                        />
                    </div>
                )}
            </div>

            {text && <p className='mt-4 animate-pulse font-medium text-white'>{text}</p>}
        </div>
    )
}
