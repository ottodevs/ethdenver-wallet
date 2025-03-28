import { isAuthenticated } from '@/okto/authenticate'
import { portfolioState$, refreshPortfolio } from '@/okto/explorer/portfolio'
import type { OktoPortfolioData } from '@/types/okto'

/**
 * Portfolio Service
 * Handles all portfolio-related operations and data fetching
 */
export class PortfolioService {
    private static lastRefreshTimestamp: number | null = null
    private static DEBOUNCE_TIME = 500 // Reduced from 2000ms to 500ms for faster loading after login
    private static cachedPortfolioData: OktoPortfolioData | undefined = undefined

    /**
     * Load portfolio data with debouncing to prevent multiple simultaneous calls
     * @param forceRefresh Whether to force a refresh of the data
     */
    static async loadPortfolioData(forceRefresh = false): Promise<OktoPortfolioData | null> {
        // Don't attempt to load if not authenticated
        if (!isAuthenticated()) {
            console.log('💼 [portfolio-service] Not authenticated, skipping portfolio load')
            return null
        }

        // Implement debouncing to prevent multiple simultaneous calls
        const now = Date.now()
        if (this.lastRefreshTimestamp && now - this.lastRefreshTimestamp < this.DEBOUNCE_TIME && !forceRefresh) {
            console.log('💼 [portfolio-service] Debouncing portfolio load request')
            return (this.getPortfolioData() as OktoPortfolioData) || null
        }

        // Update timestamp
        this.lastRefreshTimestamp = now

        try {
            console.log('💼 [portfolio-service] Loading portfolio data', forceRefresh ? '(forced)' : '')
            const result = await refreshPortfolio(forceRefresh)

            if (result) {
                console.log(
                    '💼 [portfolio-service] Portfolio loaded successfully:',
                    result.aggregated_data ? 'has aggregated data' : 'no aggregated data',
                    result.group_tokens ? `has ${result.group_tokens.length} tokens` : 'no tokens',
                )

                // Update the portfolio state with a timestamp
                const portfolioWithTimestamp = {
                    ...result,
                    lastUpdated: Date.now(),
                }

                // Update both the observable state and our cached copy
                if (typeof portfolioState$.set === 'function') {
                    portfolioState$.set(portfolioWithTimestamp)
                }

                this.cachedPortfolioData = portfolioWithTimestamp

                return result
            } else {
                console.log('💼 [portfolio-service] No portfolio data returned')
                return null
            }
        } catch (error) {
            console.error('💼 [portfolio-service] Error loading portfolio:', error)
            return null
        }
    }

    /**
     * Set portfolio data directly
     * @param data The portfolio data to set
     */
    static setPortfolioData(data: OktoPortfolioData): void {
        if (!data) return

        try {
            console.log('💼 [portfolio-service] Setting portfolio data directly')

            // Ensure the data has a lastUpdated timestamp
            const portfolioWithTimestamp = {
                ...data,
                lastUpdated: data.lastUpdated || Date.now(),
            }

            // Update both the observable state and our cached copy
            if (typeof portfolioState$.set === 'function') {
                portfolioState$.set(portfolioWithTimestamp)
                this.lastRefreshTimestamp = Date.now()
                this.cachedPortfolioData = portfolioWithTimestamp
                console.log('💼 [portfolio-service] Portfolio data set successfully')
            } else {
                console.error('💼 [portfolio-service] Cannot set portfolio data: portfolioState$.set is not a function')
            }
        } catch (error) {
            console.error('💼 [portfolio-service] Error setting portfolio data:', error)
        }
    }

    /**
     * Check if the portfolio data is valid
     * @param portfolio The portfolio data to check
     */
    static isValidPortfolioData(portfolio?: OktoPortfolioData): boolean {
        return !!(portfolio && portfolio.aggregated_data && portfolio.group_tokens && portfolio.group_tokens.length > 0)
    }

    /**
     * Check if the portfolio data needs to be refreshed
     * @param portfolio The portfolio data to check
     * @param maxAge The maximum age of the data in milliseconds (default: 5 minutes)
     */
    static needsRefresh(portfolio?: OktoPortfolioData, maxAge = 5 * 60 * 1000): boolean {
        return !!(!portfolio || !portfolio.lastUpdated || Date.now() - portfolio.lastUpdated > maxAge)
    }

    /**
     * Get the current portfolio data
     */
    static getPortfolioData(): OktoPortfolioData | undefined {
        try {
            // First try to get from the observable state
            if (portfolioState$ && typeof portfolioState$.get === 'function') {
                const stateData = portfolioState$.get() as OktoPortfolioData | undefined
                if (stateData && stateData.aggregated_data) {
                    return stateData
                }
            }

            // Fallback to our cached copy
            return this.cachedPortfolioData
        } catch (error) {
            console.error('💼 [portfolio-service] Error getting portfolio data:', error)
            return this.cachedPortfolioData
        }
    }
}
