import * as authenticateModule from '@/okto/authenticate'
import { fetchNetworks, networksState$, refreshNetworks } from '@/okto/explorer/networks'
import * as fetcherModule from '@/okto/utils/fetcher'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the dependencies
vi.mock('@/okto/authenticate', () => ({
    isAuthenticated: vi.fn(),
}))

vi.mock('@/okto/utils/fetcher', () => ({
    createAuthenticatedFetcher: vi.fn(),
}))

describe('Okto Networks Explorer', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        // Reset the state using the next method
        networksState$.next({
            networks: [],
            loading: false,
            error: null,
            lastUpdated: null,
        })
    })

    it('should return empty array when user is not authenticated', async () => {
        // Mock isAuthenticated to return false
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(false)

        const result = await fetchNetworks()

        expect(result).toEqual([])
        expect(networksState$.getValue().networks).toEqual([])
        expect(networksState$.getValue().loading).toBe(false)
        expect(networksState$.getValue().error).toBe(null)
    })

    it('should fetch networks successfully', async () => {
        // Mock isAuthenticated to return true
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Mock the fetcher
        const mockFetcher = vi.fn().mockResolvedValue({
            status: 'success',
            data: [
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
            ],
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetcher)

        const result = await fetchNetworks()

        expect(mockFetcher).toHaveBeenCalledWith('/supported/networks')
        expect(result).toHaveLength(2)
        expect(result[0].network_name).toBe('Ethereum')
        expect(result[1].network_name).toBe('Polygon')
        expect(networksState$.getValue().networks).toEqual(result)
        expect(networksState$.getValue().loading).toBe(false)
        expect(networksState$.getValue().error).toBe(null)
        expect(networksState$.getValue().lastUpdated).toBeDefined()
    })

    it('should handle fetch error', async () => {
        // Mock isAuthenticated to return true
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Mock the fetcher to throw an error
        const mockError = new Error('Network error')
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockRejectedValue(mockError)

        const result = await fetchNetworks()

        expect(result).toEqual([])
        expect(networksState$.getValue().networks).toEqual([])
        expect(networksState$.getValue().loading).toBe(false)
        expect(networksState$.getValue().error).toBe('Network error')
    })

    it('should not refresh networks if data is fresh', async () => {
        // Mock isAuthenticated to return true
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Set up mock data
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

        // Set the state with fresh data
        networksState$.next({
            networks: mockNetworks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        // Mock the fetcher (should not be called)
        const mockFetcher = vi.fn()
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetcher)

        const result = await fetchNetworks(false)

        expect(mockFetcher).not.toHaveBeenCalled()
        expect(result).toEqual(mockNetworks)
    })

    it('should refresh networks if forced', async () => {
        // Mock isAuthenticated to return true
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Set up mock data
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

        // Set the state with fresh data
        networksState$.next({
            networks: mockNetworks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        // Mock the fetcher with new data
        const mockFetcher = vi.fn().mockResolvedValue({
            status: 'success',
            data: [
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
            ],
        })
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(mockFetcher)

        const result = await refreshNetworks()

        expect(mockFetcher).toHaveBeenCalledWith('/supported/networks')
        expect(result).toHaveLength(1)
        expect(result[0].network_name).toBe('Polygon')
    })
})
