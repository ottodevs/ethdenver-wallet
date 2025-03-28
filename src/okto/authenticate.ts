// import { observable, observe } from '@legendapp/state'
// import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
// import { syncObservable } from '@legendapp/state/sync'
// import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query'
// import { QueryClient } from '@tanstack/react-query'
import { observable } from '@legendapp/state'
import { authenticate, generateSessionData, logout } from './client'
import { oktoActions } from './state'
import type { OktoAuthResponse } from './types'
// Importar QueryClient para evitar el uso de require()
import { QueryClient } from '@tanstack/react-query'

// // Create a query client instance or reuse the existing one
// const queryClient = new QueryClient()

// // Interface for authentication parameters
// interface AuthenticateParams {
//     idToken: string
// }

/**
 * Authenticates a user with Okto using their ID token
 */
// export async function authenticateUser({ idToken }: AuthenticateParams): Promise<OktoAuthResponse> {
//     try {
//         console.log('🔐 [okto-auth] authenticating user')
//         oktoActions.setLoading(true)

//         const params = await generateSessionData(idToken)
//         const authResponse = await authenticate(params)

//         // Add the idToken to the response for future reference
//         const result: OktoAuthResponse = {
//             ...authResponse,
//             idToken,
//         }

//         console.log('✅ [okto-auth] authentication successful')

//         return result
//     } catch (error) {
//         console.error('❌ [okto-auth] authentication error:', error)
//         oktoActions.setError(error instanceof Error ? error.message : 'Unknown error')
//         throw error
//     } finally {
//         oktoActions.setLoading(false)
//     }
// }

/**
 * Logs out the current user
 */
export function logoutUser(): void {
    console.log('🔐 [okto-auth] logging out user')

    // First, invalidate all queries to avoid automatic refetches
    try {
        // Create a new instance of QueryClient
        const queryClient = new QueryClient()

        // Invalidate and cancel all pending queries
        queryClient.cancelQueries()
        queryClient.clear()

        console.log('🔐 [okto-auth] Cancelled all pending queries')
    } catch (error) {
        console.error('❌ [okto-auth] Error cancelling queries:', error)
    }

    // Call the logout function of the client
    logout()

    // Update the authentication state
    oktoActions.logout()

    // Clear localStorage
    if (typeof window !== 'undefined') {
        try {
            // Clear all data related to Okto
            localStorage.removeItem('okto_auth_state')
            localStorage.removeItem('okto_session_key')
            localStorage.removeItem('okto-portfolio-data')
            localStorage.removeItem('okto-activity-data')
            localStorage.removeItem('okto-wallets-data')
            console.log('🔐 [okto-auth] Cleared auth data from localStorage')
        } catch (error) {
            console.error('❌ [okto-auth] Error clearing localStorage:', error)
        }
    }

    // Reset the auth state directly
    authState$.delete()

    console.log('🔐 [okto-auth] Logout completed successfully')
}

/**
 * Observable state for authentication using Legend App State with Tanstack Query and persistence
 */
// export const authState$ = observable<OktoAuthResponse | null>(
//     syncedQuery({
//         queryClient,
//         query: {
//             queryKey: ['okto-auth'],
//             queryFn: async () => {
//                 // Mock for now
//                 return null
//             },
//         },
//         mutation: {
//             mutationKey: ['okto-auth', tokenId],
//             mutationFn: () => {
//                 console.log('🔐 [okto-auth] mutationFn')
//                 return Promise.resolve('hola')
//             },
//             //     mutationFn: authenticateUser,
//             //     onSuccess: data => {
//             //         console.log('✅ [okto-auth] authentication mutation successful')
//             //         // Update auth state
//             //         if (data) {
//             //             oktoActions.setAuthenticated(data)
//             //         }
//             //     },
//             //     onError: error => {
//             //         console.error('❌ [okto-auth] authentication mutation error:', error)
//             //         oktoActions.setError(error instanceof Error ? error.message : 'Unknown error')
//             //     },
//         },
//         // persist: {
//         //     name: 'okto_auth_state',
//         // },
//     }),
// )

const authState$ = observable<OktoAuthResponse>()

// Set up persistence for the auth state
// syncObservable(authState$, {
//     persist: {
//         name: 'okto_auth_state',
//         plugin: ObservablePersistLocalStorage,
//     },
// })

/**
 * Initialize authentication state observation
 * This will start syncing and be reactive to updates
 */
// export function initAuthObserver() {
//     console.log('🔐 [okto-auth] Initializing auth observer')
//     return observe(() => {
//         const auth = authState$.get()
//         console.log(
//             '🔐 [okto-auth] Observed auth state:',
//             auth ? 'Authenticated' : 'Not authenticated',
//             // auth ? `(userAddress: ${auth.userAddress?.substring(0, 8)}...)` : '',
//         )

//         // Update the oktoState when auth changes
//         if (auth) {
//             console.log('🔐 [okto-auth] Observed auth state:', auth)
//             // oktoActions.setAuthenticated(auth)
//         }

//         return auth
//     })
// }

/**
 * Get current authentication state without observation
 */
// export function getCurrentAuth(): OktoAuthResponse | null {
//     return authState$.get()
// }

/**
 * Authenticate a user with their ID token
 */
export async function authenticateWithIdToken(idToken: string) {
    console.log('🔐 [okto-auth] entering authenticateWithIdToken')
    try {
        // Check if we already have a valid auth state in localStorage
        if (typeof window !== 'undefined') {
            const storedAuth = localStorage.getItem('okto_auth_state')
            if (storedAuth) {
                try {
                    const parsedAuth = JSON.parse(storedAuth) as OktoAuthResponse
                    // Check if the stored auth is still valid (not expired)
                    if (parsedAuth.sessionExpiry && parsedAuth.sessionExpiry > Date.now()) {
                        console.log('🔐 [okto-auth] Found valid stored auth, using it')
                        // Update the auth state with the stored auth
                        authState$.set(parsedAuth)
                        oktoActions.setAuthenticated(parsedAuth)
                        return parsedAuth
                    } else {
                        console.log('🔐 [okto-auth] Stored auth is expired, authenticating again')
                    }
                } catch (error) {
                    console.error('🔐 [okto-auth] Error parsing stored auth:', error)
                }
            }
        }

        // Call the actual authentication function
        const params = await generateSessionData(idToken)
        const authResponse = await authenticate(params)

        // Add the idToken to the response for future reference and ensure session expiry is set
        const result: OktoAuthResponse = {
            ...authResponse,
            idToken,
        }

        // Ensure sessionExpiry is set to a future time (6 hours from now)
        if (!result.sessionExpiry || typeof result.sessionExpiry === 'undefined') {
            const SIX_HOURS_MS = 6 * 60 * 60 * 1000
            result.sessionExpiry = Date.now() + SIX_HOURS_MS
            console.log(
                '🔐 [okto-auth] Setting session expiry to 6 hours from now:',
                new Date(result.sessionExpiry).toISOString(),
            )
        } else {
            // Convert to milliseconds if it's in seconds (Unix timestamp)
            if (typeof result.sessionExpiry === 'number' && result.sessionExpiry < 9999999999) {
                // If the timestamp is in seconds (Unix timestamp), convert to milliseconds
                result.sessionExpiry = result.sessionExpiry * 1000
                console.log(
                    '🔐 [okto-auth] Converting session expiry from seconds to milliseconds:',
                    result.sessionExpiry,
                )
            }
            console.log(
                '🔐 [okto-auth] Using provided session expiry:',
                result.sessionExpiry,
                'which is',
                new Date(result.sessionExpiry).toISOString(),
            )
        }

        console.log('✅ [okto-auth] authentication successful, updating state')

        // Update the auth state
        authState$.set(result)
        oktoActions.setAuthenticated(result)

        // Explicitly save to localStorage as a fallback
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('okto_auth_state', JSON.stringify(result))
                console.log('✅ [okto-auth] explicitly saved auth state to localStorage')
            } catch (error) {
                console.error('❌ [okto-auth] error saving to localStorage:', error)
            }
        }

        return result
    } catch (error) {
        console.error('❌ [okto-auth] authentication error:', error)

        // Check if the error is due to an expired token
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('invalid or expired') || errorMessage.includes('OAW-TECH-0014')) {
            console.log('🔐 [okto-auth] Token expired, clearing auth state')
            // Clear the auth state
            authState$.delete()
            if (typeof window !== 'undefined') {
                localStorage.removeItem('okto_auth_state')
            }

            // Set a specific error for token expiration
            oktoActions.setError('Your session has expired. Please sign in again.')
            throw new Error('Token expired. Please sign in again.')
        }

        oktoActions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
    }
}

// Add this interface for the auth data structure
interface OktoAuthData {
    expire_at: number | string
    session_pub_key: string
}

// Add this extended interface for auth response with data field
interface OktoAuthResponseWithData extends OktoAuthResponse {
    data?: OktoAuthData
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated() {
    const auth = authState$.get()

    // Check if we have a valid auth state
    if (!auth) {
        return false
    }

    // Check if the session is expired
    if (auth.sessionExpiry) {
        // Convert to number if it's a string
        const expiryTime =
            typeof auth.sessionExpiry === 'string' ? parseInt(auth.sessionExpiry, 10) : auth.sessionExpiry

        // Convert to milliseconds if it's in seconds (Unix timestamp)
        const expiryTimeMs = expiryTime < 9999999999 ? expiryTime * 1000 : expiryTime
        const currentTime = Date.now()

        // Only expire if it's a valid timestamp and it's in the past
        if (!isNaN(expiryTimeMs) && expiryTimeMs > 0 && expiryTimeMs < currentTime) {
            logoutUser()
            return false
        }
    } else {
        // Check if we have an expire_at field in the data object
        const authWithData = auth as OktoAuthResponseWithData
        if (authWithData.data?.expire_at) {
            const expireAt = authWithData.data.expire_at
            const expiryTimeMs = typeof expireAt === 'number' ? expireAt * 1000 : parseInt(expireAt, 10) * 1000

            if (!isNaN(expiryTimeMs) && expiryTimeMs > 0 && expiryTimeMs < Date.now()) {
                logoutUser()
                return false
            }
        }
    }

    // For now, return true if we have an auth object, regardless of the user/vendor address
    return !!auth
}
