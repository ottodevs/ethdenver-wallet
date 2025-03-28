'use client'

import { useQuery } from '@tanstack/react-query'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { authenticateWithIdToken, logoutUser } from './authenticate'
import { getCurrentWallets } from './explorer/wallet'
import { oktoState } from './state'
import type { OktoWallet } from './types'

// Hook to authenticate the user
export function useOktoAuth() {
    // Initialize observers
    // useEffect(() => {
    //     const unobserveAuth = initAuthObserver()
    //     const unobserveWallets = initWalletsObserver()

    //     return () => {
    //         unobserveAuth()
    //         unobserveWallets()
    //     }
    // }, [])

    // // Function to set default wallet
    // const setDefaultWallet = () => {
    //     const wallets = getCurrentWallets()
    //     if (!wallets) return

    //     // Set default selected wallet (Ethereum if available)
    //     const ethWallet = wallets.find(
    //         w => w.network_name.toLowerCase() === 'ethereum' || w.network_symbol.toLowerCase() === 'eth',
    //     )

    //     if (ethWallet) {
    //         oktoActions.setSelectedWallet(ethWallet)
    //     } else if (wallets.length > 0) {
    //         oktoActions.setSelectedWallet(wallets[0])
    //     }
    // }

    // New function to initialize Okto without handling Auth.js session
    const initializeOkto = async (idToken: string) => {
        console.log('🔐 [okto-hooks] Initializing Okto with idToken:', idToken)
        await authenticateWithIdToken(idToken)
        // setDefaultWallet()
    }

    // New function to initialize Okto with NextAuth session
    const initializeOktoWithSession = async (session: Session) => {
        if (session?.id_token) {
            await authenticateWithIdToken(session.id_token)
            // setDefaultWallet()
        } else {
            throw new Error('No ID token found in session')
        }
    }

    return {
        initializeOkto,
        initializeOktoWithSession,
        logout: logoutUser,
        // isLoading: authState$.mutation.isPending,
        // isError: authState$.mutation.isError,
        // error: authState$.mutation.error,
        // fetchWallets: () => walletsState$.query.refetch(),
    }
}

// Hook to initialize Okto session
export function useInitOktoSession() {
    const { data: session } = useSession()
    // const [initialized, setInitialized] = useState(false)
    // Initialize observers
    // useEffect(() => {
    // console.log('🔐 [okto-hooks] Setting up auth observers')
    // const unobserveAuth = initAuthObserver()
    // const unobserveWallets = initWalletsObserver()
    // return () => {
    //     unobserveAuth()
    //     unobserveWallets()
    // }
    // }, [])
    // This effect runs once on client-side to check localStorage
    // useEffect(() => {
    //     if (typeof window !== 'undefined' && !initialized) {
    //         console.log('🔐 [okto-hooks] Checking for stored auth data')
    //         // Try to get auth from localStorage directly
    //         try {
    //             const storedAuth = localStorage.getItem('okto_auth_state')
    //             if (storedAuth) {
    //                 const parsedAuth = JSON.parse(storedAuth)
    //                 console.log('🔐 [okto-hooks] Found stored auth data:', parsedAuth ? 'Valid data' : 'Invalid data')
    //                 if (parsedAuth && !authState$.get()) {
    //                     // Manually set the auth state if it's not already set
    //                     authState$.set(parsedAuth)
    //                     console.log('🔐 [okto-hooks] Restored auth state from localStorage')
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('Error reading auth from localStorage:', error)
    //         }
    //         setInitialized(true)
    //     }
    // }, [initialized])
    return useQuery({
        queryKey: ['okto', 'session-init'],
        queryFn: async () => {
            console.log('🔐 [okto-hooks] Initializing Okto session')

            // Get current auth state
            // const auth = authState$.get()
            //         console.log('🔐 [okto-hooks] Current auth state:', auth ? 'Found' : 'Not found')
            //         if (auth) {
            //             // Check if session is expired
            //             if (auth.sessionExpiry && auth.sessionExpiry < Date.now()) {
            //                 console.log('🔐 [okto-hooks] Session expired, logging out')
            //                 logoutUser()
            //                 return null
            //             }
            //             // Re-authenticate if we have an idToken
            if (session?.id_token) {
                try {
                    console.log('🔐 [okto-hooks] Refreshing authentication with stored idToken')
                    // Refresh the authentication
                    const oktoAuthData = await authenticateWithIdToken(session.id_token)
                    console.log('🔐 [okto-hooks] Okto auth data:', oktoAuthData)
                } catch (error) {
                    console.error('🔐 [okto-hooks] Error refreshing authentication:', error)
                    // Continue with existing auth data
                }
            }
            //         }
            return null
        },
        // Only execute on the client
        // enabled: typeof window !== 'undefined' && initialized,
    })
}

/**
 * Hook to get the current wallet address
 * @returns The current wallet address or null if not available
 */
export function useWalletAddress() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const getWalletAddress = async () => {
            if (!isMounted) return

            try {
                console.log('👛 [useWalletAddress] Fetching wallet address...')
                setIsLoading(true)

                // First try to get the selected wallet from oktoState
                const selectedWallet = oktoState.auth.selectedWallet.get()

                if (selectedWallet?.address) {
                    console.log('👛 [useWalletAddress] Using selected wallet:', selectedWallet.address)
                    setWalletAddress(selectedWallet.address)
                    setIsLoading(false)
                    return
                }

                // If no selected wallet, try to get the first wallet from the wallets list
                const wallets = oktoState.auth.wallets.get()

                if (wallets && wallets.length > 0) {
                    console.log('👛 [useWalletAddress] Using first wallet from list:', wallets[0].address)
                    setWalletAddress(wallets[0].address)
                    setIsLoading(false)
                    return
                }

                // If still no wallet, try to get wallets from the wallet explorer
                const currentWallets = getCurrentWallets()

                if (currentWallets && currentWallets.length > 0) {
                    console.log('👛 [useWalletAddress] Using wallet from explorer:', currentWallets[0].address)
                    setWalletAddress(currentWallets[0].address)
                    setIsLoading(false)
                    return
                }

                // If still no wallet, try to fetch wallets
                console.log('👛 [useWalletAddress] No wallets found, refreshing wallets...')
                const { refreshWallets } = await import('./explorer/wallet')
                const walletResults = (await refreshWallets()) as OktoWallet[]

                // Check if we got wallets from the refresh
                if (
                    walletResults &&
                    Array.isArray(walletResults) &&
                    walletResults.length > 0 &&
                    'address' in walletResults[0]
                ) {
                    console.log('👛 [useWalletAddress] Got wallet from refresh:', walletResults[0].address)
                    setWalletAddress(walletResults[0].address)
                    setIsLoading(false)
                    return
                }

                // Final check after fetching
                setTimeout(() => {
                    if (!isMounted) return

                    const updatedWallets = oktoState.auth.wallets.get()
                    if (updatedWallets && updatedWallets.length > 0) {
                        console.log('👛 [useWalletAddress] Got wallet after timeout:', updatedWallets[0].address)
                        setWalletAddress(updatedWallets[0].address)
                    } else {
                        console.log('👛 [useWalletAddress] No wallet found after all attempts')
                        setWalletAddress(null)
                    }
                    setIsLoading(false)
                }, 1000)
            } catch (error) {
                console.error('👛 [useWalletAddress] Error fetching wallet address:', error)
                if (isMounted) {
                    setWalletAddress(null)
                    setIsLoading(false)
                }
            }
        }

        // Initial fetch
        getWalletAddress()

        // Set up subscription to wallet changes
        const unsubscribe = oktoState.auth.wallets.onChange(() => {
            console.log('👛 [useWalletAddress] Wallets state changed, updating...')
            getWalletAddress()
        })

        // Set up subscription to authentication changes
        const authUnsubscribe = oktoState.auth.isAuthenticated.onChange(isAuth => {
            console.log('👛 [useWalletAddress] Auth state changed:', isAuth)
            if (isAuth) {
                getWalletAddress()
            } else {
                setWalletAddress(null)
                setIsLoading(false)
            }
        })

        return () => {
            isMounted = false
            unsubscribe()
            authUnsubscribe()
        }
    }, [])

    return { walletAddress, isLoading }
}
