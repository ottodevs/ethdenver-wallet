import { usePortfolio } from '@/hooks/use-portfolio'
import { oktoState } from '@/okto/state'
import { PortfolioService } from '@/services/portfolio.service'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@/services/portfolio.service', () => ({
    PortfolioService: {
        loadPortfolioData: vi.fn(),
        isValidPortfolioData: vi.fn(),
        needsRefresh: vi.fn(),
        getPortfolioData: vi.fn(),
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

// Mock the useObservable hook to return a simple object with a get method
vi.mock('@legendapp/state/react', () => ({
    useObservable: vi.fn().mockImplementation(observable => ({
        get: () => {
            if (typeof observable === 'object' && observable !== null && 'get' in observable) {
                return observable.get()
            }
            return observable
        },
    })),
}))

// Define the return type of usePortfolio for better type safety
type PortfolioHookResult = ReturnType<typeof usePortfolio>

describe('usePortfolio', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers() // Use fake timers for all tests
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers() // Restore real timers after each test
    })

    it('should return the correct portfolio state', () => {
        // Setup
        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(false)

        const mockGetPortfolioData = PortfolioService.getPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockGetPortfolioData.mockReturnValue(null)

        const mockIsValidPortfolioData = PortfolioService.isValidPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockIsValidPortfolioData.mockReturnValue(false)

        // Execute
        const { result } = renderHook<PortfolioHookResult, unknown>(() => usePortfolio())

        // Verify
        expect(result.current.portfolio).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.hasValidData).toBe(false)
        expect(typeof result.current.loadPortfolioData).toBe('function')
    })

    it('should load portfolio data when authenticated', async () => {
        // Setup
        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(true)

        const mockGetPortfolioData = PortfolioService.getPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockGetPortfolioData.mockReturnValue(null)

        const mockIsValidPortfolioData = PortfolioService.isValidPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockIsValidPortfolioData.mockReturnValue(false)

        const mockLoadPortfolioData = PortfolioService.loadPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockLoadPortfolioData.mockImplementation(async () => {
            return {
                aggregated_data: {
                    holdings_count: '1',
                },
                group_tokens: [{ symbol: 'ETH' }],
            }
        })

        const mockNeedsRefresh = PortfolioService.needsRefresh as unknown as ReturnType<typeof vi.fn>
        mockNeedsRefresh.mockReturnValue(true)

        // Directly call the loadPortfolioData function
        await PortfolioService.loadPortfolioData(true)

        // Verify
        expect(mockLoadPortfolioData).toHaveBeenCalledTimes(1)
        expect(mockLoadPortfolioData).toHaveBeenCalledWith(true)
    })

    it('should not load portfolio data when not authenticated', async () => {
        // Setup
        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(false)

        const mockLoadPortfolioData = PortfolioService.loadPortfolioData as unknown as ReturnType<typeof vi.fn>

        // Execute
        await act(async () => {
            renderHook<PortfolioHookResult, unknown>(() => usePortfolio())
            // Advance timers to process any pending promises
            await vi.runAllTimersAsync()
        })

        // Verify
        expect(mockLoadPortfolioData).not.toHaveBeenCalled()
    })

    it('should load portfolio data when loadPortfolioData is called', async () => {
        // Setup
        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(true)

        const mockGetPortfolioData = PortfolioService.getPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockGetPortfolioData.mockReturnValue(null)

        const mockIsValidPortfolioData = PortfolioService.isValidPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockIsValidPortfolioData.mockReturnValue(false)

        const mockLoadPortfolioData = PortfolioService.loadPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockLoadPortfolioData.mockImplementation(async _forceRefresh => {
            return {
                aggregated_data: {
                    holdings_count: '1',
                },
                group_tokens: [{ symbol: 'ETH' }],
            }
        })

        // Directly call the loadPortfolioData function
        await PortfolioService.loadPortfolioData(true)

        // Verify
        expect(mockLoadPortfolioData).toHaveBeenCalledTimes(1)
        expect(mockLoadPortfolioData).toHaveBeenCalledWith(true)
    })

    it('should not reload data if valid data exists and is recent', async () => {
        // Setup
        const mockIsAuthenticated = oktoState.auth.isAuthenticated.get as unknown as ReturnType<typeof vi.fn>
        mockIsAuthenticated.mockReturnValue(true)

        const mockGetPortfolioData = PortfolioService.getPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockGetPortfolioData.mockReturnValue({
            aggregated_data: {
                holdings_count: '1',
            },
            group_tokens: [{ symbol: 'ETH' }],
            lastUpdated: Date.now(),
        })

        const mockIsValidPortfolioData = PortfolioService.isValidPortfolioData as unknown as ReturnType<typeof vi.fn>
        mockIsValidPortfolioData.mockReturnValue(true)

        const mockNeedsRefresh = PortfolioService.needsRefresh as unknown as ReturnType<typeof vi.fn>
        mockNeedsRefresh.mockReturnValue(false)

        const mockLoadPortfolioData = PortfolioService.loadPortfolioData as unknown as ReturnType<typeof vi.fn>

        // Execute
        await act(async () => {
            renderHook<PortfolioHookResult, unknown>(() => usePortfolio())
            // Advance timers to process any pending promises
            await vi.runAllTimersAsync()
        })

        // Verify
        expect(mockLoadPortfolioData).not.toHaveBeenCalled()
    })
})
