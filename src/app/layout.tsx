import '@/app/globals.css'

import { AppProvider } from '@/components/providers'
import { outfit } from '@/lib/utils/fonts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Aeris Wallet',
    description:
        'Effortless login, seamless wallet management, and reliable transactions across the most popular blockchains—combining simplicity with interoperability.',
}

export default async function RootLayout({
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
