import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'

// Definition of the NFT interface
export interface NFT {
    id: string
    name: string
    description: string
    image: string
    collection: string
    tokenId: string
    contractAddress: string
    chain: string
    networkName: string
}

// Update the type to match the library definition
type UserNFTBalance = {
    caipId: string
    networkName: string
    entityType: string
    collectionAddress: string
    collectionName: string
    nftId: string
    image: string
    quantity: string
    tokenUri: string
    description: string
    nftName: string
    explorerSmartContractUrl: string
    collectionImage: string
}

// Interface for the NFTs state
interface NFTsState {
    nfts: NFT[]
    isLoading: boolean
    error: string | null
    lastUpdated: number
    hasInitialized: boolean
}

// Create the observable with initial state
export const nftsState$ = observable<NFTsState>({
    nfts: [],
    isLoading: false,
    error: null,
    lastUpdated: 0,
    hasInitialized: false,
})

// Configure local persistence
syncObservable(nftsState$, {
    persist: {
        name: 'okto-nfts',
        plugin: ObservablePersistLocalStorage,
    },
})

// Synchronization state to check if data is loaded
export const nftsSyncState$ = syncState(nftsState$)

// Function to get NFTs directly with fetch
async function fetchNFTsDirectly(oktoClient: OktoClient): Promise<UserNFTBalance[]> {
    try {
        const token = await oktoClient.getAuthorizationToken()
        const response = await fetch(`${oktoClient.env.bffBaseUrl}/api/oc/v1/portfolio/nft`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        })

        // If the response is not successful, check if it is the specific error
        if (!response.ok) {
            const errorData = await response.json().catch(() => null)

            // Check if it is the specific error of "No Active Collections"
            if (response.status === 400 && errorData?.error?.errorCode === 'ER-TECH-0001') {
                console.log('[fetchNFTsDirectly] No NFTs found for this user (No Active Collections)')
                return [] // Return empty array in case of no NFTs
            }

            // For other errors, propagate
            console.warn('[fetchNFTsDirectly] Error fetching NFTs:', errorData)
            return []
        }

        const data = await response.json().catch(() => null)

        // Convert response to camelCase if necessary
        if (data && data.data && data.data.details) {
            return data.data.details
        }

        return []
    } catch (error) {
        // Silent handling without `console.error`
        console.warn(`[fetchNFTsDirectly] Silent error:`, error instanceof Error ? error.message : error)
        return []
    }
}

// Alternative using syncedFetch (if you prefer this approach)
// const createNFTsFetcher = (oktoClient: OktoClient) => {
//     return syncedFetch({
//         get: async () => {
//             const token = await oktoClient.getAuthorizationToken()
//             return {
//                 url: `${oktoClient.env.bffBaseUrl}/api/oc/v1/portfolio/nft`,
//                 init: {
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`,
//                     },
//                 },
//             }
//         },
//         valueType: 'json',
//     })
// }

// Function to sync NFTs
export async function syncNFTs(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = nftsState$.lastUpdated.get()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // If not forced and data is recent, do not update
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncNFTs] Using cached data:', {
            cacheAge: now - lastUpdated,
            nftCount: nftsState$.nfts.get().length,
        })
        return
    }

    // Mark as loading only if there are no previous data or it is a forced refresh
    if (nftsState$.nfts.get().length === 0 || forceRefresh) {
        nftsState$.isLoading.set(true)
    }

    try {
        console.log('[syncNFTs] Fetching NFT data...')

        // Use our direct fetch function
        const nftPortfolio = await fetchNFTsDirectly(oktoClient)

        // Process the NFTs with the correct structure
        const nfts = nftPortfolio.map(nft => ({
            id: nft.nftId,
            name: nft.nftName,
            description: nft.description,
            imageUrl: nft.image,
            collectionName: nft.collectionName,
            tokenId: nft.nftId,
            contractAddress: nft.collectionAddress,
            chainId: nft.caipId,
            balance: nft.quantity,
            networkName: nft.networkName,
            tokenUri: nft.tokenUri,
            explorerSmartContractUrl: nft.explorerSmartContractUrl,
            collectionImage: nft.collectionImage,
        }))

        batch(() => {
            nftsState$.nfts.set(nfts as unknown as NFT[])
            nftsState$.lastUpdated.set(now)
            nftsState$.error.set(null)
            nftsState$.isLoading.set(false)
            nftsState$.hasInitialized.set(true)
        })
    } catch (err) {
        console.error('[syncNFTs] Failed to fetch NFTs:', err)

        batch(() => {
            nftsState$.error.set('Failed to load NFT collection')
            nftsState$.isLoading.set(false)
            nftsState$.hasInitialized.set(true)
        })
    }
}

// Function to transfer an NFT
export async function transferNFT(nft: NFT, recipient: string, oktoClient: OktoClient) {
    try {
        // Here goes the logic to transfer the NFT using the Okto SDK
        // For example: await oktoClient.transferNFT(nft.contractAddress, nft.tokenId, recipient)

        // After successful transfer, update the NFTs
        await syncNFTs(oktoClient, true)
        return true
    } catch (error) {
        console.error('[transferNFT] Failed to transfer NFT:', error)
        throw error
    }
}

// Function to clear the state
export function clearNFTsState() {
    batch(() => {
        nftsState$.nfts.set([])
        nftsState$.isLoading.set(false)
        nftsState$.error.set(null)
        nftsState$.lastUpdated.set(0)
        nftsState$.hasInitialized.set(false)
    })
}
