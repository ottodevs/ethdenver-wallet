import { PortfolioDisplay } from '@/features/shared/components/PortfolioDisplay'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock the hook
vi.mock('@/features/shared/hooks/use-okto-portfolio', () => ({
    useOktoPortfolio: vi.fn(),
}))

describe('PortfolioDisplay', () => {
    it('should render loading state', () => {
        vi.mocked(useOktoPortfolio).mockReturnValue({
            data: {
                aggregated_data: {
                    holdings_count: '0',
                    holdings_price_inr: '0.00',
                    holdings_price_usdt: '0.00',
                    total_holding_price_inr: '0.00',
                    total_holding_price_usdt: '0.00',
                },
                group_tokens: [],
            },
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        })

        render(<PortfolioDisplay />)

        expect(screen.getByTestId('portfolio-loading')).toBeInTheDocument()
    })

    it('should render error state', () => {
        vi.mocked(useOktoPortfolio).mockReturnValue({
            data: {
                aggregated_data: {
                    holdings_count: '0',
                    holdings_price_inr: '0.00',
                    holdings_price_usdt: '0.00',
                    total_holding_price_inr: '0.00',
                    total_holding_price_usdt: '0.00',
                },
                group_tokens: [],
            },
            isLoading: false,
            error: new Error('Failed to load portfolio'),
            refetch: vi.fn(),
        })

        render(<PortfolioDisplay />)

        expect(screen.getByTestId('portfolio-error')).toBeInTheDocument()
        expect(screen.getByText(/Failed to load portfolio/i)).toBeInTheDocument()
    })

    it('should render portfolio data', () => {
        vi.mocked(useOktoPortfolio).mockReturnValue({
            data: {
                aggregated_data: {
                    holdings_count: '5',
                    holdings_price_inr: '100000.00',
                    holdings_price_usdt: '1200.00',
                    total_holding_price_inr: '100000.00',
                    total_holding_price_usdt: '1200.00',
                },
                group_tokens: [
                    {
                        id: 'token1',
                        name: 'Ethereum',
                        symbol: 'ETH',
                        short_name: 'ETH',
                        token_image: 'eth.png',
                        token_address: '0x123',
                        network_id: 'ethereum',
                        precision: '18',
                        network_name: 'Ethereum',
                        is_primary: true,
                        balance: '0.5',
                        holdings_price_usdt: '1000.00',
                        holdings_price_inr: '83000.00',
                    },
                ],
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        })

        render(<PortfolioDisplay />)

        expect(screen.getByTestId('portfolio-data')).toBeInTheDocument()
        expect(screen.getByText('Ethereum')).toBeInTheDocument()
        expect(screen.getByText('ETH')).toBeInTheDocument()
        expect(screen.getByText('0.5')).toBeInTheDocument()
        expect(screen.getByText('$1000.00')).toBeInTheDocument()
    })

    it('should render empty state when no tokens', () => {
        vi.mocked(useOktoPortfolio).mockReturnValue({
            data: {
                aggregated_data: {
                    holdings_count: '0',
                    holdings_price_inr: '0.00',
                    holdings_price_usdt: '0.00',
                    total_holding_price_inr: '0.00',
                    total_holding_price_usdt: '0.00',
                },
                group_tokens: [],
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        })

        render(<PortfolioDisplay />)

        expect(screen.getByTestId('portfolio-empty')).toBeInTheDocument()
        expect(screen.getByText(/No tokens found/i)).toBeInTheDocument()
    })

    it('should call refetch when refresh button is clicked', () => {
        const mockRefetch = vi.fn()
        vi.mocked(useOktoPortfolio).mockReturnValue({
            data: {
                aggregated_data: {
                    holdings_count: '5',
                    holdings_price_inr: '100000.00',
                    holdings_price_usdt: '1200.00',
                    total_holding_price_inr: '100000.00',
                    total_holding_price_usdt: '1200.00',
                },
                group_tokens: [
                    {
                        id: 'token1',
                        name: 'Ethereum',
                        symbol: 'ETH',
                        short_name: 'ETH',
                        token_image: 'eth.png',
                        token_address: '0x123',
                        network_id: 'ethereum',
                        precision: '18',
                        network_name: 'Ethereum',
                        is_primary: true,
                        balance: '0.5',
                        holdings_price_usdt: '1000.00',
                        holdings_price_inr: '83000.00',
                    },
                ],
            },
            isLoading: false,
            error: null,
            refetch: mockRefetch,
        })

        render(<PortfolioDisplay />)

        const refreshButton = screen.getByTestId('portfolio-refresh')
        fireEvent.click(refreshButton)

        expect(mockRefetch).toHaveBeenCalled()
    })
})
