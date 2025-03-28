import { clearSyncErrors, queueUpdate, UpdateType } from '@/features/shared/services/sync-service'
import { appState$ } from '@/lib/stores/app.store'
import { useCallback } from 'react'

/**
 * Hook to manage sync operations
 */
export function useSync() {
    // Queue an asset update
    const queueAssetUpdate = useCallback((payload: unknown) => {
        queueUpdate(UpdateType.ASSET_UPDATE, payload)
    }, [])

    // Queue a transaction send
    const queueTransactionSend = useCallback((payload: unknown) => {
        queueUpdate(UpdateType.TRANSACTION_SEND, payload)
    }, [])

    // Queue a user settings update
    const queueUserSettingsUpdate = useCallback((payload: unknown) => {
        queueUpdate(UpdateType.USER_SETTINGS, payload)
    }, [])

    return {
        queueAssetUpdate,
        queueTransactionSend,
        queueUserSettingsUpdate,
        pendingUpdates: appState$.sync.pendingUpdates.get(),
        syncErrors: appState$.sync.syncErrors.get(),
        clearSyncErrors,
        isOnline: appState$.ui.isOnline.get(),
    }
}
