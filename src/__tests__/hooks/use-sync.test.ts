import * as syncService from '@/features/shared/services/sync-service'
import { useSync } from '@/hooks/use-sync'
import * as appStore from '@/lib/stores/app.store'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@/features/shared/services/sync-service', () => ({
    queueUpdate: vi.fn(),
    clearSyncErrors: vi.fn(),
    UpdateType: {
        ASSET_UPDATE: 'ASSET_UPDATE',
        TRANSACTION_SEND: 'TRANSACTION_SEND',
        USER_SETTINGS: 'USER_SETTINGS',
    },
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
        ui: {
            isOnline: {
                get: vi.fn(),
            },
        },
    },
}))

describe('useSync', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Default mock values
        vi.mocked(appStore.appState$.sync.pendingUpdates.get).mockReturnValue([])
        vi.mocked(appStore.appState$.sync.syncErrors.get).mockReturnValue([])
        vi.mocked(appStore.appState$.ui.isOnline.get).mockReturnValue(true)
    })

    it('should return the correct state', () => {
        const pendingUpdates = [{ type: 'TEST', payload: {}, timestamp: Date.now(), retryCount: 0 }]
        const syncErrors = ['Test error']

        vi.mocked(appStore.appState$.sync.pendingUpdates.get).mockReturnValue(pendingUpdates)
        vi.mocked(appStore.appState$.sync.syncErrors.get).mockReturnValue(syncErrors)
        vi.mocked(appStore.appState$.ui.isOnline.get).mockReturnValue(false)

        const { result } = renderHook(() => useSync())

        expect(result.current.pendingUpdates).toBe(pendingUpdates)
        expect(result.current.syncErrors).toBe(syncErrors)
        expect(result.current.clearSyncErrors).toBe(syncService.clearSyncErrors)
        expect(result.current.isOnline).toBe(false)
    })

    it('should queue asset update correctly', () => {
        const { result } = renderHook(() => useSync())
        const payload = { asset: 'BTC', amount: 1.5 }

        act(() => {
            result.current.queueAssetUpdate(payload)
        })

        expect(syncService.queueUpdate).toHaveBeenCalledWith(syncService.UpdateType.ASSET_UPDATE, payload)
    })

    it('should queue transaction send correctly', () => {
        const { result } = renderHook(() => useSync())
        const payload = { to: '0x123', amount: 1.0, token: 'ETH' }

        act(() => {
            result.current.queueTransactionSend(payload)
        })

        expect(syncService.queueUpdate).toHaveBeenCalledWith(syncService.UpdateType.TRANSACTION_SEND, payload)
    })

    it('should queue user settings update correctly', () => {
        const { result } = renderHook(() => useSync())
        const payload = { theme: 'dark', notifications: true }

        act(() => {
            result.current.queueUserSettingsUpdate(payload)
        })

        expect(syncService.queueUpdate).toHaveBeenCalledWith(syncService.UpdateType.USER_SETTINGS, payload)
    })

    it('should memoize queue functions', () => {
        const { result, rerender } = renderHook(() => useSync())

        const initialQueueAssetUpdate = result.current.queueAssetUpdate
        const initialQueueTransactionSend = result.current.queueTransactionSend
        const initialQueueUserSettingsUpdate = result.current.queueUserSettingsUpdate

        // Rerender the hook
        rerender()

        // Functions should be memoized (same reference)
        expect(result.current.queueAssetUpdate).toBe(initialQueueAssetUpdate)
        expect(result.current.queueTransactionSend).toBe(initialQueueTransactionSend)
        expect(result.current.queueUserSettingsUpdate).toBe(initialQueueUserSettingsUpdate)
    })
})
