import type { GoogleAuthState } from '@/lib/auth/GoogleAuthService'
import { GoogleAuthService } from '@/lib/auth/GoogleAuthService'
import { useEffect, useRef, useState } from 'react'

/**
 * React hook for Google authentication
 *
 * This hook provides a React interface to the GoogleAuthService, managing
 * authentication through FedCM, Google Identity Services, or OAuth.
 */
export const useGoogleAuth = () => {
    const [state, setState] = useState<GoogleAuthState>({
        isFedCMAvailable: false,
        isOneTapAvailable: false,
        isGoogleScriptLoaded: false,
        error: null,
        isAuthenticating: false,
    })

    const serviceRef = useRef<GoogleAuthService | null>(null)

    useEffect(() => {
        console.log('🪝 [useGoogleAuth] initialized')
        if (!serviceRef.current) {
            serviceRef.current = new GoogleAuthService()

            // Set up state change listener
            serviceRef.current.onStateChange(newState => {
                setState(newState)
            })

            // Initialize with current state
            setState(serviceRef.current.getState())

            // Initialize Google Identity Services
            if (!serviceRef.current.isGoogleInitialized()) {
                serviceRef.current.initializeGoogleIdentity()
            }
        }

        // Clean up on unmount
        return () => {
            if (serviceRef.current) {
                console.log('🪝 [useGoogleAuth] cleaning up')
                serviceRef.current.cleanup()
            }
        }
    }, [])

    return {
        ...state,
        initializeGoogleIdentity: () => serviceRef.current?.initializeGoogleIdentity(),
        authenticateWithFedCM: () => serviceRef.current?.authenticateWithFedCM(),
        signInWithGoogle: () => serviceRef.current?.signInWithGoogle(),
        googleInitialized: serviceRef.current?.isGoogleInitialized() || false,
    }
}
