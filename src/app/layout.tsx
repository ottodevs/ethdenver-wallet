import '@/app/globals.css'
import '@/styles/dropdown.css'
import '@/styles/theme.css'

import { outfit } from '@/lib/utils/fonts'
import { AppProvider } from '@/providers/app.provider'
import type { Metadata, Viewport } from 'next'

/**
 * Metadata for the application
 * This is used by Next.js for SEO and PWA features
 */
export const metadata: Metadata = {
    title: 'Aeris Wallet',
    description: 'The best wallet for your crypto',
    applicationName: 'Aeris Wallet',
    authors: [{ name: 'Dream Team' }],
    keywords: ['wallet', 'crypto', 'blockchain', 'ethereum', 'okto'],
}

/**
 * Viewport configuration for the application
 * This ensures proper mobile rendering
 */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

/**
 * Root layout component that wraps the entire application
 * This provides the app provider and global styles
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body className={`${outfit.className} antialiased`}>
                <AppProvider>{children}</AppProvider>
            </body>
        </html>
    )
}
