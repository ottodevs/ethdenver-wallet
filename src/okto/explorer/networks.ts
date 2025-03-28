import { isAuthenticated } from '../authenticate'
import { createAuthenticatedFetcher } from '../utils/fetcher'

export interface OktoNetwork {
    caip_id: string
    network_name: string
    logo: string
    chain_id: number
    native_token: {
        name: string
        symbol: string
        decimals: number
    }
}

export interface NetworksState {
    networks: OktoNetwork[]
    loading: boolean
    error: string | null
    lastUpdated: number | null
}

// Initial state
const initialState: NetworksState = {
    networks: [],
    loading: false,
    error: null,
    lastUpdated: null,
}

// BehaviorSubject to keep the state
// We use a simple implementation instead of rxjs to avoid additional dependencies
class SimpleSubject<T> {
    private value: T
    private listeners: ((value: T) => void)[] = []

    constructor(initialValue: T) {
        this.value = initialValue

        // Add properties for easier access in tests
        if (typeof initialValue === 'object' && initialValue !== null) {
            // For NetworksState, add properties for direct access
            Object.keys(initialValue).forEach(key => {
                Object.defineProperty(this, key, {
                    get: () => ({
                        get: () => (this.value as Record<string, unknown>)[key],
                        set: (newValue: unknown) => {
                            this.next({ ...(this.value as Record<string, unknown>), [key]: newValue } as T)
                        },
                    }),
                })
            })
        }
    }

    getValue(): T {
        return this.value
    }

    next(newValue: T): void {
        this.value = newValue
        this.listeners.forEach(listener => listener(newValue))
    }

    subscribe(listener: (value: T) => void): { unsubscribe: () => void } {
        this.listeners.push(listener)
        return {
            unsubscribe: () => {
                const index = this.listeners.indexOf(listener)
                if (index !== -1) {
                    this.listeners.splice(index, 1)
                }
            },
        }
    }

    asObservable(): { subscribe: (listener: (value: T) => void) => { unsubscribe: () => void } } {
        return {
            subscribe: (listener: (value: T) => void) => this.subscribe(listener),
        }
    }
}

export const networksState$ = new SimpleSubject<NetworksState>(initialState)

// Function to register messages
const logger = {
    debug: (message: string, ...args: unknown[]) => console.debug(`[networks] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => console.info(`[networks] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[networks] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[networks] ${message}`, ...args),
}

/**
 * Gets the supported networks by Okto
 */
export const fetchNetworks = async (force = false): Promise<OktoNetwork[]> => {
    // If the user is not authenticated, return an empty array
    if (!isAuthenticated()) {
        logger.warn('User not authenticated')
        return []
    }

    const currentState = networksState$.getValue()

    // If we already have data and we don't force the update, return the existing data
    if (
        currentState.networks.length > 0 &&
        !force &&
        currentState.lastUpdated &&
        Date.now() - currentState.lastUpdated < 5 * 60 * 1000 // 5 minutes
    ) {
        logger.debug('Using cached networks data')
        return currentState.networks
    }

    // Update state to loading
    networksState$.next({
        ...currentState,
        loading: true,
        error: null,
    })

    try {
        const fetchWithAuthPromise = await createAuthenticatedFetcher()

        if (!fetchWithAuthPromise) {
            throw new Error('Failed to create authenticated fetcher')
        }

        // Fix the duplicated URL
        const response = await fetchWithAuthPromise('/supported/networks')

        if (!response || !response.data) {
            throw new Error('Invalid response from API')
        }

        // Ensure networks is always an array
        const networks = Array.isArray(response.data) ? response.data : []

        if (!Array.isArray(response.data)) {
            logger.warn('API returned non-array data for networks:', response.data)
        }

        // Update state with the obtained data
        networksState$.next({
            networks,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
        })

        return networks
    } catch (error) {
        logger.error('Error fetching networks:', error)

        // Update state with the error
        networksState$.next({
            ...currentState,
            loading: false,
            error: error instanceof Error ? error.message : String(error),
        })

        return currentState.networks
    }
}

/**
 * Forces an update of the networks
 */
export const refreshNetworks = async (): Promise<OktoNetwork[]> => {
    return fetchNetworks(true)
}

/**
 * Observable that emits the current state of the networks
 */
export const getNetworksState = () => {
    return networksState$.asObservable()
}

/**
 * Gets the network by its CAIP ID
 */
export const getNetworkByCaipId = (caipId: string): OktoNetwork | undefined => {
    const { networks } = networksState$.getValue()
    return networks.find(network => network.caip_id === caipId)
}

/**
 * Gets the network by its Chain ID
 */
export const getNetworkByChainId = (chainId: number): OktoNetwork | undefined => {
    const { networks } = networksState$.getValue()
    return networks.find(network => network.chain_id === chainId)
}

/**
 * Gets the CAIP ID for a specific chain
 */
export const getCaip2IdForChain = (chainId: number | string): string | undefined => {
    // Convert chainId to number if it's a string
    const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId) : chainId

    const network = getNetworkByChainId(chainIdNumber)
    if (network) {
        return network.caip_id
    }

    // Fallback for common chains
    const fallbackCaip2Ids: Record<number, string> = {
        1: 'eip155:1', // Ethereum
        137: 'eip155:137', // Polygon
        42161: 'eip155:42161', // Arbitrum
        10: 'eip155:10', // Optimism
        8453: 'eip155:8453', // Base
    }

    return fallbackCaip2Ids[chainIdNumber]
}
