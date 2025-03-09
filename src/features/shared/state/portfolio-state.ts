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

// Create the observable with initial state
export const portfolioState$ = observable<PortfolioState>({
    tokens: [],
    totalBalanceUsd: 0,
    isLoading: false,
    error: null,
    lastUpdated: 0,
})

// Configure local persistence
syncObservable(portfolioState$, {
    persist: {
        name: 'okto-portfolio',
        plugin: ObservablePersistLocalStorage,
    },
})

// Synchronization state to check if data is loaded
export const portfolioSyncState$ = syncState(portfolioState$)

// Function to sync the portfolio
export async function syncPortfolio(oktoClient: OktoClient, forceRefresh = false) {
    const now = Date.now()
    const lastUpdated = portfolioState$.lastUpdated.get()
    const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

    // If not forced and data is recent, do not update
    if (!forceRefresh && lastUpdated && now - lastUpdated < CACHE_DURATION) {
        console.log('[syncPortfolio] Using cached data:', {
            cacheAge: now - lastUpdated,
            tokenCount: portfolioState$.tokens.length,
        })
        return
    }

    // Mark as loading only if there are no previous data
    if (portfolioState$.tokens.length === 0) {
        portfolioState$.isLoading.set(true)
    }

    try {
        console.log('[syncPortfolio] Fetching portfolio data...')
        const portfolioData = await getPortfolio(oktoClient)

        if (portfolioData && portfolioData.groupTokens) {
            // Transform the token data
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

            // Update the state in a batch to avoid multiple renders
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

// Function to clear the state
export function clearPortfolioState() {
    batch(() => {
        portfolioState$.tokens.set([])
        portfolioState$.totalBalanceUsd.set(0)
        portfolioState$.isLoading.set(false)
        portfolioState$.error.set(null)
        portfolioState$.lastUpdated.set(0)
    })
}
