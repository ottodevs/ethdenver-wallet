import { useAuth } from '@/hooks/use-auth'
import { oktoState } from '@/okto/state'
import { AuthService } from '@/services/auth.service'
import { act, renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
}))

vi.mock('@/services/auth.service', () => ({
    AuthService: {
        isAuthenticated: vi.fn(),
        authenticate: vi.fn(),
        logout: vi.fn(),
        refreshData: vi.fn(),
        getAuthState: vi.fn(),
    },
}))

vi.mock('@/okto/state', () => ({
    oktoState: {
        auth: {
            isAuthenticated: {
                get: vi.fn(),
            },
        },
    },
}))

describe('useAuth', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
    })

    it('should return the correct authentication state', () => {
        // Setup
        const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        })

        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(false)

        // Execute
        const { result } = renderHook(() => useAuth())

        // Verify
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isInitialized).toBe(true)
        expect(result.current.isInitializing).toBe(false)
        expect(result.current.isError).toBe(false)
        expect(result.current.errorMessage).toBeNull()
    })

    it('should call AuthService.logout when session is unauthenticated', async () => {
        // Setup
        const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        })

        const mockLogout = AuthService.logout as unknown as ReturnType<typeof vi.fn>

        // Execute
        renderHook(() => useAuth())

        // Wait for effects to run
        await vi.runAllTimersAsync()

        // Verify
        expect(mockLogout).toHaveBeenCalledTimes(2)
    })

    it('should call AuthService.authenticate when session has an ID token', async () => {
        // Setup
        const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>
        mockUseSession.mockReturnValue({
            data: {
                id_token: 'test-id-token',
            },
            status: 'authenticated',
        })

        const mockAuthenticate = AuthService.authenticate as unknown as ReturnType<typeof vi.fn>
        mockAuthenticate.mockResolvedValue(true)

        const mockRefreshData = AuthService.refreshData as unknown as ReturnType<typeof vi.fn>
        mockRefreshData.mockResolvedValue({
            wallets: [],
            portfolio: null,
        })

        // Execute
        renderHook(() => useAuth())

        // Wait for effects to run
        await vi.runAllTimersAsync()

        // Verify
        expect(mockAuthenticate).toHaveBeenCalledWith('test-id-token')
        expect(mockRefreshData).toHaveBeenCalledWith(true)
    })

    it('should not re-authenticate if the session ID has not changed', async () => {
        // Setup
        const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>
        mockUseSession.mockReturnValue({
            data: {
                id_token: 'test-id-token',
            },
            status: 'authenticated',
        })

        const mockAuthenticate = AuthService.authenticate as unknown as ReturnType<typeof vi.fn>
        mockAuthenticate.mockResolvedValue(true)

        // Execute
        const { rerender } = renderHook(() => useAuth())

        // Wait for effects to run
        await vi.runAllTimersAsync()

        // Reset mocks to check if they're called again
        mockAuthenticate.mockClear()

        // Rerender with the same session
        rerender()

        // Wait for effects to run
        await vi.runAllTimersAsync()

        // Verify
        expect(mockAuthenticate).not.toHaveBeenCalled()
    })

    it('should refresh data when refreshData is called', async () => {
        // Setup
        const mockUseSession = useSession as unknown as ReturnType<typeof vi.fn>
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        })

        const mockRefreshData = AuthService.refreshData as unknown as ReturnType<typeof vi.fn>
        mockRefreshData.mockResolvedValue({
            wallets: [],
            portfolio: null,
        })

        // Execute
        const { result } = renderHook(() => useAuth())

        // Call refreshData
        act(() => {
            result.current.refreshData()
        })

        // Wait for async operations
        await vi.runAllTimersAsync()

        // Verify
        expect(mockRefreshData).toHaveBeenCalledTimes(1)
    })
})
