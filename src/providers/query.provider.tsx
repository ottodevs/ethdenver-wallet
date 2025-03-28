'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* {env.NODE_ENV === 'development' && (
                <ReactQueryDevtools buttonPosition='bottom-right' initialIsOpen={false} />
            )} */}
        </QueryClientProvider>
    )
}
