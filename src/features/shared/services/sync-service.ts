import { appState$ } from '@/lib/stores/app.store'
import { batch } from '@legendapp/state'

/**
 * Types of updates that can be queued for syncing
 */
export enum UpdateType {
    ASSET_UPDATE = 'ASSET_UPDATE',
    TRANSACTION_SEND = 'TRANSACTION_SEND',
    USER_SETTINGS = 'USER_SETTINGS',
}

/**
 * Interface for a pending update
 */
export interface PendingUpdate {
    type: UpdateType
    payload: unknown
    timestamp: number
    retryCount: number
}

// First, let's update the app state interface to match our PendingUpdate type
// This is done by casting the pendingUpdates array to the correct type
const pendingUpdates = appState$.sync.pendingUpdates as unknown as {
    push: (update: PendingUpdate) => number
    splice: (start: number, deleteCount: number) => PendingUpdate[]
    get: () => PendingUpdate[]
    set: (updates: PendingUpdate[]) => void
    [index: number]: {
        retryCount: {
            set: (count: number) => void
        }
    }
}

/**
 * Add an update to the pending updates queue
 */
export function queueUpdate(type: UpdateType, payload: unknown): void {
    pendingUpdates.push({
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
    })

    // Update the last sync attempt
    appState$.sync.lastSyncAttempt.set(Date.now())

    // If online, try to process immediately
    if (appState$.ui.isOnline.get()) {
        processPendingUpdates()
    }
}

/**
 * Process all pending updates
 */
export async function processPendingUpdates(): Promise<void> {
    const updates = pendingUpdates.get()

    if (updates.length === 0) return

    console.log(`Processing ${updates.length} pending updates`)

    // Process each update
    for (let i = 0; i < updates.length; i++) {
        const update = updates[i]

        try {
            await processUpdate(update)

            // Remove the update from the queue
            pendingUpdates.splice(i, 1)
            i-- // Adjust index after removal
        } catch (error) {
            console.error(`Failed to process update: ${update.type}`, error)

            // Increment retry count
            const retryCount = update.retryCount + 1

            // If we've tried too many times, move to errors
            if (retryCount > 3) {
                appState$.sync.syncErrors.push(`Failed to process ${update.type}: ${error}`)
                pendingUpdates.splice(i, 1)
                i-- // Adjust index after removal
            } else {
                // Update retry count
                pendingUpdates[i].retryCount.set(retryCount)
            }
        }
    }

    // Update the last sync attempt
    appState$.sync.lastSyncAttempt.set(Date.now())
}

/**
 * Process a single update
 */
async function processUpdate(update: PendingUpdate): Promise<void> {
    switch (update.type) {
        case UpdateType.ASSET_UPDATE:
            // Process asset update
            console.log('Processing asset update', update.payload)
            // Implementation will depend on the API
            break

        case UpdateType.TRANSACTION_SEND:
            // Process transaction send
            console.log('Processing transaction send', update.payload)
            // Implementation will depend on the API
            break

        case UpdateType.USER_SETTINGS:
            // Process user settings update
            console.log('Processing user settings update', update.payload)
            // Implementation will depend on the API
            break

        default:
            throw new Error(`Unknown update type: ${update.type}`)
    }
}

/**
 * Clear all sync errors
 */
export function clearSyncErrors(): void {
    appState$.sync.syncErrors.set([])
}

/**
 * Clear all pending updates
 */
export function clearPendingUpdates(): void {
    pendingUpdates.set([])
}

/**
 * Reset the sync state
 */
export function resetSyncState(): void {
    batch(() => {
        pendingUpdates.set([])
        appState$.sync.syncErrors.set([])
        appState$.sync.lastSyncAttempt.set(null)
    })
}
