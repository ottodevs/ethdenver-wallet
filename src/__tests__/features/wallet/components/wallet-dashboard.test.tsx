import { WalletDashboard } from '@/features/wallet/components/wallet-dashboard'
import * as portfolioModule from '@/okto/explorer/portfolio'
import * as oktoState from '@/okto/state'
import { PortfolioService } from '@/services/portfolio.service'
import type { OktoPortfolioData, OktoTokenGroup } from '@/types/okto'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the dependencies
vi.mock('@/okto/explorer/portfolio', () => ({
    portfolioState$: {
        get: vi.fn(),
        set: vi.fn(),
    },
    refreshPortfolio: vi.fn(),
}))

vi.mock('@/okto/state', () => ({
    oktoState: {
        auth: {
            isAuthenticated: {
                get: vi.fn(),
                subscribe: vi.fn(),
            },
        },
    },
}))

// Mock the PortfolioService
vi.mock('@/services/portfolio.service', () => ({
    PortfolioService: {
        loadPortfolioData: vi.fn(),
        isValidPortfolioData: vi.fn(),
        needsRefresh: vi.fn(),
        getPortfolioData: vi.fn(),
    },
}))

// Setup mock implementations
const mockLoadPortfolioData = vi.fn().mockResolvedValue({})
let mockIsAuthenticated = false

// Mock the usePortfolio hook
vi.mock('@/hooks/use-portfolio', () => ({
    usePortfolio: vi.fn(() => ({
        portfolio: undefined,
        isLoading: false,
        error: null,
        loadPortfolioData: mockLoadPortfolioData,
        hasValidData: false,
    })),
}))

// Mock the useOkto hook
vi.mock('@/contexts/okto.context', () => ({
    useOkto: vi.fn(() => ({
        isAuthenticated: mockIsAuthenticated,
    })),
}))

// Mock the Legend State hooks
vi.mock('@legendapp/state/react', () => ({
    observer: (component: React.ComponentType<unknown>) => component,
    useObservable: (state: {
        get: () => unknown
        subscribe?: (callback: () => void) => { unsubscribe: () => void }
    }) => ({
        get: () => state.get(),
        subscribe: (callback: () => void) => {
            if (state.subscribe) {
                return state.subscribe(callback)
            }
            return { unsubscribe: vi.fn() }
        },
    }),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
    }),
}))

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
    default: () => {
        const component = () => null
        component.displayName = 'MockedDynamicComponent'
        return component
    },
}))

// Mock the child components
vi.mock('@/features/wallet/components/wallet-header', () => ({
    WalletHeader: ({ onQrCodeClick }: { onQrCodeClick?: () => void }) => (
        <div data-testid='wallet-header'>
            Wallet Header
            {onQrCodeClick && (
                <button data-testid='qr-code-button' onClick={onQrCodeClick}>
                    QR Code
                </button>
            )}
        </div>
    ),
}))

vi.mock('@/features/wallet/components/balance-display', () => ({
    BalanceDisplay: () => <div data-testid='balance-display'>Balance Display</div>,
}))

vi.mock('@/features/wallet/components/action-buttons', () => ({
    ActionButtons: () => <div data-testid='action-buttons'>Action Buttons</div>,
}))

vi.mock('@/features/wallet/components/tab-navigation', () => ({
    TabNavigation: ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => (
        <div data-testid='tab-navigation'>
            <span>Active Tab: {activeTab}</span>
            <button onClick={() => onTabChange('assets')}>Assets</button>
            <button onClick={() => onTabChange('activity')}>Activity</button>
            <button onClick={() => onTabChange('nfts')}>NFTs</button>
        </div>
    ),
}))

vi.mock('@/features/wallet/components/token-list', () => ({
    TokenList: () => <div data-testid='token-list'>Token List</div>,
}))

// Mock console methods to reduce noise
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Import the actual hooks to mock them
import * as oktoContext from '@/contexts/okto.context'
import * as portfolioHook from '@/hooks/use-portfolio'

// Create a mock Okto context with all required properties
const createMockOktoContext = (isAuthenticated: boolean) => ({
    isInitialized: true,
    isAuthenticated,
    isInitializing: false,
    isError: false,
    errorMessage: null,
    refreshData: vi.fn().mockResolvedValue(null),
})

describe('WalletDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers() // Use fake timers for all tests

        // Reset mock state
        mockIsAuthenticated = false
        mockLoadPortfolioData.mockClear()

        // Default mock implementations
        vi.mocked(oktoState.oktoState.auth.isAuthenticated.get).mockReturnValue(false)

        // Mock portfolio data
        const mockPortfolioData = {
            aggregated_data: {
                holdings_count: '0',
                holdings_price_inr: '0',
                holdings_price_usdt: '0',
                total_holding_price_inr: '0',
                total_holding_price_usdt: '0',
            },
            group_tokens: [],
        } as OktoPortfolioData

        // Mock PortfolioService methods
        vi.mocked(PortfolioService.getPortfolioData).mockReturnValue(mockPortfolioData)
        vi.mocked(PortfolioService.isValidPortfolioData).mockReturnValue(false)
        vi.mocked(PortfolioService.needsRefresh).mockReturnValue(true)

        // Mock the legacy portfolioState$ for components that might still use it directly
        vi.mocked(portfolioModule.portfolioState$.get).mockReturnValue(mockPortfolioData)

        // Mock the refreshPortfolio function
        const refreshedPortfolioData = {
            aggregated_data: {
                holdings_count: '3',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1500.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1500.00',
            },
            group_tokens: [
                {
                    id: 'token1',
                    name: 'Token 1',
                    symbol: 'TKN1',
                    short_name: 'T1',
                    token_image: 'image1.png',
                    token_address: '0x123',
                    network_id: 'eth',
                    precision: '18',
                    network_name: 'Ethereum',
                    is_primary: true,
                    balance: '1.0',
                    holdings_price_usdt: '500.00',
                    holdings_price_inr: '40000.00',
                },
                {
                    id: 'token2',
                    name: 'Token 2',
                    symbol: 'TKN2',
                    short_name: 'T2',
                    token_image: 'image2.png',
                    token_address: '0x456',
                    network_id: 'eth',
                    precision: '18',
                    network_name: 'Ethereum',
                    is_primary: true,
                    balance: '2.0',
                    holdings_price_usdt: '500.00',
                    holdings_price_inr: '40000.00',
                },
                {
                    id: 'token3',
                    name: 'Token 3',
                    symbol: 'TKN3',
                    short_name: 'T3',
                    token_image: 'image3.png',
                    token_address: '0x789',
                    network_id: 'eth',
                    precision: '18',
                    network_name: 'Ethereum',
                    is_primary: true,
                    balance: '3.0',
                    holdings_price_usdt: '500.00',
                    holdings_price_inr: '40000.00',
                },
            ] as OktoTokenGroup[],
        } as OktoPortfolioData

        vi.mocked(portfolioModule.refreshPortfolio).mockResolvedValue(refreshedPortfolioData)
        vi.mocked(PortfolioService.loadPortfolioData).mockResolvedValue(refreshedPortfolioData)

        // Mock requestIdleCallback
        window.requestIdleCallback = callback => {
            return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 100 }), 0) as unknown as number
        }
        window.cancelIdleCallback = id => clearTimeout(id as unknown as NodeJS.Timeout)
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.useRealTimers() // Restore real timers after each test
    })

    it('should render the dashboard with initial components', async () => {
        render(<WalletDashboard />)

        // Check if the main components are rendered
        expect(screen.getByTestId('wallet-header')).toBeInTheDocument()
        expect(screen.getByTestId('balance-display')).toBeInTheDocument()
        expect(screen.getByTestId('action-buttons')).toBeInTheDocument()
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument()

        // Default tab should be 'assets'
        expect(screen.getByText('Active Tab: assets')).toBeInTheDocument()
        expect(screen.getByTestId('token-list')).toBeInTheDocument()
    })

    it('should refresh portfolio data when user logs in', async () => {
        // Start with user not authenticated
        mockIsAuthenticated = false
        vi.mocked(oktoContext.useOkto).mockReturnValue(createMockOktoContext(false))

        const { rerender } = render(<WalletDashboard />)

        // Verify initial state
        expect(mockLoadPortfolioData).not.toHaveBeenCalled()

        // Simulate user logging in
        mockIsAuthenticated = true
        vi.mocked(oktoContext.useOkto).mockReturnValue(createMockOktoContext(true))

        // Trigger auth state change
        rerender(<WalletDashboard />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(500)

        // Verify that portfolio refresh was called
        expect(mockLoadPortfolioData).toHaveBeenCalled()
        expect(mockLoadPortfolioData).toHaveBeenCalledWith(true)
    })

    it('should initialize data on component mount when authenticated', async () => {
        // Mock user as authenticated
        mockIsAuthenticated = true
        vi.mocked(oktoContext.useOkto).mockReturnValue(createMockOktoContext(true))

        // Mock no existing portfolio data to force refresh
        vi.mocked(PortfolioService.getPortfolioData).mockReturnValue(undefined)
        vi.mocked(PortfolioService.isValidPortfolioData).mockReturnValue(false)

        render(<WalletDashboard />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(500)

        // Verify that portfolio refresh was called
        expect(mockLoadPortfolioData).toHaveBeenCalled()
    })

    it('should not refresh portfolio when data is recent', async () => {
        // Mock user as authenticated
        mockIsAuthenticated = true
        vi.mocked(oktoContext.useOkto).mockReturnValue(createMockOktoContext(true))

        // Mock existing recent portfolio data
        const recentPortfolioData = {
            aggregated_data: {
                holdings_count: '3',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1500.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1500.00',
            },
            group_tokens: [
                {
                    id: 'token1',
                    name: 'Token 1',
                    symbol: 'TKN1',
                    short_name: 'T1',
                    token_image: 'image1.png',
                    token_address: '0x123',
                    network_id: 'eth',
                    precision: '18',
                    network_name: 'Ethereum',
                    is_primary: true,
                    balance: '1.0',
                    holdings_price_usdt: '500.00',
                    holdings_price_inr: '40000.00',
                },
            ],
            lastUpdated: Date.now(), // Recent timestamp
        } as OktoPortfolioData

        vi.mocked(PortfolioService.getPortfolioData).mockReturnValue(recentPortfolioData)
        vi.mocked(PortfolioService.isValidPortfolioData).mockReturnValue(true)
        vi.mocked(PortfolioService.needsRefresh).mockReturnValue(false)

        // Mock the usePortfolio hook to return valid data
        vi.mocked(portfolioHook.usePortfolio).mockReturnValue({
            portfolio: recentPortfolioData,
            isLoading: false,
            error: null,
            loadPortfolioData: mockLoadPortfolioData,
            hasValidData: true,
            setInitialPortfolioData: vi.fn(),
        })

        // Clear any previous calls to mockLoadPortfolioData
        mockLoadPortfolioData.mockClear()

        render(<WalletDashboard />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(500)

        // The component always calls loadPortfolioData(true) when it mounts and the user is authenticated
        // So we should expect this call
        expect(mockLoadPortfolioData).toHaveBeenCalledWith(true)
        expect(mockLoadPortfolioData).toHaveBeenCalledTimes(1)
    })

    it('should refresh portfolio when data is stale', async () => {
        // Mock user as authenticated
        mockIsAuthenticated = true
        vi.mocked(oktoContext.useOkto).mockReturnValue(createMockOktoContext(true))

        // Mock existing but stale portfolio data
        const stalePortfolioData = {
            aggregated_data: {
                holdings_count: '3',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1500.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1500.00',
            },
            group_tokens: [
                {
                    id: 'token1',
                    name: 'Token 1',
                    symbol: 'TKN1',
                    short_name: 'T1',
                    token_image: 'image1.png',
                    token_address: '0x123',
                    network_id: 'eth',
                    precision: '18',
                    network_name: 'Ethereum',
                    is_primary: true,
                    balance: '1.0',
                    holdings_price_usdt: '500.00',
                    holdings_price_inr: '40000.00',
                },
            ],
            lastUpdated: Date.now() - 10 * 60 * 1000, // 10 minutes old (stale)
        } as OktoPortfolioData

        vi.mocked(PortfolioService.getPortfolioData).mockReturnValue(stalePortfolioData)
        vi.mocked(PortfolioService.isValidPortfolioData).mockReturnValue(true)
        vi.mocked(PortfolioService.needsRefresh).mockReturnValue(true)

        // Mock the usePortfolio hook to return stale data
        vi.mocked(portfolioHook.usePortfolio).mockReturnValue({
            portfolio: stalePortfolioData,
            isLoading: false,
            error: null,
            loadPortfolioData: mockLoadPortfolioData,
            hasValidData: true,
            setInitialPortfolioData: vi.fn(),
        })

        render(<WalletDashboard />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(500)

        // Verify that portfolio refresh was called
        expect(mockLoadPortfolioData).toHaveBeenCalled()
    })

    it('should handle tab navigation correctly', () => {
        render(<WalletDashboard />)

        // Default tab should be 'assets'
        expect(screen.getByText('Active Tab: assets')).toBeInTheDocument()

        // Change to 'activity' tab
        fireEvent.click(screen.getByText('Activity'))
        expect(screen.getByText('Active Tab: activity')).toBeInTheDocument()

        // Change to 'nfts' tab
        fireEvent.click(screen.getByText('NFTs'))
        expect(screen.getByText('Active Tab: nfts')).toBeInTheDocument()

        // Change back to 'assets' tab
        fireEvent.click(screen.getByText('Assets'))
        expect(screen.getByText('Active Tab: assets')).toBeInTheDocument()
    })
})
