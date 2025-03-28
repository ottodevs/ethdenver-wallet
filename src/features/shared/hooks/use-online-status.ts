import { processPendingUpdates } from '@/features/shared/services/sync-service'
import { appState$ } from '@/lib/stores/app.store'
import { useEffect } from 'react'

/**
 * Hook to track online status and process pending updates when online
 */
export function useOnlineStatus() {
    useEffect(() => {
        // Set initial online status
        appState$.ui.isOnline.set(navigator.onLine)

        // Handler for online event
        const handleOnline = () => {
            console.log('App is online')
            appState$.ui.isOnline.set(true)
            processPendingUpdates()
        }

        // Handler for offline event
        const handleOffline = () => {
            console.log('App is offline')
            appState$.ui.isOnline.set(false)
        }

        // Add event listeners
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Clean up event listeners
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return {
        isOnline: appState$.ui.isOnline.get(),
    }
}
