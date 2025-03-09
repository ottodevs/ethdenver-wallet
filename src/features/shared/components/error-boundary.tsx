'use client'

import { useEffect, useState } from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const [hasError, setHasError] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Use useEffect to ensure this only runs on the client
    useEffect(() => {
        // Error handling logic here
        const errorHandler = (error: ErrorEvent) => {
            console.error('Caught error:', error)
            setHasError(true)
            setError(error.error)
        }

        window.addEventListener('error', errorHandler)
        return () => window.removeEventListener('error', errorHandler)
    }, [])

    if (hasError) {
        return (
            <div className='rounded-md border border-red-200 bg-red-50 p-4 text-red-700'>
                <h2 className='mb-2 text-lg font-semibold'>Something went wrong</h2>
                <p className='mb-4'>We encountered an error while loading your wallet.</p>
                <button
                    onClick={() => {
                        setHasError(false)
                        setError(null)
                        window.location.reload()
                    }}
                    className='rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700'>
                    Try again
                </button>
                {error && (
                    <div className='mt-4 overflow-auto rounded bg-red-100 p-2 text-sm'>
                        <pre>{error.toString()}</pre>
                    </div>
                )}
            </div>
        )
    }

    return <>{children}</>
}
