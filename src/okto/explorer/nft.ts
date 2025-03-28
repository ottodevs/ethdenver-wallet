import { observable } from '@legendapp/state'
import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query'
import { QueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '../authenticate'
import { createAuthenticatedFetcher } from '../utils/fetcher'

// Create a query client instance if it doesn't exist
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30000, // 30 seconds
            refetchOnWindowFocus: true,
        },
    },
})

// NFT interface based on Okto API documentation
export interface OktoNft {
    caip_id: string
    network_name: string
    entity_type: string
    collection_address: string
    collection_name: string
    nft_id: string
    image: string
    quantity: string
    token_uri: string
    description: string
    nft_name: string
    explorer_smart_contract_url: string
    collection_image: string
}

// NFT portfolio data interface
export interface OktoNftPortfolioData {
    count: number
    details: OktoNft[]
}

// Default NFT portfolio data with empty values
const DEFAULT_NFT_PORTFOLIO_DATA: OktoNftPortfolioData = {
    count: 0,
    details: [],
}

/**
 * Fetches NFT portfolio data for the authenticated user
 */
export async function fetchNftPortfolio(): Promise<OktoNftPortfolioData | null> {
    try {
        console.log('🖼️ [okto-nft] Fetching NFT portfolio data...')

        // Check if user is authenticated
        if (!isAuthenticated()) {
            console.log('🖼️ [okto-nft] User not authenticated, skipping NFT portfolio fetch')
            return null
        }

        // Create an authenticated fetcher
        const fetchWithAuth = await createAuthenticatedFetcher()
        if (!fetchWithAuth) {
            console.log('🖼️ [okto-nft] Failed to create authenticated fetcher')
            return null
        }

        // Use the fetcher to make the API call to the NFT portfolio endpoint
        console.log('🖼️ [okto-nft] Fetching NFT portfolio data from API...')
        try {
            const response = await fetchWithAuth('/portfolio/nft')
            console.log('🖼️ [okto-nft] NFT Portfolio API response status:', response?.status)

            // Check for the special case of no active collections
            if (response && response.data && response.data._specialCase === 'NO_ACTIVE_COLLECTIONS') {
                console.log('🖼️ [okto-nft] No active collections found, returning empty portfolio')
                return DEFAULT_NFT_PORTFOLIO_DATA
            }

            // Check if response has the expected structure
            if (!response || !response.data || !response.data.details) {
                console.log('🖼️ [okto-nft] Invalid NFT portfolio response structure:', response)
                return null
            }

            // Extract the data from the response
            const nftPortfolioData = response.data as OktoNftPortfolioData

            console.log('🖼️ [okto-nft] Processed NFT portfolio data:', {
                count: nftPortfolioData.count,
                nfts: nftPortfolioData.details.length,
            })

            return nftPortfolioData
        } catch (apiError) {
            // Check if this is the "No Active Collections Found" error
            const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
            if (errorMessage.includes('No Active Collections Found')) {
                console.log('🖼️ [okto-nft] No active collections found, returning empty portfolio')
                // Return empty portfolio data instead of null
                return DEFAULT_NFT_PORTFOLIO_DATA
            }

            // Re-throw other errors
            throw apiError
        }
    } catch (error) {
        console.error('🖼️ [okto-nft] Error fetching NFT portfolio:', error)
        throw error
    }
}

/**
 * Observable state for NFT portfolio using Legend App State with Tanstack Query
 */
export const nftPortfolioState$ = observable(
    syncedQuery({
        queryClient,
        query: {
            queryKey: ['okto-nft-portfolio'],
            queryFn: fetchNftPortfolio,
            enabled: isAuthenticated(),
            staleTime: 30000, // 30 seconds
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
    }),
)

/**
 * Get current NFT portfolio data without observation
 */
export function getCurrentNftPortfolio(): OktoNftPortfolioData {
    const nftPortfolio = nftPortfolioState$.get()
    console.log('🖼️ [okto-nft] getCurrentNftPortfolio:', nftPortfolio ? 'has data' : 'no data')
    return nftPortfolio || DEFAULT_NFT_PORTFOLIO_DATA
}

/**
 * Manually refresh NFT portfolio data
 */
export function refreshNftPortfolio() {
    // Check if authenticated before proceeding
    if (!isAuthenticated()) {
        console.log('🖼️ [okto-nft] refreshNftPortfolio: Not authenticated, skipping')
        return Promise.resolve(null)
    }

    console.log('🖼️ [okto-nft] refreshNftPortfolio: Starting refresh')

    // Invalidate the query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['okto-nft-portfolio'] })

    // Also directly fetch NFT portfolio to ensure immediate update
    return fetchNftPortfolio()
        .then(data => {
            console.log('🖼️ [okto-nft] refreshNftPortfolio: Refresh completed', data ? 'with data' : 'without data')
            if (data) {
                console.log('🖼️ [okto-nft] Total NFTs:', data.count)
            }
            return data
        })
        .catch(error => {
            console.error('🖼️ [okto-nft] refreshNftPortfolio: Error during refresh', error)
            return null
        })
}
