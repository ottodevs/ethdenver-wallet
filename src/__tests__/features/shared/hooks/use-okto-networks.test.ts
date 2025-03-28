import { useNetwork, useNetworkByCaipId, useOktoNetworks } from '@/features/shared/hooks/use-okto-networks'
import * as networksModule from '@/okto/explorer/networks'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the networks module
vi.mock('@/okto/explorer/networks', () => ({
    networksState$: {
        getValue: vi.fn(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    },
    fetchNetworks: vi.fn(),
    refreshNetworks: vi.fn(),
}))

// Mock the Legend State hooks
vi.mock('@legendapp/state/react', () => ({
    useObservable: (state: { get: () => unknown }) => ({
        get: () => state.get(),
    }),
}))

describe('useOktoNetworks', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('should return networks data', async () => {
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

        // Mock the initial state with empty networks to force fetchNetworks to be called
        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: [],
            loading: false,
            error: null,
            lastUpdated: null,
        })

        // Mock fetchNetworks to return the mock networks
        vi.mocked(networksModule.fetchNetworks).mockResolvedValue(mockNetworks)
        vi.mocked(networksModule.refreshNetworks).mockResolvedValue(mockNetworks)

        const { result } = renderHook(() => useOktoNetworks())

        // Force a call to fetchNetworks
        result.current.refetch()

        // Initial render should call fetchNetworks
        expect(networksModule.fetchNetworks).toHaveBeenCalled()

        // Wait for the hook to update
        await waitFor(() => {
            expect(result.current.networks).toEqual(mockNetworks)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBe(null)
            expect(result.current.hasInitialized).toBe(true)
            expect(result.current.lastUpdated).toBeDefined()
        })
    })

    it('should handle loading state', async () => {
        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: [],
            loading: true,
            error: null,
            lastUpdated: null,
        })

        const { result } = renderHook(() => useOktoNetworks())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.networks).toEqual([])
    })

    it('should handle error state', async () => {
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
        const { result } = renderHook(() => useOktoNetworks())

        // Verify the error is propagated
        expect(result.current.error).toBe('Network error')
        expect(result.current.networks).toEqual([])
    })
})

describe('useNetwork', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('should return a specific network by ID', async () => {
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

        const { result } = renderHook(() => useNetwork('1'))

        expect(result.current.network).toEqual(mockNetworks[0])
    })

    it('should return undefined if network ID is not found', async () => {
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
        ]

        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: mockNetworks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        const { result } = renderHook(() => useNetwork('unknown'))

        expect(result.current.network).toBeUndefined()
    })
})

describe('useNetworkByCaipId', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('should return a specific network by CAIP ID', async () => {
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

        const { result } = renderHook(() => useNetworkByCaipId('eip155:1'))

        expect(result.current.network).toEqual(mockNetworks[0])
    })

    it('should return undefined if CAIP ID is not found', async () => {
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
        ]

        vi.mocked(networksModule.networksState$.getValue).mockReturnValue({
            networks: mockNetworks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        const { result } = renderHook(() => useNetworkByCaipId('unknown'))

        expect(result.current.network).toBeUndefined()
    })
})
