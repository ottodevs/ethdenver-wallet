import { authenticateWithIdToken, isAuthenticated, logoutUser } from '@/okto/authenticate'
import { refreshPortfolio } from '@/okto/explorer/portfolio'
import { refreshWallets } from '@/okto/explorer/wallet'
import { AuthService } from '@/services/auth.service'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the dependencies
vi.mock('@/okto/authenticate', () => ({
    authenticateWithIdToken: vi.fn(),
    isAuthenticated: vi.fn(),
    logoutUser: vi.fn(),
}))

vi.mock('@/okto/explorer/portfolio', () => ({
    refreshPortfolio: vi.fn(),
}))

vi.mock('@/okto/explorer/wallet', () => ({
    refreshWallets: vi.fn(),
}))

describe('AuthService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('isAuthenticated', () => {
        it('should call the isAuthenticated function from okto/authenticate', () => {
            // Setup
            const mockIsAuthenticated = isAuthenticated as unknown as ReturnType<typeof vi.fn>
            mockIsAuthenticated.mockReturnValue(true)

            // Execute
            const result = AuthService.isAuthenticated()

            // Verify
            expect(mockIsAuthenticated).toHaveBeenCalledTimes(1)
            expect(result).toBe(true)
        })
    })

    describe('authenticate', () => {
        it('should call authenticateWithIdToken and return true on success', async () => {
            // Setup
            const mockAuthenticateWithIdToken = authenticateWithIdToken as unknown as ReturnType<typeof vi.fn>
            mockAuthenticateWithIdToken.mockResolvedValue({ success: true })

            // Execute
            const result = await AuthService.authenticate('test-token')

            // Verify
            expect(mockAuthenticateWithIdToken).toHaveBeenCalledWith('test-token')
            expect(result).toBe(true)
        })

        it('should return false on authentication error', async () => {
            // Setup
            const mockAuthenticateWithIdToken = authenticateWithIdToken as unknown as ReturnType<typeof vi.fn>
            mockAuthenticateWithIdToken.mockRejectedValue(new Error('Auth failed'))

            // Execute
            const result = await AuthService.authenticate('test-token')

            // Verify
            expect(mockAuthenticateWithIdToken).toHaveBeenCalledWith('test-token')
            expect(result).toBe(false)
        })
    })

    describe('logout', () => {
        it('should call logoutUser', () => {
            // Setup
            const mockLogoutUser = logoutUser as unknown as ReturnType<typeof vi.fn>

            // Execute
            AuthService.logout()

            // Verify
            expect(mockLogoutUser).toHaveBeenCalledTimes(1)
        })
    })

    describe('refreshData', () => {
        it('should return null if not authenticated', async () => {
            // Setup
            const mockIsAuthenticated = isAuthenticated as unknown as ReturnType<typeof vi.fn>
            mockIsAuthenticated.mockReturnValue(false)

            // Execute
            const result = await AuthService.refreshData()

            // Verify
            expect(mockIsAuthenticated).toHaveBeenCalledTimes(1)
            expect(result).toBeNull()
        })

        it('should refresh wallets and portfolio if authenticated', async () => {
            // Setup
            const mockIsAuthenticated = isAuthenticated as unknown as ReturnType<typeof vi.fn>
            mockIsAuthenticated.mockReturnValue(true)

            const mockRefreshWallets = refreshWallets as unknown as ReturnType<typeof vi.fn>
            const mockWallets = [{ address: '0x123' }]
            mockRefreshWallets.mockResolvedValue(mockWallets)

            const mockRefreshPortfolio = refreshPortfolio as unknown as ReturnType<typeof vi.fn>
            const mockPortfolio = { aggregated_data: {}, group_tokens: [] }
            mockRefreshPortfolio.mockResolvedValue(mockPortfolio)

            // Execute
            const result = await AuthService.refreshData()

            // Verify
            expect(mockIsAuthenticated).toHaveBeenCalledTimes(1)
            expect(mockRefreshWallets).toHaveBeenCalledTimes(1)
            expect(mockRefreshPortfolio).toHaveBeenCalledTimes(1)
            expect(result).toEqual({
                wallets: mockWallets,
                portfolio: mockPortfolio,
            })
        })

        it('should handle errors during refresh', async () => {
            // Setup
            const mockIsAuthenticated = isAuthenticated as unknown as ReturnType<typeof vi.fn>
            mockIsAuthenticated.mockReturnValue(true)

            const mockRefreshWallets = refreshWallets as unknown as ReturnType<typeof vi.fn>
            mockRefreshWallets.mockRejectedValue(new Error('Wallet refresh failed'))

            // Execute
            const result = await AuthService.refreshData()

            // Verify
            expect(mockIsAuthenticated).toHaveBeenCalledTimes(1)
            expect(mockRefreshWallets).toHaveBeenCalledTimes(1)
            expect(result).toBeNull()
        })
    })
})
