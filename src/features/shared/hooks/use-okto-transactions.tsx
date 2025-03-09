'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import type { Transaction } from '@/features/shared/state/transactions-state'
import {
    addPendingTransaction as addPendingTx,
    syncTransactions,
    transactionsState$,
    updatePendingTransaction as updatePendingTx,
} from '@/features/shared/state/transactions-state'
import { useOkto } from '@okto_web3/react-sdk'
import { useCallback, useEffect } from 'react'

export type { Transaction } from '@/features/shared/state/transactions-state'

export const useOktoTransactions = () => {
    const oktoClient = useOkto()
    const { selectedAccount } = useOktoAccount()
    const { isAuthenticated } = useAuth()

    // Obtener valores del estado observable
    const transactions = transactionsState$.transactions.get()
    const pendingTransactions = transactionsState$.pendingTransactions.get()
    const isLoading = transactionsState$.isLoading.get()
    const error = transactionsState$.error.get()
    const hasInitialized = transactionsState$.hasInitialized.get()

    // Sincronizar cuando cambian las dependencias
    useEffect(() => {
        if (oktoClient && selectedAccount && isAuthenticated) {
            console.log('[useOktoTransactions] Dependencies changed, syncing transactions')
            syncTransactions(oktoClient)
        }
    }, [oktoClient, selectedAccount, isAuthenticated])

    // Función para añadir una transacción pendiente
    const addPendingTransaction = useCallback((transaction: Transaction) => {
        addPendingTx(transaction)
    }, [])

    // Función para actualizar una transacción pendiente
    const updatePendingTransaction = useCallback(
        (id: string) => {
            if (oktoClient) {
                updatePendingTx(id, oktoClient)
            }
        },
        [oktoClient],
    )

    // Combinar transacciones pendientes y confirmadas para la UI
    const allTransactions = [...pendingTransactions, ...transactions]

    return {
        transactions: allTransactions,
        pendingTransactions,
        addPendingTransaction,
        updatePendingTransaction,
        isLoading,
        error,
        hasInitialized,
        refetch: (forceRefresh = true) => syncTransactions(oktoClient, forceRefresh),
    }
}
