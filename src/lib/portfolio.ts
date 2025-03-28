import type { OktoPortfolioData } from '@/types/okto'
import { cookies } from 'next/headers'

/**
 * Fetches portfolio data from the Okto API
 * This function is designed to be used in server components
 */
export async function getPortfolioData(): Promise<OktoPortfolioData | null> {
    return new Promise(async resolve => {
        try {
            // Get cookies immediately to maintain the async context
            const cookieStore = await cookies()
            const authToken = cookieStore.get('okto_auth_token')?.value

            // If no auth token, resolve with null
            if (!authToken) {
                console.log('No auth token found in cookies, returning null')
                resolve(null)
                return
            }

            // Fetch portfolio data from the Okto API
            const response = await fetch('https://sandbox-api.okto.tech/api/oc/v1/portfolio', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store', // Ensure dynamic data fetching
            })

            // If response is not ok, resolve with null
            if (!response.ok) {
                console.error('Failed to fetch portfolio data:', response.statusText)
                resolve(null)
                return
            }

            // Parse the response
            const data = await response.json()

            // Resolve with the portfolio data and timestamp
            resolve({
                ...data.data,
                lastUpdated: Date.now(),
            })
        } catch (error) {
            console.error('Error fetching portfolio data:', error)
            resolve(null)
        }
    })
}
