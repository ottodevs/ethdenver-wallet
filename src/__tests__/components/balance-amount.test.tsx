import { BalanceAmount } from '@/features/wallet/components/balance-amount'
import { oktoState } from '@/okto/state'
import type { OktoPortfolioData, OktoTokenGroup } from '@/types/okto'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// Mock the useWalletBalance hook
vi.mock('@/hooks/use-wallet-balance', () => ({
    useWalletBalance: vi.fn().mockImplementation(({ initialPortfolio }) => {
        // Return different values based on the mocked auth state
        const isAuthenticated = oktoState.auth.isAuthenticated.get()

        if (!isAuthenticated) {
            return {
                formattedBalance: '$0.00',
                isLoading: false,
                isPrivacyEnabled: false,
                debugInfo: 'Not authenticated',
                hasData: false,
            }
        }

        // If we have initial portfolio data, use it
        if (initialPortfolio) {
            return {
                formattedBalance: '$5,678.90',
                isLoading: false,
                isPrivacyEnabled: false,
                debugInfo: 'Using initial portfolio data',
                hasData: true,
            }
        }

        // Default to loading state
        return {
            formattedBalance: '$1,234.56',
            isLoading: true,
            isPrivacyEnabled: false,
            debugInfo: 'Loading portfolio data',
            hasData: false,
        }
    }),
}))

// Mock the okto state
vi.mock('@/okto/state', () => ({
    oktoState: {
        auth: {
            isAuthenticated: {
                get: vi.fn(),
            },
        },
    },
}))

describe('BalanceAmount', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(oktoState.auth.isAuthenticated.get).mockReturnValue(false)
    })

    it('should show $0.00 when not authenticated', async () => {
        // Mock the authentication state
        vi.mocked(oktoState.auth.isAuthenticated.get).mockReturnValue(false)

        render(<BalanceAmount />)

        // Should show $0.00 when not authenticated
        expect(screen.getByTestId('balance-amount')).toBeInTheDocument()
        expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('should show loading skeleton when authenticated but loading', async () => {
        // Mock the authentication state
        vi.mocked(oktoState.auth.isAuthenticated.get).mockReturnValue(true)

        render(<BalanceAmount />)

        // Should show loading skeleton initially
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    })

    it('should use initial portfolio data from server-side rendering', async () => {
        // Mock the authentication state
        vi.mocked(oktoState.auth.isAuthenticated.get).mockReturnValue(true)

        // Create initial portfolio data
        const initialPortfolio: OktoPortfolioData = {
            aggregated_data: {
                holdings_count: '10',
                holdings_price_inr: '500000.00',
                holdings_price_usdt: '6000.00',
                total_holding_price_inr: '500000.00',
                total_holding_price_usdt: '5678.90',
            },
            group_tokens: [{ symbol: 'BTC' } as OktoTokenGroup],
            lastUpdated: Date.now(),
        }

        render(<BalanceAmount initialPortfolio={initialPortfolio} />)

        // Should use the initial portfolio data without loading
        await waitFor(() => {
            expect(screen.getByTestId('balance-amount')).toBeInTheDocument()
            expect(screen.getByText('$5,678.90')).toBeInTheDocument()
        })
    })
})
