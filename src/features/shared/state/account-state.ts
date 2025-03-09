import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'
import { getAccount } from '@okto_web3/react-sdk'

// Definition of the account interface
export interface OktoAccount {
    address: string
    networkName: string
    networkId: string
}

// Interface for the accounts state
interface AccountState {
    accounts: OktoAccount[]
    selectedAccount: OktoAccount | null
    isLoading: boolean
    error: string | null
    lastUpdated: number
}

// Create the observable with initial state
export const accountState$ = observable<AccountState>({
    accounts: [],
    selectedAccount: null,
    isLoading: false,
    error: null,
    lastUpdated: 0,
})

// Configure local persistence
syncObservable(accountState$, {
    persist: {
        name: 'okto-accounts',
        plugin: ObservablePersistLocalStorage,
    },
})

// Synchronization state to check if data is loaded
export const accountSyncState$ = syncState(accountState$)

// Function to sync accounts
export async function syncAccounts(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = accountState$.lastUpdated.get()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // If not forced and data is recent, do not update
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncAccounts] Using cached data:', {
            cacheAge: now - lastUpdated,
            accountCount: accountState$.accounts.get().length,
        })
        return
    }

    // Mark as loading
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
                // If there is no selected account or the selected account no longer exists, select the first one
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

// Function to select an account
export function selectAccount(address: string) {
    const accounts = accountState$.accounts.get()
    const account = accounts.find(acc => acc.address === address)
    if (account) {
        accountState$.selectedAccount.set(account)
        return true
    }
    return false
}

// Function to clear the state
export function clearAccountState() {
    batch(() => {
        accountState$.accounts.set([])
        accountState$.selectedAccount.set(null)
        accountState$.isLoading.set(false)
        accountState$.error.set(null)
        accountState$.lastUpdated.set(0)
    })
}
