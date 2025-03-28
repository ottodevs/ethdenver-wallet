# Authentication Architecture with Legend State

## Overview

This document outlines our approach to managing authentication state using Legend State instead of React Context. The architecture leverages Legend State's fine-grained reactivity system to provide a performant, persistent, and synchronized authentication experience across the application.

## Goals

- Replace React Context with Legend State for authentication management
- Maintain seamless integration with NextAuth.js and Okto SDK
- Improve performance through fine-grained reactivity
- Ensure proper authentication lifecycle management
- Provide a clean API for components to interact with auth state

## Architecture Components

### 1. Authentication State Store

The core of our authentication system is a Legend State observable that maintains all authentication-related state:

```typescript
// src/features/auth/state/auth-state.ts
import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    authStatus: string
    isAuthenticating: boolean
    lastChecked: number
    session: {
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
        } | null
        id_token?: string
        expires?: string
    } | null
}

export const authState$ = observable<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authStatus: '',
    isAuthenticating: false,
    lastChecked: 0,
    session: null,
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
```

### 2. Authentication Service

A service layer that handles all authentication operations and interactions with NextAuth.js and Okto:

```typescript
// src/features/auth/services/auth-service.ts
import { batch } from '@legendapp/state'
import { authState$ } from '../state/auth-state'
import { signIn, signOut } from 'next-auth/react'
import type { OktoClient } from '@okto_web3/react-sdk'

// Constants
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MIN_CHECK_INTERVAL = 30 * 1000 // 30 seconds

// Authentication service functions
export const authService = {
    // Check authentication status with Okto
    async checkAuthStatus(oktoClient: OktoClient): Promise<boolean> {
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
    },

    // Authenticate with Okto using NextAuth ID token
    async authenticate(oktoClient: OktoClient, idToken?: string): Promise<unknown> {
        if (!oktoClient) {
            return { result: false, error: 'Okto client not available' }
        }

        if (!idToken) {
            return { result: false, error: 'No ID token provided' }
        }

        // Set authenticating state
        authState$.isAuthenticating.set(true)

        try {
            // Authenticate with Okto using the ID token
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
            console.log('Okto authentication successful:', user)

            // Update the authentication state
            batch(() => {
                authState$.isAuthenticated.set(true)
                authState$.isLoading.set(false)
                authState$.error.set(null)
                authState$.authStatus.set('authenticated')
                authState$.isAuthenticating.set(false)
                authState$.lastChecked.set(Date.now())
            })
            return { result: true, user: JSON.stringify(user) }
        } catch (error) {
            console.error('Okto authentication failed:', error)

            // Update the authentication state
            batch(() => {
                authState$.isAuthenticated.set(false)
                authState$.isLoading.set(false)
                authState$.error.set('Authentication failed')
                authState$.authStatus.set('error')
                authState$.isAuthenticating.set(false)
                authState$.lastChecked.set(Date.now())
            })
            return { result: false, error: String(error) }
        }
    },

    // Sign in with NextAuth
    async signIn(provider: string = 'google', options?: any): Promise<void> {
        authState$.isLoading.set(true)
        try {
            await signIn(provider, options)
        } catch (error) {
            console.error('NextAuth sign in failed:', error)
            authState$.error.set('Sign in failed')
        }
    },

    // Log out from both NextAuth and Okto
    async logout(oktoClient?: OktoClient): Promise<void> {
        authState$.isLoading.set(true)

        try {
            if (oktoClient) {
                // Clear Okto session
                oktoClient.sessionClear()
            }

            // Clear auth state
            this.clearAuthState()

            // Clear any stored session data
            if (typeof window !== 'undefined') {
                // Clear localStorage items
                localStorage.removeItem('okto_session_key')
                localStorage.removeItem('okto_delegation_enabled')
                localStorage.removeItem('okto-auth')
                localStorage.removeItem('okto-accounts')
                localStorage.removeItem('okto-portfolio')
                localStorage.removeItem('okto-nfts')
                localStorage.removeItem('okto-transactions')

                // Clear any other potential auth-related items
                sessionStorage.clear()

                // Force clear cookies related to auth
                document.cookie = 'next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname
                document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/; domain=' + window.location.hostname
                document.cookie =
                    '__Secure-next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname
            }

            // Get the base URL from environment or window location
            const baseUrl =
                typeof window !== 'undefined'
                    ? window.location.origin
                    : process.env.NEXTAUTH_URL || 'http://localhost:3000'

            // Sign out from Next-Auth with redirect to auth page
            await signOut({
                redirect: true,
                callbackUrl: `${baseUrl}/auth`,
            })
        } catch (error) {
            console.error('Error during logout:', error)

            // If signOut fails, force a redirect to auth page
            if (typeof window !== 'undefined') {
                window.location.href = '/auth'
            }
        }
    },

    // Clear authentication state
    clearAuthState(): void {
        batch(() => {
            authState$.isAuthenticated.set(false)
            authState$.isLoading.set(true)
            authState$.error.set(null)
            authState$.authStatus.set('')
            authState$.isAuthenticating.set(false)
            authState$.lastChecked.set(0)
            authState$.session.set(null)
        })
    },

    // Update session information
    updateSession(session: any): void {
        if (session) {
            authState$.session.set(session)

            // If we have a session but not authenticated with Okto yet,
            // we should trigger authentication
            if (!authState$.isAuthenticated.get() && session.id_token) {
                // This will be handled by the auth initializer
                console.log('Session updated with ID token, ready for Okto authentication')
            }
        } else {
            authState$.session.set(null)
        }
    },

    // Start periodic auth checks
    startAuthChecks(oktoClient: OktoClient): () => void {
        // Perform initial check
        this.checkAuthStatus(oktoClient)

        // Set up interval for periodic checks
        const interval = setInterval(() => {
            this.checkAuthStatus(oktoClient)
        }, AUTH_CHECK_INTERVAL)

        // Return cleanup function
        return () => clearInterval(interval)
    },
}
```

### 3. Authentication Initializer

A component that initializes authentication and handles session changes:

```typescript
// src/features/auth/components/auth-initializer.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useOkto } from '@okto_web3/react-sdk'
import { authService } from '../services/auth-service'
import { authState$ } from '../state/auth-state'
import { appState$ } from '@/features/shared/state/app-state'
import { syncAccounts } from '@/features/shared/state/account-state'
import { syncPortfolio } from '@/features/shared/state/portfolio-state'
import { syncTransactions } from '@/features/shared/state/transactions-state'
import { syncNFTs } from '@/features/shared/state/nfts-state'
import { useObservable } from '@legendapp/state/react'

export function AuthInitializer() {
    const { data: session, status: sessionStatus } = useSession()
    const oktoClient = useOkto()
    const isAuthenticated = useObservable(authState$.isAuthenticated)

    // Sync all data function
    const syncAllData = async (force = true) => {
        if (!oktoClient) return

        console.log('Syncing all data - setting global loading state')
        appState$.isLoading.set(true)

        try {
            console.log('Fetching account data...')
            await syncAccounts(oktoClient, force)
            console.log('Account data loaded successfully')

            console.log('Fetching portfolio and transaction data...')
            await syncPortfolio(oktoClient, force)
            console.log('Portfolio data loaded successfully')

            await syncTransactions(oktoClient, force)
            console.log('Transaction data loaded successfully')

            // NFTs can be loaded in the background as they're not critical
            syncNFTs(oktoClient, force).catch(error => {
                console.warn('NFT data loading error (non-critical):', error)
            })

            console.log('All critical data loaded')
            appState$.isLoading.set(false)
        } catch (error) {
            console.error('Error syncing data:', error)
            appState$.isLoading.set(false)
        }
    }

    // Update session in auth state when NextAuth session changes
    useEffect(() => {
        if (session) {
            authService.updateSession(session)
        }
    }, [session])

    // Handle authentication when session becomes available
    useEffect(() => {
        if (sessionStatus === 'authenticated' && session?.id_token && oktoClient && !isAuthenticated) {
            console.log('Session authenticated, authenticating with Okto')
            authService.authenticate(oktoClient, session.id_token).then(result => {
                if (result && typeof result === 'object' && 'result' in result && result.result === true) {
                    console.log('Authentication successful, syncing all data')
                    syncAllData(true)
                }
            })
        }
    }, [sessionStatus, session, oktoClient, isAuthenticated])

    // Set up periodic auth checks
    useEffect(() => {
        if (oktoClient) {
            return authService.startAuthChecks(oktoClient)
        }
    }, [oktoClient])

    // Sync data when authentication state changes
    useEffect(() => {
        if (isAuthenticated && oktoClient) {
            console.log('Authentication state changed to true, syncing all data')
            syncAllData(true)
        }
    }, [isAuthenticated, oktoClient])

    // This component doesn't render anything
    return null
}
```

### 4. Authentication Hooks

Custom hooks for components to interact with authentication state:

```typescript
// src/features/auth/hooks/use-auth.ts
import { useObservable } from '@legendapp/state/react'
import { authState$ } from '../state/auth-state'
import { authService } from '../services/auth-service'
import { useOkto } from '@okto_web3/react-sdk'

export function useAuth() {
    const oktoClient = useOkto()

    const auth = {
        // Observable state
        isAuthenticated: useObservable(authState$.isAuthenticated),
        isLoading: useObservable(authState$.isLoading),
        error: useObservable(authState$.error),
        authStatus: useObservable(authState$.authStatus),
        session: useObservable(authState$.session),

        // Methods
        checkAuthStatus: () => authService.checkAuthStatus(oktoClient),
        authenticate: (idToken?: string) => {
            const token = idToken || authState$.session.get()?.id_token
            return authService.authenticate(oktoClient, token)
        },
        logout: () => authService.logout(oktoClient),
        signIn: (provider?: string, options?: any) => authService.signIn(provider, options),
    }

    return auth
}
```

### 5. Authentication Middleware

Middleware to protect routes and redirect unauthenticated users:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/features/auth/config'

// Paths that don't require authentication
const publicPaths = ['/auth', '/api/auth']

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Check if the path is public
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // Get the session using the auth helper
    const session = await auth()

    // If there's no session, redirect to the auth page
    if (!session) {
        const url = new URL('/auth', request.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
```

## Implementation Plan

### Phase 1: Setup Legend State Store

1. Enhance the existing `auth-state.ts` to include session information
2. Configure persistence and synchronization

### Phase 2: Create Authentication Service

1. Implement the auth service with all required methods
2. Test integration with NextAuth.js and Okto

### Phase 3: Create Authentication Initializer

1. Implement the initializer component
2. Add it to the app layout to ensure it's always present

### Phase 4: Create Authentication Hooks

1. Implement the useAuth hook
2. Test with existing components

### Phase 5: Update Components

1. Replace all instances of the AuthContext with the new useAuth hook
2. Update components to use Legend State's reactive components where appropriate

### Phase 6: Implement Middleware

1. Set up the authentication middleware
2. Test route protection

## Usage Examples

### Basic Authentication Check

```tsx
import { useObservable } from '@legendapp/state/react'
import { authState$ } from '@/features/auth/state/auth-state'

function MyComponent() {
    const isAuthenticated = useObservable(authState$.isAuthenticated)

    return <div>{isAuthenticated ? 'You are logged in' : 'Please log in'}</div>
}
```

### Using the Auth Hook

```tsx
import { useAuth } from '@/features/auth/hooks/use-auth'

function LoginButton() {
    const auth = useAuth()

    return (
        <button onClick={() => auth.signIn('google')} disabled={auth.isLoading}>
            {auth.isLoading ? 'Loading...' : 'Sign in with Google'}
        </button>
    )
}
```

### Protected Component with Reactive Rendering

```tsx
import { Show } from '@legendapp/state/react'
import { authState$ } from '@/features/auth/state/auth-state'

function ProtectedContent() {
    return (
        <Show
            if={authState$.isAuthenticated}
            then={() => <div>Protected content</div>}
            else={() => <div>Please log in to view this content</div>}
        />
    )
}
```

## Authentication Flow

1. User visits the application
2. AuthInitializer checks for existing session
3. If no session exists, user is redirected to login page
4. User logs in with NextAuth (Google provider)
5. NextAuth creates a session with ID token
6. AuthInitializer detects the session and authenticates with Okto
7. On successful authentication, user data is synced
8. User can now access protected routes and features
9. Periodic checks ensure the authentication remains valid
10. When user logs out, both NextAuth and Okto sessions are cleared

## Benefits of This Approach

1. **Performance**: Legend State's fine-grained reactivity ensures components only re-render when their specific dependencies change
2. **Persistence**: Authentication state is automatically persisted and restored
3. **Simplicity**: No need for Context providers or complex prop drilling
4. **Separation of Concerns**: Clear separation between state, service, and UI layers
5. **Type Safety**: Full TypeScript support throughout the authentication system

## Considerations and Edge Cases

1. **Server-Side Rendering**: Legend State works client-side, so initial state on the server will be the default values
2. **Token Expiration**: Implement proper handling of expired tokens and refresh flows
3. **Multiple Tabs**: Consider how authentication state is synchronized across multiple tabs
4. **Offline Support**: Define behavior when users are offline
5. **Error Recovery**: Implement robust error handling and recovery mechanisms

## Conclusion

By replacing React Context with Legend State for authentication management, we gain significant performance improvements and a more maintainable codebase. The architecture provides a clean separation of concerns while ensuring a seamless authentication experience for users.
