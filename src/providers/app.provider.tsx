'use client'

import { Toaster } from '@/components/ui/toaster'
import OktoProvider from '@/contexts/okto.context'
import { env } from '@/lib/env/server'
import { appState$ } from '@/lib/stores/app.store'
import { observer } from '@legendapp/state/react'
import { SessionProvider } from 'next-auth/react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { QueryProvider } from './query.provider'

// Dynamically import DevTools only in development
const DevTools =
    env.NODE_ENV === 'development'
        ? dynamic(() => import('@/components/DevTools').then(mod => mod.DevTools), {
              ssr: false,
          })
        : () => null

// Theme provider component to handle theme changes
const ThemeProvider = observer(function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = appState$.ui.theme.get()

    // Apply theme to document element to ensure it affects all components
    useEffect(() => {
        if (typeof document !== 'undefined') {
            // Remove previous theme
            document.documentElement.classList.remove('light', 'dark')
            // Add current theme
            document.documentElement.classList.add(theme)
        }
    }, [theme])

    return <div className={`${theme} h-full`}>{children}</div>
})

// Main App Provider component
const AppProvider = observer(function AppProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <QueryProvider>
                <OktoProvider>
                    <ThemeProvider>
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </OktoProvider>
            </QueryProvider>
            <DevTools />
        </SessionProvider>
    )
})

export { AppProvider }
