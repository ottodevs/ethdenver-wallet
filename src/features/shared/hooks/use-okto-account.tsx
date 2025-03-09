'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import {
    accountState$,
    selectAccount as selectAccountAction,
    syncAccounts,
} from '@/features/shared/state/account-state'
import { useOkto } from '@okto_web3/react-sdk'
import { useEffect } from 'react'

export type { OktoAccount } from '@/features/shared/state/account-state'

export const useOktoAccount = () => {
    const oktoClient = useOkto()
    const { isAuthenticated } = useAuth()

    // Sincronizar cuando cambian las dependencias
    useEffect(() => {
        if (oktoClient && isAuthenticated) {
            console.log('[useOktoAccount] Dependencies changed, syncing accounts')
            syncAccounts(oktoClient)
        }
    }, [oktoClient, isAuthenticated])

    return {
        accounts: accountState$.accounts.get(),
        selectedAccount: accountState$.selectedAccount.get(),
        selectAccount: (address: string) => selectAccountAction(address),
        isLoading: accountState$.isLoading.get(),
        error: accountState$.error.get(),
        isInitialized: accountState$.lastUpdated.get() > 0,
        isAuthenticated,
        refetch: (forceRefresh = true) => syncAccounts(oktoClient, forceRefresh),
    }
}
