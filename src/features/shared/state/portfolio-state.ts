import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'
import { getPortfolio } from '@okto_web3/react-sdk'

export interface TokenBalance {
    id: string
    name: string
    symbol: string
    icon: string
    chain: string
    balance: number
    valueUsd: number
    contractAddress?: string
    isNative?: boolean
}

interface PortfolioState {
    tokens: TokenBalance[]
    totalBalanceUsd: number
    isLoading: boolean
    error: string | null
    lastUpdated: number
}

// Crear el observable con estado inicial
export const portfolioState$ = observable<PortfolioState>({
    tokens: [],
    totalBalanceUsd: 0,
    isLoading: false,
    error: null,
    lastUpdated: 0,
})

// Configurar la persistencia local
syncObservable(portfolioState$, {
    persist: {
        name: 'okto-portfolio',
        plugin: ObservablePersistLocalStorage,
    },
})

// Estado de sincronización para verificar si los datos están cargados
export const portfolioSyncState$ = syncState(portfolioState$)

// Función para sincronizar el portfolio
export async function syncPortfolio(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = portfolioState$.lastUpdated.get()
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

    // Si no es forzado y los datos son recientes, no actualizar
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncPortfolio] Using cached data:', {
            cacheAge: now - lastUpdated,
            tokenCount: portfolioState$.tokens.length,
        })
        return
    }

    // Marcar como cargando solo si no hay datos previos
    if (portfolioState$.tokens.length === 0) {
        portfolioState$.isLoading.set(true)
    }

    try {
        console.log('[syncPortfolio] Fetching portfolio data...')
        const portfolioData = await getPortfolio(oktoClient)

        if (portfolioData && portfolioData.groupTokens) {
            // Transformar los datos de tokens
            const formattedTokens: TokenBalance[] = portfolioData.groupTokens.map(group => ({
                id: `${group.networkName}-${group.symbol}`,
                name: group.name || group.symbol,
                symbol: group.symbol,
                icon: group.tokenImage || `/token-icons/${group.symbol.toLowerCase()}.svg`,
                chain: group.networkName.toLowerCase(),
                balance: parseFloat(group.balance),
                valueUsd: parseFloat(group.holdingsPriceUsdt),
                contractAddress: group.tokenAddress || '',
                isNative: !group.tokenAddress || group.tokenAddress === '',
            }))

            const totalUsd = parseFloat(portfolioData.aggregatedData.totalHoldingPriceUsdt)

            // Actualizar el estado en un batch para evitar múltiples renders
            batch(() => {
                portfolioState$.tokens.set(formattedTokens)
                portfolioState$.totalBalanceUsd.set(totalUsd)
                portfolioState$.lastUpdated.set(now)
                portfolioState$.error.set(null)
                portfolioState$.isLoading.set(false)
            })

            console.log('[syncPortfolio] Updated portfolio data:', {
                tokenCount: formattedTokens.length,
                totalUsd,
            })
        } else {
            batch(() => {
                portfolioState$.tokens.set([])
                portfolioState$.totalBalanceUsd.set(0)
                portfolioState$.lastUpdated.set(now)
                portfolioState$.error.set(null)
                portfolioState$.isLoading.set(false)
            })
        }
    } catch (err) {
        console.error('[syncPortfolio] Failed to fetch portfolio:', err)
        portfolioState$.error.set('Failed to load portfolio data')
        portfolioState$.isLoading.set(false)
    }
}

// Función para limpiar el estado
export function clearPortfolioState() {
    batch(() => {
        portfolioState$.tokens.set([])
        portfolioState$.totalBalanceUsd.set(0)
        portfolioState$.isLoading.set(false)
        portfolioState$.error.set(null)
        portfolioState$.lastUpdated.set(0)
    })
}
