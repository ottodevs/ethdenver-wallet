import { oktoActions, oktoState } from '@/okto/state'
import { AuthService } from '@/services/auth.service'
import type { OktoAuthResponse } from '@/types/okto'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook to handle authentication synchronization between NextAuth and Okto
 * This hook ensures that the authentication state is properly synchronized and data is loaded
 * immediately after login
 */
export function useAuth() {
    const { data: session, status } = useSession()
    const [isInitialized, setIsInitialized] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const isAuthenticatingRef = useRef(false)
    const lastSessionRef = useRef<string | null>(null)
    const dataRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Function to refresh data (wallets and portfolio)
    const refreshData = useCallback(async (forceRefresh = false) => {
        return AuthService.refreshData(forceRefresh)
    }, [])

    // Setup periodic data refresh
    const setupPeriodicRefresh = useCallback(() => {
        if (!AuthService.isAuthenticated()) return

        // Clear any existing timeout
        if (dataRefreshTimeoutRef.current) {
            clearTimeout(dataRefreshTimeoutRef.current)
            dataRefreshTimeoutRef.current = null
        }

        // Schedule next refresh
        dataRefreshTimeoutRef.current = setTimeout(() => {
            refreshData().then(() => {
                // Recursively setup the next refresh
                setupPeriodicRefresh()
            })
        }, 60000) // Refresh every minute
    }, [refreshData])

    // Create a minimal auth response object for setting authenticated state
    const createAuthResponse = (idToken: string): OktoAuthResponse => {
        return {
            userAddress: '', // Will be populated by the actual auth process
            nonce: '', // Will be populated by the actual auth process
            vendorAddress: '', // Will be populated by the actual auth process
            sessionExpiry: Date.now() + 6 * 60 * 60 * 1000, // 6 hours
            idToken,
        }
    }

    // Initialize authentication with ID token
    const initializeWithToken = useCallback(
        async (idToken: string) => {
            try {
                console.log('🔐 [use-auth] Initializing with ID token')

                // Authenticate with the token
                const success = await AuthService.authenticate(idToken)

                if (!success) {
                    setIsInitialized(true)
                    setIsError(true)
                    setErrorMessage('Authentication failed. Please try again.')
                    return null
                }

                // Explicitly set the authenticated state in oktoState BEFORE refreshing data
                // This is the key change to ensure oktoState.auth.isAuthenticated is set immediately
                if (!oktoState.auth.isAuthenticated.get()) {
                    console.log('🔐 [use-auth] Setting oktoState.auth.isAuthenticated to true')
                    oktoActions.setAuthenticated(createAuthResponse(idToken))

                    // Give a small delay for the auth state to propagate
                    await new Promise(resolve => setTimeout(resolve, 50))
                }

                // After successful authentication, refresh data immediately
                try {
                    const result = await refreshData(true) // Force refresh to ensure fresh data

                    // Set auth state immediately after data refresh
                    setIsInitialized(true)
                    setIsError(false)
                    setErrorMessage(null)

                    // Setup periodic refresh
                    setupPeriodicRefresh()

                    return result
                } catch (error) {
                    console.error('❌ [use-auth] Error refreshing data after authentication:', error)
                    // Continue even if refresh fails, still set auth state to true
                    setIsInitialized(true)
                    setIsError(false)
                    setErrorMessage(null)
                }
            } catch (error) {
                console.error('❌ [use-auth] Authentication error:', error)
                setIsInitialized(true)
                setIsError(true)
                setErrorMessage('Authentication failed. Please try again.')
                return null
            } finally {
                isAuthenticatingRef.current = false
                setIsInitializing(false)
            }
        },
        [refreshData, setupPeriodicRefresh],
    )

    // Main authentication effect
    useEffect(() => {
        // Log session status changes for debugging
        console.log(
            '🔐 [use-auth] Session status:',
            status,
            session ? `(has id_token: ${!!session.id_token})` : '(no session)',
        )

        // Skip if already initializing or if session is still loading
        if (isAuthenticatingRef.current || status === 'loading') {
            return
        }

        // Check if the session has changed to avoid unnecessary re-authentication
        const sessionId = session?.id_token ? session.id_token.slice(0, 20) : null
        if (sessionId && sessionId === lastSessionRef.current && isInitialized) {
            console.log('🔐 [use-auth] Session ID unchanged, skipping re-initialization')

            // Check if we need to refresh the authentication due to token expiration
            if (AuthService.isAuthenticated()) {
                // If we're authenticated but oktoState doesn't reflect it, fix that
                if (!oktoState.auth.isAuthenticated.get() && session?.id_token) {
                    console.log(
                        '🔐 [use-auth] Fixing auth state mismatch - setting oktoState.auth.isAuthenticated to true',
                    )
                    oktoActions.setAuthenticated(createAuthResponse(session.id_token))
                }
                return
            }
        }

        // Update the last session ID
        if (sessionId) {
            lastSessionRef.current = sessionId
        }

        // If no session or no ID token, we can't authenticate
        const idToken = session?.id_token

        // If we're not authenticated and there's no session, we're done
        if (!idToken && !AuthService.isAuthenticated()) {
            console.log('🔐 [use-auth] No ID token in session and not authenticated')
            setIsInitialized(true)
            return
        }

        // If we're authenticated but there's no session, log out
        if (!idToken && AuthService.isAuthenticated()) {
            console.log('🔐 [use-auth] No ID token in session but authenticated, logging out')
            AuthService.logout()
            setIsInitialized(true)
            return
        }

        // If we're authenticated and have a session, check if it's the same session
        if (AuthService.isAuthenticated() && idToken) {
            const authState = AuthService.getAuthState()
            if (authState.session?.idToken === idToken) {
                console.log('🔐 [use-auth] Already authenticated with the same ID token')
                setIsInitialized(true)
                return
            }
        }

        if (!idToken) {
            console.log('🔐 [use-auth] No ID token in session')
            setIsInitialized(true)
            isAuthenticatingRef.current = false
            setIsInitializing(false)
            return
        }

        // Mark that we are in the process of authentication
        isAuthenticatingRef.current = true
        setIsInitializing(true)
        setIsError(false)
        setErrorMessage(null)

        // Initialize with the token
        initializeWithToken(idToken)
    }, [session, status, isInitialized, initializeWithToken])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (dataRefreshTimeoutRef.current) {
                clearTimeout(dataRefreshTimeoutRef.current)
                dataRefreshTimeoutRef.current = null
            }
        }
    }, [])

    // Return the authentication state and functions
    return {
        isAuthenticated: oktoState.auth.isAuthenticated.get(),
        isInitialized,
        isInitializing,
        isError,
        errorMessage,
        refreshData,
        session,
        status,
    }
}
