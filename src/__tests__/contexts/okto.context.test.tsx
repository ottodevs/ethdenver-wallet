import OktoProvider, { useOkto } from '@/contexts/okto.context'
import * as authenticateModule from '@/okto/authenticate'
import * as portfolioModule from '@/okto/explorer/portfolio'
import * as walletModule from '@/okto/explorer/wallet'
import type { OktoAuthResponse } from '@/okto/types'
import type { OktoPortfolioData, OktoTokenGroup, OktoWallet } from '@/types/okto'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the dependencies
vi.mock('next-auth/react', () => {
    const originalModule = vi.importActual('next-auth/react')
    return {
        ...originalModule,
        useSession: vi.fn(),
        SessionProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})

vi.mock('@/okto/authenticate', () => ({
    authenticateWithIdToken: vi.fn(),
    isAuthenticated: vi.fn(),
    logoutUser: vi.fn(),
}))

// Mock portfolio module with a get method for portfolioState$
vi.mock('@/okto/explorer/portfolio', () => ({
    refreshPortfolio: vi.fn(),
    portfolioState$: {
        set: vi.fn(),
        get: vi.fn().mockReturnValue(null),
    },
}))

vi.mock('@/okto/explorer/wallet', () => ({
    refreshWallets: vi.fn(),
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

// Mock console methods to reduce noise
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Test component to access the Okto context
const TestComponent = () => {
    const { isAuthenticated, isInitialized, isInitializing, isError, errorMessage } = useOkto()
    return (
        <div>
            <div data-testid='auth-status'>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
            <div data-testid='init-status'>{isInitialized ? 'Initialized' : 'Not Initialized'}</div>
            <div data-testid='loading-status'>{isInitializing ? 'Loading' : 'Not Loading'}</div>
            <div data-testid='error-status'>{isError ? 'Error' : 'No Error'}</div>
            {errorMessage && <div data-testid='error-message'>{errorMessage}</div>}
        </div>
    )
}

describe('OktoProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers() // Use fake timers for all tests

        // Default mock implementations
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: vi.fn(),
        })

        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(false)
        vi.mocked(authenticateModule.authenticateWithIdToken).mockResolvedValue({
            userAddress: '0xuser123',
            nonce: 'mock-nonce',
            vendorAddress: '0xvendor456',
            sessionExpiry: Date.now() + 3600000,
            idToken: 'mock-id-token',
        } as OktoAuthResponse)

        vi.mocked(walletModule.refreshWallets).mockResolvedValue([
            {
                id: 'wallet1',
                name: 'Wallet 1',
                caip_id: 'caip:wallet1',
                network_name: 'Ethereum',
                address: '0x123',
                network_id: 'eth',
                network_symbol: 'ETH',
                is_primary: true,
                balance: '1.0',
            },
            {
                id: 'wallet2',
                name: 'Wallet 2',
                caip_id: 'caip:wallet2',
                network_name: 'Polygon',
                address: '0x456',
                network_id: 'matic',
                network_symbol: 'MATIC',
                is_primary: false,
                balance: '10.0',
            },
        ] as OktoWallet[])

        vi.mocked(portfolioModule.refreshPortfolio).mockResolvedValue({
            aggregated_data: {
                holdings_count: '2',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1200.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1200.00',
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
                    holdings_price_usdt: '600.00',
                    holdings_price_inr: '50000.00',
                },
                {
                    id: 'token2',
                    name: 'Token 2',
                    symbol: 'TKN2',
                    short_name: 'T2',
                    token_image: 'image2.png',
                    token_address: '0x456',
                    network_id: 'matic',
                    precision: '18',
                    network_name: 'Polygon',
                    is_primary: false,
                    balance: '10.0',
                    holdings_price_usdt: '600.00',
                    holdings_price_inr: '50000.00',
                },
            ] as OktoTokenGroup[],
        } as OktoPortfolioData)

        // Mock portfolioState$.get to return a valid portfolio
        vi.mocked(portfolioModule.portfolioState$.get).mockReturnValue({
            aggregated_data: {
                holdings_count: '2',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1200.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1200.00',
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
                    holdings_price_usdt: '600.00',
                    holdings_price_inr: '50000.00',
                },
            ],
            lastUpdated: Date.now(),
        })

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.useRealTimers() // Restore real timers after each test
    })

    it.skip('should initialize as not authenticated when no session exists', async () => {
        render(
            <OktoProvider>
                <TestComponent />
            </OktoProvider>,
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated')
            expect(screen.getByTestId('init-status')).toHaveTextContent('Initialized')
        })

        // Verify that no authentication attempt was made
        expect(authenticateModule.authenticateWithIdToken).not.toHaveBeenCalled()
    })

    it.skip('should authenticate when a valid session with ID token exists', async () => {
        // Create a wrapper component that changes the session after render
        const TestWrapper = ({ children }: { children: React.ReactNode }) => {
            useEffect(() => {
                // Mock authenticated session after component mounts
                vi.mocked(useSession).mockReturnValue({
                    data: {
                        user: { name: 'Test User', email: 'test@example.com' },
                        expires: '2023-01-01',
                        id_token: 'valid-id-token',
                    },
                    status: 'authenticated',
                    update: vi.fn(),
                })

                // Trigger a re-render of the OktoProvider
                const event = new Event('visibilitychange')
                document.dispatchEvent(event)
            }, [])

            return <>{children}</>
        }

        // Initially mock as unauthenticated
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: 'loading',
            update: vi.fn(),
        })

        render(
            <TestWrapper>
                <OktoProvider>
                    <TestComponent />
                </OktoProvider>
            </TestWrapper>,
        )

        // Initially it should show loading
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading')

        // Wait for authentication to complete
        await waitFor(
            () => {
                expect(authenticateModule.authenticateWithIdToken).toHaveBeenCalledWith('valid-id-token')
            },
            { timeout: 2000 },
        )

        // Verify that wallet and portfolio data was refreshed
        await waitFor(() => {
            expect(walletModule.refreshWallets).toHaveBeenCalled()
            expect(portfolioModule.refreshPortfolio).toHaveBeenCalled()
        })
    })

    it.skip('should handle authentication errors gracefully', async () => {
        // Mock authentication failure
        vi.mocked(authenticateModule.authenticateWithIdToken).mockRejectedValue(new Error('Auth failed'))

        // Create a wrapper component that changes the session after render
        const TestWrapper = ({ children }: { children: React.ReactNode }) => {
            useEffect(() => {
                // Mock authenticated session after component mounts
                vi.mocked(useSession).mockReturnValue({
                    data: {
                        user: { name: 'Test User', email: 'test@example.com' },
                        expires: '2023-01-01',
                        id_token: 'valid-id-token',
                    },
                    status: 'authenticated',
                    update: vi.fn(),
                })

                // Trigger a re-render of the OktoProvider
                const event = new Event('visibilitychange')
                document.dispatchEvent(event)
            }, [])

            return <>{children}</>
        }

        // Initially mock as unauthenticated
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: 'loading',
            update: vi.fn(),
        })

        render(
            <TestWrapper>
                <OktoProvider>
                    <TestComponent />
                </OktoProvider>
            </TestWrapper>,
        )

        // Wait for authentication to fail
        await waitFor(
            () => {
                expect(authenticateModule.authenticateWithIdToken).toHaveBeenCalledWith('valid-id-token')
            },
            { timeout: 2000 },
        )

        await waitFor(() => {
            expect(screen.getByTestId('error-status')).toHaveTextContent('Error')
            expect(screen.getByTestId('error-message')).toHaveTextContent('Authentication failed')
        })

        // Verify that wallet and portfolio data was not refreshed
        expect(walletModule.refreshWallets).not.toHaveBeenCalled()
        expect(portfolioModule.refreshPortfolio).not.toHaveBeenCalled()
    })

    it.skip('should handle data refresh errors gracefully', async () => {
        // Mock successful authentication but failed wallet refresh
        vi.mocked(walletModule.refreshWallets).mockRejectedValue(new Error('Wallet refresh failed'))

        // Create a wrapper component that changes the session after render
        const TestWrapper = ({ children }: { children: React.ReactNode }) => {
            useEffect(() => {
                // Mock authenticated session after component mounts
                vi.mocked(useSession).mockReturnValue({
                    data: {
                        user: { name: 'Test User', email: 'test@example.com' },
                        expires: '2023-01-01',
                        id_token: 'valid-id-token',
                    },
                    status: 'authenticated',
                    update: vi.fn(),
                })

                // Trigger a re-render of the OktoProvider
                const event = new Event('visibilitychange')
                document.dispatchEvent(event)
            }, [])

            return <>{children}</>
        }

        // Initially mock as unauthenticated
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: 'loading',
            update: vi.fn(),
        })

        render(
            <TestWrapper>
                <OktoProvider>
                    <TestComponent />
                </OktoProvider>
            </TestWrapper>,
        )

        // Wait for authentication to complete
        await waitFor(
            () => {
                expect(authenticateModule.authenticateWithIdToken).toHaveBeenCalledWith('valid-id-token')
            },
            { timeout: 2000 },
        )

        // Verify that wallet refresh was attempted but portfolio refresh was not
        await waitFor(() => {
            expect(walletModule.refreshWallets).toHaveBeenCalled()
        })

        // Since wallet refresh failed, portfolio refresh should not be called
        expect(portfolioModule.refreshPortfolio).not.toHaveBeenCalled()
    })
})
