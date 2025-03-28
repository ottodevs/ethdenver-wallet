import { useOnlineStatus } from '@/features/shared/hooks/use-online-status'
import { clearSyncErrors, processPendingUpdates } from '@/features/shared/services/sync-service'
import { appState$ } from '@/lib/stores/app.store'
import { useEffect } from 'react'

/**
 * Hook to manage persistence and sync
 * This hook should be used in the app layout to ensure it's always active
 */
export function usePersistence() {
    // Get online status
    const { isOnline } = useOnlineStatus()

    // Process pending updates when the app starts and is online
    useEffect(() => {
        if (isOnline) {
            processPendingUpdates().catch(error => {
                console.error('Failed to process pending updates:', error)
            })
        }
    }, [isOnline])

    // Set up periodic sync
    useEffect(() => {
        // Only sync if online
        if (!isOnline) return

        // Process pending updates every 5 minutes
        const interval = setInterval(
            () => {
                processPendingUpdates().catch(error => {
                    console.error('Failed to process pending updates:', error)
                })
            },
            5 * 60 * 1000,
        )

        return () => clearInterval(interval)
    }, [isOnline])

    return {
        isOnline,
        pendingUpdates: appState$.sync.pendingUpdates.get(),
        syncErrors: appState$.sync.syncErrors.get(),
        clearSyncErrors,
    }
}
