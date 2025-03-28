import { getCaip2IdForChain, useChainService } from '@/features/shared/services/chain-service'
import * as networksModule from '@/okto/explorer/networks'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the networks module
vi.mock('@/okto/explorer/networks', () => ({
    networksState$: {
        getValue: vi.fn(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        next: vi.fn(),
    },
    fetchNetworks: vi.fn(),
    getCaip2IdForChain: vi.fn(),
}))

// Mock the Legend State hooks
vi.mock('@legendapp/state/react', () => ({
    useObservable: (state: { get: () => unknown }) => ({
        get: () => state.get(),
    }),
}))

describe('useChainService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('should transform networks into chains', () => {
        // Mock the networks state
        const mockNetworks = [
            {
                caip_id: 'eip155:1',
                network_name: 'Ethereum',
                chain_id: 1,
                logo: 'https://example.com/ethereum.svg',
                native_token: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                },
            },
            {
                caip_id: 'eip155:137',
                network_name: 'Polygon',
                chain_id: 137,
                logo: 'https://example.com/polygon.svg',
                native_token: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                },
            },
        ]

        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: mockNetworks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        vi.mocked(networksModule.fetchNetworks).mockResolvedValue(mockNetworks)

        const { result } = renderHook(() => useChainService())

        // Check if networks are transformed into chains
        expect(result.current.chains).toEqual([
            {
                id: 1,
                name: 'Ethereum',
                icon: 'https://example.com/ethereum.svg',
                caip2Id: 'eip155:1',
            },
            {
                id: 137,
                name: 'Polygon',
                icon: 'https://example.com/polygon.svg',
                caip2Id: 'eip155:137',
            },
        ])
    })

    it('should handle loading state', () => {
        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: [],
            loading: true,
            error: null,
            lastUpdated: null,
        })

        const { result } = renderHook(() => useChainService())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.chains).toEqual([])
    })

    it('should handle error state', () => {
        // Mock the error state
        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: [],
            loading: false,
            error: 'Network error',
            lastUpdated: null,
        })

        // Directly set the error in the hook
        vi.spyOn(networksModule.networksState$, 'subscribe').mockImplementation(callback => {
            callback({
                networks: [],
                loading: false,
                error: 'Network error',
                lastUpdated: null,
            })
            return { unsubscribe: vi.fn() }
        })

        // Render the hook with the mocked error state
        const { result } = renderHook(() => useChainService())

        // Verify the error is propagated
        expect(result.current.error).toBe('Network error')
        expect(result.current.chains).toEqual([])
    })

    it('should use getCaip2IdForChain from networks module', () => {
        // Mock the getCaip2IdForChain function
        vi.mocked(networksModule.getCaip2IdForChain).mockReturnValue('eip155:1')

        // Call the function directly
        const result = getCaip2IdForChain(1)

        // Check if the function was called with the correct parameter
        expect(networksModule.getCaip2IdForChain).toHaveBeenCalledWith(1)
        expect(result).toBe('eip155:1')
    })
})
