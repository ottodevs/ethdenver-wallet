import '@/app/globals.css'

import AppProvider from '@/components/providers'
import { outfit } from '@/lib/utils/fonts'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

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
    // const session = await auth()

    // if (!session) {
    //     redirect('/auth')
    // }

    return (
        <html lang='en' suppressHydrationWarning>
            <body className={`${outfit.className} antialiased`}>
                <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                    <AppProvider>{children}</AppProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
