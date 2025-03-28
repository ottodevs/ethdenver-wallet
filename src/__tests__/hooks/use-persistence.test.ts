import * as useOnlineStatus from '@/features/shared/hooks/use-online-status'
import * as syncService from '@/features/shared/services/sync-service'
import { usePersistence } from '@/hooks/use-persistence'
import * as appStore from '@/lib/stores/app.store'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@/features/shared/hooks/use-online-status', () => ({
    useOnlineStatus: vi.fn(),
}))

vi.mock('@/features/shared/services/sync-service', () => ({
    processPendingUpdates: vi.fn().mockResolvedValue(undefined),
    clearSyncErrors: vi.fn(),
}))

vi.mock('@/lib/stores/app.store', () => ({
    appState$: {
        sync: {
            pendingUpdates: {
                get: vi.fn(),
            },
            syncErrors: {
                get: vi.fn(),
            },
        },
    },
}))

describe('usePersistence', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        // Default mock values
        vi.mocked(useOnlineStatus.useOnlineStatus).mockReturnValue({ isOnline: true })
        vi.mocked(appStore.appState$.sync.pendingUpdates.get).mockReturnValue([])
        vi.mocked(appStore.appState$.sync.syncErrors.get).mockReturnValue([])
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return the correct state', () => {
        const pendingUpdates = [{ type: 'TEST', payload: {}, timestamp: Date.now(), retryCount: 0 }]
        const syncErrors = ['Test error']

        vi.mocked(appStore.appState$.sync.pendingUpdates.get).mockReturnValue(pendingUpdates)
        vi.mocked(appStore.appState$.sync.syncErrors.get).mockReturnValue(syncErrors)

        const { result } = renderHook(() => usePersistence())

        expect(result.current.isOnline).toBe(true)
        expect(result.current.pendingUpdates).toBe(pendingUpdates)
        expect(result.current.syncErrors).toBe(syncErrors)
        expect(result.current.clearSyncErrors).toBe(syncService.clearSyncErrors)
    })

    it('should process pending updates on mount when online', () => {
        renderHook(() => usePersistence())

        expect(syncService.processPendingUpdates).toHaveBeenCalledTimes(1)
    })

    it('should not process pending updates on mount when offline', () => {
        vi.mocked(useOnlineStatus.useOnlineStatus).mockReturnValue({ isOnline: false })

        renderHook(() => usePersistence())

        expect(syncService.processPendingUpdates).not.toHaveBeenCalled()
    })

    it('should set up periodic sync when online', () => {
        renderHook(() => usePersistence())

        // Initial call on mount
        expect(syncService.processPendingUpdates).toHaveBeenCalledTimes(1)

        // Advance time by 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000)

        // Should have called processPendingUpdates again
        expect(syncService.processPendingUpdates).toHaveBeenCalledTimes(2)

        // Advance time by another 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000)

        // Should have called processPendingUpdates again
        expect(syncService.processPendingUpdates).toHaveBeenCalledTimes(3)
    })

    it('should not set up periodic sync when offline', () => {
        vi.mocked(useOnlineStatus.useOnlineStatus).mockReturnValue({ isOnline: false })

        renderHook(() => usePersistence())

        // Should not call on mount
        expect(syncService.processPendingUpdates).not.toHaveBeenCalled()

        // Advance time by 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000)

        // Should still not have called processPendingUpdates
        expect(syncService.processPendingUpdates).not.toHaveBeenCalled()
    })
})
