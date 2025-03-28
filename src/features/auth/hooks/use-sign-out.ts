'use client'

import { signOut as signOutUser } from 'next-auth/react'

/**
 * Hook for handling sign-out functionality
 * This avoids the NextAuth headers error by using client-side navigation
 */
export function useSignOut() {
    // const router = useRouter()

    const handleSignOut =
        // useCallback(
        async () => {
            // try {
            // Clear all app state
            // batch(() => {
            //     // Reset auth state
            //     appState$.auth.session.set(null as unknown as Record<string, unknown>)
            //     appState$.auth.userKeys.set(null as unknown as Record<string, unknown>)
            //     appState$.auth.lastSync.set(null)

            //     // Reset wallet state
            //     appState$.wallet.assets.set({})
            //     appState$.wallet.transactions.set({})
            //     appState$.wallet.pendingTransactions.set({})

            //     // Reset sync state
            //     appState$.sync.pendingUpdates.set([])
            //     appState$.sync.syncErrors.set([])
            //     appState$.sync.lastSyncAttempt.set(null)
            // })

            // // Clear Okto session first
            // try {
            //     logoutFromOkto()
            //     console.log('Okto logout successful')
            // } catch (error) {
            //     console.error('[use-sign-out] Error during Okto logout:', error)
            //     // Continue with the rest of the logout process even if Okto fails
            // }

            // // Clear local storage
            // try {
            //     localStorage.removeItem('okto_session')
            //     localStorage.removeItem('okto_auth_token')
            //     localStorage.removeItem('okto_refresh_token')
            //     localStorage.removeItem('okto_user')
            // } catch (e) {
            //     console.error('[use-sign-out] Error clearing localStorage:', e)
            // }

            // // Clear session storage
            // try {
            //     sessionStorage.removeItem('okto_session')
            //     sessionStorage.removeItem('okto_auth_token')
            //     sessionStorage.removeItem('okto_refresh_token')
            //     sessionStorage.removeItem('okto_user')
            // } catch (e) {
            //     console.error('[use-sign-out] Error clearing sessionStorage:', e)
            // }

            // // Clear cookies
            // if (typeof window !== 'undefined') {
            //     document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/; domain=' + window.location.hostname
            //     document.cookie =
            //         '__Secure-next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname
            // }

            // // Dispatch a global event that other components can listen to
            // window.dispatchEvent(new CustomEvent('app:signout'))

            // // Revoke Google credentials if FedCM is available
            // if (window.google?.accounts?.id) {
            //     // Get user email from localStorage or state
            //     const sessionData = localStorage.getItem('okto_session')
            //     let userEmail = ''

            //     if (sessionData) {
            //         try {
            //             const parsedData = JSON.parse(sessionData)
            //             userEmail = parsedData.email || ''
            //         } catch (e) {
            //             console.error('Error parsing session data:', e)
            //         }
            //     }

            //     if (userEmail) {
            //         window.google.accounts.id.revoke(userEmail, (response: object) => {
            //             console.log('Google credentials revoked:', response)
            //         })
            //     }
            // }

            // Logout from NextAuth with explicit callbackUrl
            // try {
            await signOutUser({ redirectTo: '/login?logged_out=true' })
            // } catch (error) {
            //     console.error('[use-sign-out] Error during NextAuth logout:', error)
            // }
            // } catch (error) {
            // console.error('[use-sign-out] Error during sign out:', error)
            // Force redirect on error, still with logout parameter
            // router.push('/login')
        }
    // }, [router])

    return handleSignOut
}
