import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { type ReactNode } from 'react'
import { cookieToInitialState } from 'wagmi'

import { getConfig } from '@/wagmi'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

import './style.css'

export const metadata: Metadata = {
    title: 'Web3 Counter App',
    description: 'A decentralized counter application built with Next.js and Wagmi',
}

export const viewport: Viewport = {
    themeColor: '#3b82f6',
    width: 'device-width',
    initialScale: 1,
}

export default async function RootLayout(props: { children: ReactNode }) {
    const initialState = cookieToInitialState(getConfig(), (await headers()).get('cookie'))
    return (
        <html lang='en'>
            <head>
                <script src='https://accounts.google.com/gsi/client' async defer />
            </head>
            <body className={inter.className}>
                <Providers initialState={initialState}>
                    <main className='container py-8'>{props.children}</main>
                </Providers>
            </body>
        </html>
    )
}
