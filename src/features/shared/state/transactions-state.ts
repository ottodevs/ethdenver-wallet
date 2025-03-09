import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'
import { getPortfolioActivity } from '@okto_web3/react-sdk'

// Definición de la interfaz de transacción
export interface Transaction {
    id: string
    type: 'deposit' | 'withdrawal' | 'transfer' | 'swap' | 'other'
    status: 'pending' | 'confirmed' | 'failed' | 'unknown'
    timestamp: number
    amount: string
    token: string
    tokenSymbol: string
    from?: string
    to?: string
    hash?: string
    networkName?: string
    explorerUrl?: string
}

// Interfaz para el estado de transacciones
interface TransactionsState {
    transactions: Transaction[]
    pendingTransactions: Transaction[]
    isLoading: boolean
    error: string | null
    lastUpdated: number
    hasInitialized: boolean
}

// Crear el observable con estado inicial
export const transactionsState$ = observable<TransactionsState>({
    transactions: [],
    pendingTransactions: [],
    isLoading: false,
    error: null,
    lastUpdated: 0,
    hasInitialized: false,
})

// Configurar la persistencia local
syncObservable(transactionsState$, {
    persist: {
        name: 'okto-transactions',
        plugin: ObservablePersistLocalStorage,
    },
})

// Estado de sincronización para verificar si los datos están cargados
export const transactionsSyncState$ = syncState(transactionsState$)

// Función para sincronizar las transacciones
export async function syncTransactions(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = transactionsState$.lastUpdated.get()
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos (más corto para transacciones)

    // Si no es forzado y los datos son recientes, no actualizar
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncTransactions] Using cached data:', {
            cacheAge: now - lastUpdated,
            txCount: transactionsState$.transactions.get().length,
        })
        return
    }

    // Marcar como cargando
    transactionsState$.isLoading.set(true)

    try {
        console.log('[syncTransactions] Fetching transaction history...')
        const txHistory = await getPortfolioActivity(oktoClient)

        if (txHistory && txHistory.length > 0) {
            // Generar un ID único para cada transacción
            const formattedTransactions = txHistory.map((tx, index) => {
                // Crear un ID verdaderamente único usando una combinación de campos
                // Si hay txHash, usarlo junto con timestamp e índice
                // Si no hay txHash, usar una combinación de otros campos disponibles
                const uniqueId = tx.txHash
                    ? `${tx.txHash}-${tx.timestamp || Date.now()}-${index}`
                    : `tx-${tx.id || ''}-${tx.timestamp || Date.now()}-${index}`

                return {
                    id: uniqueId,
                    type: mapTransactionType(tx.transferType),
                    status: mapTransactionStatus(tx.status),
                    timestamp: tx.timestamp ? tx.timestamp * 1000 : Date.now(), // Convertir a milisegundos
                    amount: tx.quantity || '0',
                    token: tx.caipId || '',
                    tokenSymbol: tx.symbol || '',
                    // No tenemos from/to en la API, pero podemos inferir basado en transferType
                    from: tx.transferType?.toLowerCase() === 'send' ? 'Your wallet' : undefined,
                    to: tx.transferType?.toLowerCase() === 'receive' ? 'Your wallet' : undefined,
                    hash: tx.txHash || '',
                    networkName: tx.networkName || '',
                    explorerUrl: tx.networkExplorerUrl ? `${tx.networkExplorerUrl}tx/${tx.txHash}` : undefined,
                }
            })

            // Verificar que no haya IDs duplicados antes de actualizar el estado
            const idSet = new Set()
            const uniqueTransactions = formattedTransactions.filter(tx => {
                if (idSet.has(tx.id)) {
                    console.warn(`[syncTransactions] Duplicate transaction ID found: ${tx.id}. Creating new unique ID.`)
                    // Si encontramos un duplicado, generamos un nuevo ID único
                    tx.id = `${tx.id}-${Math.random().toString(36).substring(2, 9)}`
                }
                idSet.add(tx.id)
                return true
            })

            batch(() => {
                transactionsState$.transactions.set(uniqueTransactions)
                transactionsState$.lastUpdated.set(now)
                transactionsState$.error.set(null)
                transactionsState$.isLoading.set(false)
                transactionsState$.hasInitialized.set(true)
            })

            console.log('[syncTransactions] Updated transaction history:', {
                count: uniqueTransactions.length,
            })
        } else {
            console.log('[syncTransactions] No transactions found')
            batch(() => {
                transactionsState$.transactions.set([])
                transactionsState$.lastUpdated.set(now)
                transactionsState$.error.set(null)
                transactionsState$.isLoading.set(false)
                transactionsState$.hasInitialized.set(true)
            })
        }
    } catch (err) {
        console.error('[syncTransactions] Failed to fetch transactions:', err)
        batch(() => {
            transactionsState$.error.set('Failed to load transaction history')
            transactionsState$.isLoading.set(false)
            transactionsState$.hasInitialized.set(true)
        })
    }
}

// Función para añadir una transacción pendiente
export function addPendingTransaction(transaction: Transaction) {
    const pendingTx = {
        ...transaction,
        id: `pending-${transaction.id || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending' as const,
        timestamp: Date.now(),
    }

    transactionsState$.pendingTransactions.push(pendingTx)
    console.log('[addPendingTransaction] Added pending transaction:', pendingTx)
}

// Función para actualizar una transacción pendiente
export async function updatePendingTransaction(id: string, oktoClient: OktoClient) {
    const pendingTxs = transactionsState$.pendingTransactions.get()
    const txIndex = pendingTxs.findIndex(tx => tx.id === id)

    if (txIndex === -1) {
        console.warn('[updatePendingTransaction] Transaction not found:', id)
        return
    }

    const tx = pendingTxs[txIndex]

    // Aquí iría la lógica para verificar el estado de la transacción
    // Por ejemplo, consultando el hash en la blockchain

    // Por ahora, simplemente simulamos que la transacción se confirma después de un tiempo
    const updatedTx = {
        ...tx,
        status: 'confirmed' as const,
    }

    // Actualizar la transacción pendiente
    transactionsState$.pendingTransactions[txIndex].set(updatedTx)

    // Si está confirmada, moverla a transacciones confirmadas y eliminarla de pendientes
    if (updatedTx.status === 'confirmed') {
        transactionsState$.transactions.unshift(updatedTx)
        transactionsState$.pendingTransactions.splice(txIndex, 1)
    }

    console.log('[updatePendingTransaction] Updated transaction:', updatedTx)

    // Refrescar las transacciones para obtener la versión más actualizada
    await syncTransactions(oktoClient, true)
}

// Función para limpiar el estado
export function clearTransactionsState() {
    batch(() => {
        transactionsState$.transactions.set([])
        transactionsState$.pendingTransactions.set([])
        transactionsState$.isLoading.set(false)
        transactionsState$.error.set(null)
        transactionsState$.lastUpdated.set(0)
        transactionsState$.hasInitialized.set(false)
    })
}

// Funciones auxiliares para mapear tipos y estados
function mapTransactionType(type?: string): 'deposit' | 'withdrawal' | 'transfer' | 'swap' | 'other' {
    if (!type) return 'other'

    type = type.toLowerCase()

    if (type.includes('deposit')) return 'deposit'
    if (type.includes('receive')) return 'deposit'
    if (type.includes('withdrawal')) return 'withdrawal'
    if (type.includes('send')) return 'withdrawal'
    if (type.includes('transfer')) return 'transfer'
    if (type.includes('swap')) return 'swap'

    return 'other'
}

function mapTransactionStatus(status?: boolean | string): 'pending' | 'confirmed' | 'failed' | 'unknown' {
    if (status === undefined || status === null) return 'unknown'

    // Si es booleano, true = confirmado, false = fallido
    if (typeof status === 'boolean') {
        return status ? 'confirmed' : 'failed'
    }

    // Si es string
    const statusStr = status.toString().toLowerCase()

    if (statusStr.includes('pending') || statusStr.includes('processing')) return 'pending'
    if (statusStr.includes('success') || statusStr.includes('confirmed') || statusStr === 'true') return 'confirmed'
    if (
        statusStr.includes('fail') ||
        statusStr.includes('error') ||
        statusStr.includes('reject') ||
        statusStr === 'false'
    )
        return 'failed'

    return 'unknown'
}
