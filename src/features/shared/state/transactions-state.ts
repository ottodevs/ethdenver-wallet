import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'
import { getPortfolioActivity } from '@okto_web3/react-sdk'

// Definition of the transaction interface
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

// Interface for the transactions state
interface TransactionsState {
    transactions: Transaction[]
    pendingTransactions: Transaction[]
    isLoading: boolean
    error: string | null
    lastUpdated: number
    hasInitialized: boolean
}

// Create the observable with initial state
export const transactionsState$ = observable<TransactionsState>({
    transactions: [],
    pendingTransactions: [],
    isLoading: false,
    error: null,
    lastUpdated: 0,
    hasInitialized: false,
})

// Configure local persistence
syncObservable(transactionsState$, {
    persist: {
        name: 'okto-transactions',
        plugin: ObservablePersistLocalStorage,
    },
})

// Synchronization state to check if data is loaded
export const transactionsSyncState$ = syncState(transactionsState$)

// Function to synchronize transactions
export async function syncTransactions(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = transactionsState$.lastUpdated.get()
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes (shorter for transactions)

    // If not forced and data is recent, do not update
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncTransactions] Using cached data:', {
            cacheAge: now - lastUpdated,
            txCount: transactionsState$.transactions.get().length,
        })
        return
    }

    // Mark as loading
    transactionsState$.isLoading.set(true)

    try {
        console.log('[syncTransactions] Fetching transaction history...')
        const txHistory = await getPortfolioActivity(oktoClient)

        if (txHistory && txHistory.length > 0) {
            // Generate a unique ID for each transaction
            const formattedTransactions = txHistory.map((tx, index) => {
                // Create a truly unique ID using a combination of fields
                // If there is txHash, use it together with timestamp and index
                // If there is no txHash, use a combination of other available fields
                const uniqueId = tx.txHash
                    ? `${tx.txHash}-${tx.timestamp || Date.now()}-${index}`
                    : `tx-${tx.id || ''}-${tx.timestamp || Date.now()}-${index}`

                return {
                    id: uniqueId,
                    type: mapTransactionType(tx.transferType),
                    status: mapTransactionStatus(tx.status),
                    timestamp: tx.timestamp ? tx.timestamp * 1000 : Date.now(), // Convert to milliseconds
                    amount: tx.quantity || '0',
                    token: tx.caipId || '',
                    tokenSymbol: tx.symbol || '',
                    // We don't have from/to in the API, but we can infer based on transferType
                    from: tx.transferType?.toLowerCase() === 'send' ? 'Your wallet' : undefined,
                    to: tx.transferType?.toLowerCase() === 'receive' ? 'Your wallet' : undefined,
                    hash: tx.txHash || '',
                    networkName: tx.networkName || '',
                    explorerUrl: tx.networkExplorerUrl ? `${tx.networkExplorerUrl}tx/${tx.txHash}` : undefined,
                }
            })

            // Verify that there are no duplicate IDs before updating the state
            const idSet = new Set()
            const uniqueTransactions = formattedTransactions.filter(tx => {
                if (idSet.has(tx.id)) {
                    console.warn(`[syncTransactions] Duplicate transaction ID found: ${tx.id}. Creating new unique ID.`)
                    // If we find a duplicate, generate a new unique ID
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

// Function to add a pending transaction
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

// Function to update a pending transaction
export async function updatePendingTransaction(id: string, oktoClient: OktoClient) {
    const pendingTxs = transactionsState$.pendingTransactions.get()
    const txIndex = pendingTxs.findIndex(tx => tx.id === id)

    if (txIndex === -1) {
        console.warn('[updatePendingTransaction] Transaction not found:', id)
        return
    }

    const tx = pendingTxs[txIndex]

    // Here goes the logic to verify the transaction status
    // For example, querying the hash in the blockchain

    // For now, we simply simulate that the transaction is confirmed after a time
    const updatedTx = {
        ...tx,
        status: 'confirmed' as const,
    }

    // Update the pending transaction
    transactionsState$.pendingTransactions[txIndex].set(updatedTx)

    // If it is confirmed, move it to confirmed transactions and remove it from pending
    if (updatedTx.status === 'confirmed') {
        transactionsState$.transactions.unshift(updatedTx)
        transactionsState$.pendingTransactions.splice(txIndex, 1)
    }

    console.log('[updatePendingTransaction] Updated transaction:', updatedTx)

    // Refresh the transactions to get the latest version
    await syncTransactions(oktoClient, true)
}

// Function to clear the state
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

// Helper functions to map types and statuses
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

    // If it is a boolean, true = confirmed, false = failed
    if (typeof status === 'boolean') {
        return status ? 'confirmed' : 'failed'
    }

    // If it is a string
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
