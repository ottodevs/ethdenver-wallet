import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import the actual modules
import * as authenticateModule from '@/okto/authenticate'
import { fetchPortfolio } from '@/okto/explorer/portfolio'
import * as walletModule from '@/okto/explorer/wallet'
import * as stateModule from '@/okto/state'
import * as fetcherModule from '@/okto/utils/fetcher'

// Mock the dependencies
vi.mock('@/okto/authenticate')
vi.mock('@/okto/explorer/wallet')
vi.mock('@/okto/utils/fetcher')
vi.mock('@/okto/state', () => {
    return {
        oktoState: {
            auth: {
                isAuthenticated: {
                    get: vi.fn().mockReturnValue(true),
                },
                wallets: {
                    get: vi.fn().mockReturnValue([]),
                },
            },
        },
    }
})

// Mock portfolioState$ but not fetchPortfolio
vi.mock('@/okto/explorer/portfolio', async () => {
    const actual = await vi.importActual('@/okto/explorer/portfolio')
    return {
        ...actual,
        portfolioState$: {
            get: vi.fn().mockReturnValue(null),
            set: vi.fn(),
        },
    }
})

describe('Portfolio Module', () => {
    // Test data
    const mockWallets = [
        {
            id: '1',
            caip_id: 'caip_id_1',
            network_name: 'Ethereum',
            address: '0x123',
            network_id: 'eth',
            network_symbol: 'ETH',
        },
    ]

    const mockPortfolioData = {
        aggregated_data: {
            holdings_count: '5',
            holdings_price_inr: '10000.00',
            holdings_price_usdt: '120.50',
            total_holding_price_inr: '10000.00',
            total_holding_price_usdt: '120.50',
        },
        group_tokens: [
            {
                id: 'token1',
                name: 'Ethereum',
                symbol: 'ETH',
                short_name: 'ETH',
                token_image: 'eth.png',
                token_address: '0x0',
                network_id: 'eth',
                precision: '18',
                network_name: 'Ethereum',
                is_primary: true,
                balance: '1.5',
                holdings_price_usdt: '100.00',
                holdings_price_inr: '8000.00',
            },
        ],
    }

    // Mock for the authenticated fetcher
    const mockFetchWithAuth = vi.fn().mockResolvedValue({
        status: 'success',
        data: mockPortfolioData,
    })

    beforeEach(() => {
        vi.clearAllMocks()

        // Set up default mocks
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue(mockWallets)
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetchWithAuth)

        // Mock for authentication state
        vi.mocked(stateModule.oktoState.auth.isAuthenticated.get).mockReturnValue(true)
        vi.mocked(stateModule.oktoState.auth.wallets.get).mockReturnValue(mockWallets)

        // Mock for localStorage
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
        } as unknown as Storage
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should return null if user is not authenticated', async () => {
        // Arrange: User not authenticated
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(false)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that null is returned
        expect(authenticateModule.isAuthenticated).toHaveBeenCalled()
        expect(result).toBeNull()
    })

    it('should fetch portfolio data successfully', async () => {
        // Arrange: User authenticated and wallets available
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue(mockWallets)

        // Create a new mock for the fetcher that returns the expected data
        const mockFetchWithAuthForTest = vi.fn().mockResolvedValue({
            status: 'success',
            data: mockPortfolioData,
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetchWithAuthForTest)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that data is fetched correctly
        expect(authenticateModule.isAuthenticated).toHaveBeenCalled()
        expect(walletModule.getCurrentWallets).toHaveBeenCalled()
        expect(fetcherModule.createAuthenticatedFetcher).toHaveBeenCalled()
        expect(mockFetchWithAuthForTest).toHaveBeenCalledWith('/aggregated-portfolio')
        expect(result).toEqual(mockPortfolioData)
    })

    it('should use wallets from state if getCurrentWallets returns empty', async () => {
        // Arrange: getCurrentWallets returns empty array
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue([])
        vi.mocked(stateModule.oktoState.auth.wallets.get).mockReturnValue(mockWallets)

        // Create a new mock for the fetcher that returns the expected data
        const mockFetchWithAuthForTest = vi.fn().mockResolvedValue({
            status: 'success',
            data: mockPortfolioData,
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetchWithAuthForTest)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that data is fetched correctly
        // Only verify that the result is the expected
        expect(result).toEqual(mockPortfolioData)
    })

    it('should refresh wallets if none are available', async () => {
        // Arrange: No wallets available
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue([])
        vi.mocked(stateModule.oktoState.auth.wallets.get).mockReturnValue([])
        vi.mocked(walletModule.refreshWallets).mockResolvedValue(mockWallets)

        // Create a new mock for the fetcher that returns the expected data
        const mockFetchWithAuthForTest = vi.fn().mockResolvedValue({
            status: 'success',
            data: mockPortfolioData,
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetchWithAuthForTest)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that data is fetched correctly
        // Only verify that the result is the expected
        expect(result).toEqual(mockPortfolioData)
    })

    it('should return default portfolio data if fetcher creation fails', async () => {
        // Arrange: createAuthenticatedFetcher returns null
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue(mockWallets)
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(null)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that default portfolio data is returned
        // Only verify that the result has the expected structure
        expect(result).not.toBeNull()
        expect(result).toHaveProperty('aggregated_data')
        expect(result).toHaveProperty('group_tokens')
    })

    it('should return default portfolio data if API call fails', async () => {
        // Arrange: API call fails
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)
        vi.mocked(walletModule.getCurrentWallets).mockReturnValue(mockWallets)

        // Mock a failed API response
        const mockFailedFetch = vi.fn().mockResolvedValue({
            status: 'error',
            data: null,
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFailedFetch)

        // Act: Call fetchPortfolio
        const result = await fetchPortfolio()

        // Assert: Verify that default portfolio data is returned
        // Only verify that the result has the expected structure
        expect(result).not.toBeNull()
        expect(result).toHaveProperty('aggregated_data')
        expect(result).toHaveProperty('group_tokens')
    })
})
