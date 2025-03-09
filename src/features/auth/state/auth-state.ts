import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'

// Interface for the authentication state
interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    authStatus: string
    isAuthenticating: boolean
    lastChecked: number
}

// Create the observable with initial state
export const authState$ = observable<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authStatus: '',
    isAuthenticating: false,
    lastChecked: 0,
})

// Configure local persistence
syncObservable(authState$, {
    persist: {
        name: 'okto-auth',
        plugin: ObservablePersistLocalStorage,
    },
})

// Synchronization state to check if data is loaded
export const authSyncState$ = syncState(authState$)

// Constants for the intervals
const MIN_CHECK_INTERVAL = 30 * 1000 // 30 seconds

// Function to check the authentication status
export async function checkAuthStatus(oktoClient: OktoClient): Promise<boolean> {
    if (!oktoClient) return false

    try {
        const now = Date.now()
        const lastChecked = authState$.lastChecked.get()

        // Only check if enough time has passed since the last check
        if (now - lastChecked < MIN_CHECK_INTERVAL) {
            return authState$.isAuthenticated.get()
        }

        authState$.lastChecked.set(now)
        const authStatus = oktoClient.isLoggedIn()

        if (authStatus !== authState$.isAuthenticated.get()) {
            authState$.isAuthenticated.set(authStatus)

            if (authStatus) {
                authState$.authStatus.set('Authenticated with Okto')
            }
        }

        return authStatus
    } catch (err) {
        console.error('Auth check failed:', err)
        batch(() => {
            authState$.error.set('Failed to verify authentication')
            authState$.isAuthenticated.set(false)
        })
        return false
    } finally {
        authState$.isLoading.set(false)
    }
}

// Function to authenticate with Okto
export async function handleAuthenticate(oktoClient: OktoClient, idToken: string | null): Promise<unknown> {
    if (!idToken || !oktoClient) {
        console.error('Okto client not available')
        authState$.error.set('Okto client not available')
        return { result: false, error: 'Okto client not available' }
    }

    // Prevent multiple authentication attempts
    if (authState$.isAuthenticating.get()) {
        return { result: false, error: 'Authentication already in progress' }
    }

    try {
        authState$.isAuthenticating.set(true)
        authState$.authStatus.set('Authenticating with Okto...')

        // Check if already authenticated
        const isLoggedIn = oktoClient.isLoggedIn()
        if (isLoggedIn) {
            console.log('Already authenticated with Okto')
            batch(() => {
                authState$.authStatus.set('Already authenticated')
                authState$.isAuthenticated.set(true)
                authState$.lastChecked.set(Date.now())
            })
            return { result: true }
        }

        // Authenticate with OAuth
        const user = await oktoClient.loginUsingOAuth(
            {
                idToken: idToken,
                provider: 'google',
            },
            sessionKey => {
                // Store the session key securely
                localStorage.setItem('okto_session_key', sessionKey.sessionPrivKey)
            },
        )

        batch(() => {
            authState$.authStatus.set('Authentication successful')
            authState$.isAuthenticated.set(true)
            authState$.error.set(null)
            authState$.lastChecked.set(Date.now())
        })
        return { result: true, user: JSON.stringify(user) }
    } catch (error) {
        console.error('Authentication attempt failed:', error)

        // Check if we are already authenticated despite the error
        try {
            const isLoggedIn = oktoClient.isLoggedIn()
            if (isLoggedIn) {
                batch(() => {
                    authState$.authStatus.set('Authentication successful')
                    authState$.isAuthenticated.set(true)
                })
                return { result: true }
            }
        } catch (e) {
            console.error('Failed to check login status:', e)
        }

        batch(() => {
            authState$.authStatus.set('Authentication failed')
            authState$.error.set(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        })
        return { result: false, error: 'Authentication failed' }
    } finally {
        authState$.isAuthenticating.set(false)
    }
}

// Function to clear the state
export function clearAuthState() {
    batch(() => {
        authState$.isAuthenticated.set(false)
        authState$.isLoading.set(true)
        authState$.error.set(null)
        authState$.authStatus.set('')
        authState$.isAuthenticating.set(false)
        authState$.lastChecked.set(0)
    })
}
