'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className='bg-background flex min-h-screen flex-col items-center justify-center'>
            <div className='mx-auto flex max-w-md flex-col items-center justify-center space-y-4 text-center'>
                <h2 className='text-2xl font-bold'>Something went wrong!</h2>
                <p className='text-muted-foreground'>{error.message || 'An unexpected error occurred'}</p>
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }>
                    Try again
                </Button>
                <Link href='/'>Go to Home</Link>
            </div>
        </div>
    )
}
