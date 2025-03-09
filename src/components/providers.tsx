'use client'
import { AuthProvider } from '@/features/auth/contexts/auth-context'
import { WalletProvider } from '@/features/wallet/hooks/use-wallet'
import type { Hash, Hex } from '@okto_web3/react-sdk'
import { OktoProvider } from '@okto_web3/react-sdk'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import React from 'react'
import { ToastContextProvider } from './ui/toast-context'

function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
                <OktoProvider
                    config={{
                        environment: 'sandbox',
                        clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY as Hash,
                        clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA as Hex,
                    }}>
                    <AuthProvider>
                        <WalletProvider>
                            <ToastContextProvider>{children}</ToastContextProvider>
                        </WalletProvider>
                    </AuthProvider>
                </OktoProvider>
            </ThemeProvider>
        </SessionProvider>
    )
}

export { AppProvider }
