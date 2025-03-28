/**
 * GoogleAuthService - A class to handle Google authentication functionality
 *
 * This service manages Google authentication through multiple methods:
 * - FedCM (Federated Credential Management) API
 * - Google Identity Services (One Tap)
 * - Traditional OAuth flow
 */
import { env } from '@/lib/env/client'
import { jwtDecode } from 'jwt-decode'
import { signIn } from 'next-auth/react'
import { v4 as uuidv4 } from 'uuid'

export interface GoogleAuthState {
    isFedCMAvailable: boolean
    isOneTapAvailable: boolean
    isGoogleScriptLoaded: boolean
    error: string | null
    isAuthenticating: boolean
}

export class GoogleAuthService {
    private state: GoogleAuthState
    private googleInitialized: boolean
    private fedCMCredential: Credential | null
    private stateChangeCallback: ((state: GoogleAuthState) => void) | null

    constructor() {
        this.state = {
            isFedCMAvailable: false,
            isOneTapAvailable: false,
            isGoogleScriptLoaded: false,
            error: null,
            isAuthenticating: false,
        }
        this.googleInitialized = false
        this.fedCMCredential = null
        this.stateChangeCallback = null

        // Bind the Google script loaded handler to the window
        this.setupGoogleScriptLoadedListener()
    }

    /**
     * Register a callback to be notified when the state changes
     */
    public onStateChange(callback: (state: GoogleAuthState) => void): void {
        this.stateChangeCallback = callback
    }

    /**
     * Update the internal state and notify listeners
     */
    private setState(newState: Partial<GoogleAuthState>): void {
        this.state = { ...this.state, ...newState }
        if (this.stateChangeCallback) {
            this.stateChangeCallback(this.state)
        }
    }

    /**
     * Check if FedCM is supported in the current browser
     */
    public checkFedCMSupport(): boolean {
        try {
            return (
                typeof window !== 'undefined' &&
                'IdentityCredential' in window &&
                'navigator' in window &&
                'credentials' in navigator &&
                Boolean(navigator.credentials?.get)
            )
        } catch {
            return false
        }
    }

    /**
     * Check if Google One Tap is supported in the current browser
     */
    public checkOneTapSupport(): boolean {
        return typeof window !== 'undefined' && !!window.google?.accounts?.id
    }

    /**
     * Initialize Google Identity Services
     * @param userJustLoggedOut - Whether the user just logged out
     */
    public initializeGoogleIdentity(): void {
        console.log('⌛ [GoogleAuthService] Initializing Google Identity Services')
        if (!window.google?.accounts?.id || this.googleInitialized) return

        // Check if FedCM is available before initializing Google Identity Services
        const isFedCMSupported = this.checkFedCMSupport()

        // If FedCM is available, don't initialize Google Identity Services at all
        if (isFedCMSupported) {
            console.log(
                '🆕 [GoogleAuthService] FedCM is available, skipping Google Identity Services initialization to avoid conflicts',
            )

            // Only update state if there's an actual change to avoid unnecessary re-renders
            if (!this.state.isFedCMAvailable || this.state.isOneTapAvailable) {
                this.setState({
                    isFedCMAvailable: true,
                    isOneTapAvailable: false, // Force this to false to avoid confusion
                })
            }
            return
        }

        const handleCredentialResponse = (response: { credential: string }) => {
            console.log('🔑 [GoogleAuthService] handleCredentialResponse called')

            // Use NextAuth to sign in with the token
            signIn('credentials', {
                credential: response.credential,
                callbackUrl: '/',
                redirect: true,
            })
        }

        // Only initialize Google Identity Services if FedCM is not available
        window.google.accounts.id.initialize({
            use_fedcm_for_prompt: true,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleCredentialResponse,
            auto_select: !window.location.search.includes('logged_out=true'),
            cancel_on_tap_outside: false,
            ux_mode: 'popup',
            context: 'use',
            itp_support: true,
        })

        this.googleInitialized = true

        try {
            // Call prompt with a notification handler to detect when One Tap is not displayed
            console.log('🔐 [GoogleAuthService] Showing One Tap prompt')
            window.google?.accounts?.id?.prompt()
        } catch (err) {
            console.error('Error showing One Tap prompt:', err)
        }
    }

    /**
     * Set up Google script loading event listener
     */
    private setupGoogleScriptLoadedListener(): void {
        console.log('👂 [GoogleAuthService] listening for Google script loaded event')

        const handleGoogleScriptLoaded = () => {
            console.log('🧑‍🔧 [GoogleAuthService] handling Google script loaded event')
            const fedCMSupported = this.checkFedCMSupport()
            const oneTapSupported = this.checkOneTapSupport()

            console.log(
                `ℹ️ [GoogleAuthService] Browser capabilities - FedCM: ${fedCMSupported ? 'Yes' : 'No'} and One Tap: ${oneTapSupported ? 'Yes' : 'No'}`,
            )

            this.setState({
                isGoogleScriptLoaded: true,
                isFedCMAvailable: fedCMSupported,
                isOneTapAvailable: oneTapSupported,
            })

            // If FedCM is supported, try to get credentials immediately
            if (fedCMSupported) {
                this.promptFedCMCredentials()
            }
        }

        window.addEventListener('googleScriptLoaded', handleGoogleScriptLoaded)

        // Check immediately in case the script is already loaded
        if (window.google?.accounts?.id) {
            console.log('🌟 [GoogleAuthService] received Google script loaded event, handling it')
            handleGoogleScriptLoaded()
        }
    }

    /**
     * Prompt for FedCM credentials without signing in
     */
    private async promptFedCMCredentials(): Promise<void> {
        console.log('🔐 [GoogleAuthService] Prompting for FedCM credentials')

        if (!this.checkFedCMSupport()) {
            console.log('🔐 [GoogleAuthService] FedCM not supported, skipping prompt')
            return
        }

        try {
            const credential = await navigator.credentials.get({
                mediation: 'silent',
                signal: AbortSignal.timeout(5000),
            })

            console.log('🔐 [GoogleAuthService] FedCM credential obtained via one-tap', credential)
            this.fedCMCredential = credential
        } catch (error) {
            console.log('🔐 [GoogleAuthService] User dismissed FedCM prompt or error occurred:', error)
        }
    }

    /**
     * Try FedCM authentication directly - completely separate from One Tap
     */
    public async authenticateWithFedCM(): Promise<void> {
        console.log('🔐 [GoogleAuthService] Starting FedCM authentication attempt')
        this.setState({ isAuthenticating: true })

        // If we already have a credential, use it
        if (this.fedCMCredential?.id) {
            console.log('Using existing FedCM credential')
            await signIn('credentials', {
                credential: this.fedCMCredential.id,
                callbackUrl: '/',
                redirect: true,
            }).catch(err => {
                console.error('Error signing in with FedCM:', err)
                this.setState({ isAuthenticating: false, error: 'Authentication failed' })
                return false
            })
            return
        }

        // Otherwise, try to get a new credential or fall back to OAuth
        try {
            const credential = await navigator.credentials.get({
                identity: {
                    context: 'signin',
                    providers: [
                        {
                            configURL: 'https://accounts.google.com/gsi/fedcm.json',
                            clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                            mode: 'mediated',
                            params: { nonce: uuidv4() },
                        },
                    ],
                },
            } as CredentialRequestOptions)

            console.log('[GoogleAuthService] FedCM credential obtained via fedcm', credential)

            if (credential?.id) {
                // Use NextAuth to sign in with the token
                await signIn('credentials', {
                    credential: credential.id,
                    callbackUrl: '/',
                    redirect: true,
                }).catch(err => {
                    console.error('Error signing in with FedCM:', err)
                    this.setState({ isAuthenticating: false, error: 'Authentication failed' })
                    return false
                })
            } else {
                // Fallback to OAuth if no credential
                this.signInWithGoogle()
            }
        } catch (error) {
            console.log('FedCM authentication failed, falling back to OAuth:', error)
            this.signInWithGoogle()
        }
    }

    /**
     * Sign in with Google OAuth directly
     */
    public signInWithGoogle(): void {
        this.setState({ isAuthenticating: true })
        signIn('google', {
            callbackUrl: '/',
            // Explicitly specify only the minimum required scope
            authorizationParams: {
                scope: 'email',
                prompt: 'select_account',
            },
        })
    }

    /**
     * Get the current state
     */
    public getState(): GoogleAuthState {
        return { ...this.state }
    }

    /**
     * Check if Google is initialized
     */
    public isGoogleInitialized(): boolean {
        return this.googleInitialized
    }

    /**
     * Clean up event listeners
     */
    public cleanup(): void {
        window.removeEventListener('googleScriptLoaded', this.setupGoogleScriptLoadedListener)
    }

    /**
     * Authorize Google One Tap credentials
     */
    static authorizeGoogleOneTap = async (credentials: Record<string, unknown> | undefined) => {
        console.log('🔐 [GoogleAuthService] Authorizing Google One Tap credentials')

        try {
            if (!credentials?.credential) {
                throw new Error('🚨 [GoogleAuthService] No credential provided')
            }

            // Decode the JWT to get user information
            const decoded = jwtDecode<{
                email: string
                name: string
                picture: string
                sub: string
            }>(credentials.credential as string)

            // Return the user object
            return {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                image: decoded.picture,
                id_token: credentials.credential,
            }
        } catch (error) {
            console.error('🚨 [GoogleAuthService] Error authorizing credentials:', error)
            return null
        }
    }
}
