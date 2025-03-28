import { observable } from '@legendapp/state'
import type { OktoAuthResponse, OktoWallet } from './types'

// Global state for Okto
export const oktoState = observable({
    auth: {
        isAuthenticated: false,
        session: null as OktoAuthResponse | null,
        loading: false,
        error: null as string | null,
        wallets: [] as OktoWallet[],
        selectedWallet: null as OktoWallet | null,
        walletsLoading: false,
        walletsError: null as string | null,
    },
})

// Actions to modify the state
export const oktoActions = {
    setAuthenticated: (session: OktoAuthResponse) => {
        oktoState.auth.isAuthenticated.set(true)
        oktoState.auth.session.set(session)
        oktoState.auth.loading.set(false)
        oktoState.auth.error.set(null)
    },
    setLoading: (loading: boolean) => {
        oktoState.auth.loading.set(loading)
    },
    setError: (error: string) => {
        oktoState.auth.error.set(error)
        oktoState.auth.loading.set(false)
    },
    logout: () => {
        oktoState.auth.isAuthenticated.set(false)
        oktoState.auth.session.set(null)
        oktoState.auth.error.set(null)
        oktoState.auth.wallets.set([])
        oktoState.auth.selectedWallet.set(null)
        oktoState.auth.walletsLoading.set(false)
        oktoState.auth.walletsError.set(null)
    },
    setWallets: (wallets: OktoWallet[]) => {
        oktoState.auth.wallets.set(wallets)
    },
    setSelectedWallet: (wallet: OktoWallet) => {
        oktoState.auth.selectedWallet.set(wallet)
    },
    setWalletsLoading: (loading: boolean) => {
        oktoState.auth.walletsLoading.set(loading)
    },
    setWalletsError: (error: string) => {
        oktoState.auth.walletsError.set(error)
        oktoState.auth.walletsLoading.set(false)
    },
}
