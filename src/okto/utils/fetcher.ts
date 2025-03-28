import { isAuthenticated, logoutUser } from '../authenticate'
import { OKTO_API_URL, STORAGE_KEY_SESSION_PRIVATE, generateAuthorizationToken } from '../client'

/**
 * Creates an authenticated fetcher function for Okto API
 * @returns A function that can be used to make authenticated requests to Okto API
 */
export async function createAuthenticatedFetcher() {
    console.log('🔐 [okto-fetcher] Creating authenticated fetcher')
    try {
        // Check if user is authenticated first
        if (!isAuthenticated()) {
            console.error('🔐 [okto-fetcher] User not authenticated')
            return null
        }

        // Get session private key from localStorage
        const sessionPrivateKey = localStorage.getItem(STORAGE_KEY_SESSION_PRIVATE)
        if (!sessionPrivateKey) {
            console.error('🔐 [okto-fetcher] No session private key found in localStorage')
            return null
        }
        console.log('🔐 [okto-fetcher] Found session private key in localStorage')

        // Generate authorization token
        try {
            const authToken = await generateAuthorizationToken(sessionPrivateKey)
            console.log('🔐 [okto-fetcher] Generated authorization token successfully')

            // Return a function that can be used to make authenticated requests
            return async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
                // Verificar nuevamente si el usuario está autenticado antes de cada solicitud
                if (!isAuthenticated()) {
                    console.log(`🔐 [okto-fetcher] User not authenticated, skipping fetch to ${endpoint}`)
                    return null
                }

                // Ensure we're using the correct API URL from the client.ts file
                const url = `${OKTO_API_URL}${endpoint}`
                console.log(`🔐 [okto-fetcher] Fetching ${url}`)

                try {
                    // Silently handle 400 errors by using a custom fetch approach
                    // This prevents browser from logging network errors to console
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

                    const fetchPromise = fetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                        signal: controller.signal,
                    })

                    // Use this approach to avoid console errors for 400 responses
                    const response = await fetchPromise
                    clearTimeout(timeoutId)

                    // Read the response text
                    const responseText = await response.text()

                    // Special handling for "No Active Collections Found" error
                    if (!response.ok && responseText.includes('No Active Collections Found')) {
                        console.log('🔐 [okto-fetcher] No active collections found, handling gracefully')
                        // Return a special response object instead of throwing an error
                        return {
                            status: 'success',
                            data: {
                                count: 0,
                                details: [],
                                _specialCase: 'NO_ACTIVE_COLLECTIONS',
                            },
                        }
                    }

                    if (!response.ok) {
                        // Log other errors
                        console.error(`❌ [okto-fetcher] API error (${response.status}):`, responseText)

                        // Handle 401 Unauthorized errors (expired token)
                        if (response.status === 401) {
                            console.error('🔐 [okto-fetcher] Token expired, logging out user')
                            logoutUser()
                            return null
                        }

                        throw new Error(`API error: ${response.status} - ${responseText}`)
                    }

                    // Parse the response text as JSON
                    let data
                    try {
                        data = JSON.parse(responseText)
                    } catch (parseError: unknown) {
                        const errorMessage =
                            parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error'
                        console.error(`❌ [okto-fetcher] Error parsing JSON response:`, parseError)
                        throw new Error(`Error parsing API response: ${errorMessage}`)
                    }

                    console.log(`✅ [okto-fetcher] Response from ${endpoint}:`, data)
                    return data
                } catch (fetchError) {
                    console.error(`❌ [okto-fetcher] Fetch error for ${endpoint}:`, fetchError)

                    // Si el error es de tipo TypeError y contiene "Failed to fetch",
                    // probablemente sea porque el usuario ha cerrado sesión o hay problemas de red
                    if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                        console.log(`🔐 [okto-fetcher] Network error, checking authentication status`)
                        // Verificar si el usuario sigue autenticado
                        if (!isAuthenticated()) {
                            console.log(`🔐 [okto-fetcher] User not authenticated, ignoring fetch error`)
                            return null
                        }
                    }

                    throw fetchError
                }
            }
        } catch (tokenError) {
            console.error('❌ [okto-fetcher] Error generating authorization token:', tokenError)
            return null
        }
    } catch (error) {
        console.error('❌ [okto-fetcher] Error creating authenticated fetcher:', error)
        return null
    }
}
