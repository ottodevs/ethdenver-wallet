import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'

// Definición de la interfaz de NFT
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

// Actualizar el tipo para que coincida con la definición de la librería
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

// Interfaz para el estado de NFTs
interface NFTsState {
    nfts: NFT[]
    isLoading: boolean
    error: string | null
    lastUpdated: number
    hasInitialized: boolean
}

// Crear el observable con estado inicial
export const nftsState$ = observable<NFTsState>({
    nfts: [],
    isLoading: false,
    error: null,
    lastUpdated: 0,
    hasInitialized: false,
})

// Configurar la persistencia local
syncObservable(nftsState$, {
    persist: {
        name: 'okto-nfts',
        plugin: ObservablePersistLocalStorage,
    },
})

// Estado de sincronización para verificar si los datos están cargados
export const nftsSyncState$ = syncState(nftsState$)

// Función para obtener NFTs directamente con fetch
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

        // Si la respuesta no es exitosa, verificamos si es el error específico
        if (!response.ok) {
            const errorData = await response.json().catch(() => null)

            // Verificar si es el error específico de "No Active Collections"
            if (response.status === 400 && errorData?.error?.errorCode === 'ER-TECH-0001') {
                console.log('[fetchNFTsDirectly] No NFTs found for this user (No Active Collections)')
                return [] // Retornar array vacío en caso de no tener NFTs
            }

            // Para otros errores, propagamos
            console.warn('[fetchNFTsDirectly] Error fetching NFTs:', errorData)
            return []
        }

        const data = await response.json().catch(() => null)

        // Convertir respuesta a camelCase si es necesario
        if (data && data.data && data.data.details) {
            return data.data.details
        }

        return []
    } catch (error) {
        // Manejo silencioso sin `console.error`
        console.warn(`[fetchNFTsDirectly] Silent error:`, error instanceof Error ? error.message : error)
        return []
    }
}

// Alternativa usando syncedFetch (si prefieres este enfoque)
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

// Función para sincronizar los NFTs
export async function syncNFTs(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = nftsState$.lastUpdated.get()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // Si no es forzado y los datos son recientes, no actualizar
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncNFTs] Using cached data:', {
            cacheAge: now - lastUpdated,
            nftCount: nftsState$.nfts.get().length,
        })
        return
    }

    // Marcar como cargando solo si no hay datos previos o es una carga forzada
    if (nftsState$.nfts.get().length === 0 || forceRefresh) {
        nftsState$.isLoading.set(true)
    }

    try {
        console.log('[syncNFTs] Fetching NFT data...')

        // Usar nuestra función directa con fetch
        const nftPortfolio = await fetchNFTsDirectly(oktoClient)

        // Procesar los NFTs con la estructura correcta
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

// Función para transferir un NFT
export async function transferNFT(nft: NFT, recipient: string, oktoClient: OktoClient) {
    try {
        // Aquí iría la lógica para transferir el NFT usando el SDK de Okto
        // Por ejemplo: await oktoClient.transferNFT(nft.contractAddress, nft.tokenId, recipient)

        // Después de la transferencia exitosa, actualizamos los NFTs
        await syncNFTs(oktoClient, true)
        return true
    } catch (error) {
        console.error('[transferNFT] Failed to transfer NFT:', error)
        throw error
    }
}

// Función para limpiar el estado
export function clearNFTsState() {
    batch(() => {
        nftsState$.nfts.set([])
        nftsState$.isLoading.set(false)
        nftsState$.error.set(null)
        nftsState$.lastUpdated.set(0)
        nftsState$.hasInitialized.set(false)
    })
}
