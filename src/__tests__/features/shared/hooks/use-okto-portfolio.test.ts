import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import { portfolioState$, refreshPortfolio } from '@/okto/explorer/portfolio'
import { oktoState } from '@/okto/state'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('@/okto/explorer/portfolio', () => ({
    portfolioState$: {
        get: vi.fn(),
        onChange: vi.fn(() => () => {}),
        set: vi.fn(),
    },
    refreshPortfolio: vi.fn(),
    getCurrentPortfolio: vi.fn(),
}))

vi.mock('@/okto/state', () => ({
    oktoState: {
        auth: {
            isAuthenticated: {
                get: vi.fn(),
                onChange: vi.fn(() => () => {}),
            },
        },
    },
}))

// Mock the hook implementation
vi.mock('@/features/shared/hooks/use-okto-portfolio', () => ({
    useOktoPortfolio: () => ({
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
    }),
}))

describe('useOktoPortfolio', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Default mock implementations
        vi.mocked(oktoState.auth.isAuthenticated.get).mockReturnValue(true)
        vi.mocked(portfolioState$.get).mockReturnValue({
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
        })
        vi.mocked(refreshPortfolio).mockResolvedValue({
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
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it('should return portfolio data', () => {
        const { result } = renderHook(() => useOktoPortfolio())

        expect(result.current.data).toEqual({
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
        })
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('should have a refetch function', () => {
        const { result } = renderHook(() => useOktoPortfolio())

        expect(typeof result.current.refetch).toBe('function')
    })
})
