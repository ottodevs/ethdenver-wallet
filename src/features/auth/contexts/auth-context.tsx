// contexts/auth-context.tsx
'use client'

import { authState$, checkAuthStatus, handleAuthenticate } from '@/features/auth/state/auth-state'
import { useOkto } from '@okto_web3/react-sdk'
import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'

// Constant for the verification interval (5 minutes in ms)
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    authStatus: string
    handleAuthenticate: () => Promise<unknown>
    checkAuthStatus: () => Promise<boolean>
    handleLogout: () => void
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authStatus: '',
    handleAuthenticate: async () => ({ result: false }),
    checkAuthStatus: async () => false,
    handleLogout: () => {},
})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession()
    const oktoClient = useOkto()

    // Extract ID token from session
    const idToken = useMemo(() => {
        return session ? session.id_token : null
    }, [session])

    // Memoize checkAuthStatus to prevent recreation on each render
    const checkAuthStatusCallback = useCallback(async (): Promise<boolean> => {
        if (!oktoClient) return false
        return checkAuthStatus(oktoClient)
    }, [oktoClient])

    // Handle authentication with Okto
    const handleAuthenticateCallback = useCallback(async (): Promise<unknown> => {
        if (!oktoClient) return { result: false, error: 'Okto client not available' }
        return handleAuthenticate(oktoClient, idToken ?? null)
    }, [idToken, oktoClient])

    // Handle logout with Okto
    const handleLogout = useCallback(() => {
        if (oktoClient) {
            oktoClient.sessionClear()
            // Update the authentication state
            authState$.isAuthenticated.set(false)
            authState$.authStatus.set('')
            console.log('User logged out')

            // Clear any stored session data
            localStorage.removeItem('okto_session_key')
            localStorage.removeItem('okto_delegation_enabled')
        }
    }, [oktoClient])

    // Initial auth check when client and session are available
    useEffect(() => {
        if (oktoClient) {
            checkAuthStatus(oktoClient)

            // Periodic check with longer interval
            const interval = setInterval(() => {
                checkAuthStatus(oktoClient)
            }, AUTH_CHECK_INTERVAL)

            return () => clearInterval(interval)
        }
    }, [oktoClient])

    // Attempt authentication when session and client are available
    useEffect(() => {
        if (idToken && oktoClient && !authState$.isAuthenticated.get() && !authState$.isAuthenticating.get()) {
            handleAuthenticate(oktoClient, idToken)
        }
    }, [idToken, oktoClient])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            isAuthenticated: authState$.isAuthenticated.get(),
            isLoading: authState$.isLoading.get(),
            error: authState$.error.get(),
            authStatus: authState$.authStatus.get(),
            handleAuthenticate: handleAuthenticateCallback,
            checkAuthStatus: checkAuthStatusCallback,
            handleLogout,
        }),
        [handleAuthenticateCallback, checkAuthStatusCallback, handleLogout],
    )

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
