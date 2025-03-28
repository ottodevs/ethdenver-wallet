import { oktoState } from './state'

/**
 * Checks if the user is authenticated with Okto
 * @returns boolean indicating authentication status
 */
export function isAuthenticated(): boolean {
    return oktoState.auth.isAuthenticated.get()
}

/**
 * Creates an authenticated fetcher function for making API calls
 * @param endpoint The API endpoint to call
 * @returns A function that makes authenticated API calls
 */
export function createAuthenticatedFetcher(endpoint: string) {
    return async <T>(): Promise<T> => {
        // Implementation would include authentication headers
        // and proper error handling
        const session = oktoState.auth.session.get()
        const token = session?.idToken || ''

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`)
        }

        return response.json()
    }
}
