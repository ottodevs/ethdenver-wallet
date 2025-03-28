import { authenticateWithIdToken, isAuthenticated, logoutUser } from '@/okto/authenticate'
import { refreshPortfolio } from '@/okto/explorer/portfolio'
import { refreshWallets } from '@/okto/explorer/wallet'
import { oktoActions, oktoState } from '@/okto/state'
import type { OktoAuthResponse, OktoWallet } from '@/okto/types'
import type { OktoPortfolioData } from '@/types/okto'

/**
 * Authentication Service
 * Handles all authentication-related operations and data fetching
 */
export class AuthService {
    /**
     * Check if the user is authenticated
     */
    static isAuthenticated(): boolean {
        return isAuthenticated()
    }

    /**
     * Authenticate a user with an ID token
     * @param idToken The ID token to authenticate with
     */
    static async authenticate(idToken: string): Promise<boolean> {
        try {
            console.log('🔐 [auth-service] Authenticating with ID token')

            // Check if we already have a valid authentication
            if (isAuthenticated()) {
                console.log('🔐 [auth-service] Already authenticated, checking token validity')

                // Get the current auth state
                const authState = AuthService.getAuthState()

                // If we have a session with a different token, re-authenticate
                if (authState.session?.idToken !== idToken) {
                    console.log('🔐 [auth-service] Token changed, re-authenticating')
                } else {
                    console.log('🔐 [auth-service] Using existing valid authentication')

                    // Ensure oktoState.auth.isAuthenticated is set to true
                    if (!oktoState.auth.isAuthenticated.get()) {
                        console.log(
                            '🔐 [auth-service] Fixing auth state mismatch - setting oktoState.auth.isAuthenticated to true',
                        )
                        // Create a minimal auth response
                        const authResponse: OktoAuthResponse = {
                            userAddress: authState.session?.userAddress || '',
                            nonce: authState.session?.nonce || '',
                            vendorAddress: authState.session?.vendorAddress || '',
                            sessionExpiry: authState.session?.sessionExpiry || Date.now() + 6 * 60 * 60 * 1000,
                            idToken,
                        }
                        oktoActions.setAuthenticated(authResponse)
                    }

                    return true
                }
            }

            const authResponse = await authenticateWithIdToken(idToken)
            console.log('🔐 [auth-service] Authentication successful')

            // Ensure oktoState.auth.isAuthenticated is set to true
            if (!oktoState.auth.isAuthenticated.get() && authResponse) {
                console.log('🔐 [auth-service] Setting oktoState.auth.isAuthenticated to true after authentication')
                oktoActions.setAuthenticated(authResponse)
            }

            return true
        } catch (error) {
            console.error('❌ [auth-service] Authentication error:', error)

            // Check if the error is due to an expired token
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (
                errorMessage.includes('Token expired') ||
                errorMessage.includes('invalid or expired') ||
                errorMessage.includes('OAW-TECH-0014')
            ) {
                console.log('🔐 [auth-service] Token expired, clearing auth state')
                // Clear the auth state
                logoutUser()
            }

            return false
        }
    }

    /**
     * Log out the current user
     */
    static logout(): void {
        logoutUser()
    }

    /**
     * Refresh all user data (wallets and portfolio)
     * @param forceRefresh Whether to force a refresh of the data
     */
    static async refreshData(forceRefresh = false): Promise<{
        wallets: OktoWallet[] | null
        portfolio: OktoPortfolioData | null
    } | null> {
        if (!isAuthenticated()) {
            console.log('🔐 [auth-service] Not authenticated, skipping data refresh')
            return null
        }

        try {
            console.log('🔐 [auth-service] Refreshing data', forceRefresh ? '(forced)' : '')

            // First refresh wallets
            const wallets = await refreshWallets()
            console.log(
                '🔐 [auth-service] Wallets refreshed:',
                wallets ? 'success' : 'failed',
                Array.isArray(wallets) ? `(${wallets.length} wallets)` : '',
            )

            // Then refresh portfolio with the updated wallets
            const portfolio = await refreshPortfolio(forceRefresh)
            console.log('🔐 [auth-service] Portfolio refreshed:', portfolio ? 'success' : 'failed')

            return { wallets, portfolio }
        } catch (error) {
            console.error('❌ [auth-service] Error refreshing data:', error)
            return null
        }
    }

    /**
     * Get the current authentication state
     */
    static getAuthState() {
        return {
            isAuthenticated: oktoState.auth.isAuthenticated.get(),
            session: oktoState.auth.session.get(),
            loading: oktoState.auth.loading.get(),
            error: oktoState.auth.error.get(),
            wallets: oktoState.auth.wallets.get(),
            selectedWallet: oktoState.auth.selectedWallet.get(),
        }
    }
}
