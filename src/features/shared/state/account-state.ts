import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'
import { getAccount } from '@okto_web3/react-sdk'

// Definición de la interfaz de cuenta
export interface OktoAccount {
    address: string
    networkName: string
    networkId: string
}

// Interfaz para el estado de cuentas
interface AccountState {
    accounts: OktoAccount[]
    selectedAccount: OktoAccount | null
    isLoading: boolean
    error: string | null
    lastUpdated: number
}

// Crear el observable con estado inicial
export const accountState$ = observable<AccountState>({
    accounts: [],
    selectedAccount: null,
    isLoading: false,
    error: null,
    lastUpdated: 0,
})

// Configurar la persistencia local
syncObservable(accountState$, {
    persist: {
        name: 'okto-accounts',
        plugin: ObservablePersistLocalStorage,
    },
})

// Estado de sincronización para verificar si los datos están cargados
export const accountSyncState$ = syncState(accountState$)

// Función para sincronizar las cuentas
export async function syncAccounts(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = accountState$.lastUpdated.get()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // Si no es forzado y los datos son recientes, no actualizar
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncAccounts] Using cached data:', {
            cacheAge: now - lastUpdated,
            accountCount: accountState$.accounts.get().length,
        })
        return
    }

    // Marcar como cargando
    accountState$.isLoading.set(true)

    try {
        console.log('[syncAccounts] Fetching account data...')
        const accountsResponse = await getAccount(oktoClient)

        if (accountsResponse && accountsResponse.length > 0) {
            const formattedAccounts = accountsResponse.map(account => ({
                address: account.address,
                networkName: account.networkName,
                networkId: account.caipId,
            }))

            batch(() => {
                accountState$.accounts.set(formattedAccounts)
                // Si no hay cuenta seleccionada o la cuenta seleccionada ya no existe, seleccionar la primera
                if (
                    !accountState$.selectedAccount.get() ||
                    !formattedAccounts.some(acc => acc.address === accountState$.selectedAccount.get()?.address)
                ) {
                    accountState$.selectedAccount.set(formattedAccounts[0])
                }
                accountState$.lastUpdated.set(now)
                accountState$.error.set(null)
                accountState$.isLoading.set(false)
            })

            console.log('[syncAccounts] Updated account data:', {
                count: formattedAccounts.length,
            })
        } else {
            console.log('[syncAccounts] No accounts found')
            batch(() => {
                accountState$.accounts.set([])
                accountState$.selectedAccount.set(null)
                accountState$.lastUpdated.set(now)
                accountState$.error.set(null)
                accountState$.isLoading.set(false)
            })
        }
    } catch (err) {
        console.error('[syncAccounts] Failed to fetch accounts:', err)
        batch(() => {
            accountState$.error.set('Failed to load wallet accounts')
            accountState$.isLoading.set(false)
        })
    }
}

// Función para seleccionar una cuenta
export function selectAccount(address: string) {
    const accounts = accountState$.accounts.get()
    const account = accounts.find(acc => acc.address === address)
    if (account) {
        accountState$.selectedAccount.set(account)
        return true
    }
    return false
}

// Función para limpiar el estado
export function clearAccountState() {
    batch(() => {
        accountState$.accounts.set([])
        accountState$.selectedAccount.set(null)
        accountState$.isLoading.set(false)
        accountState$.error.set(null)
        accountState$.lastUpdated.set(0)
    })
}
