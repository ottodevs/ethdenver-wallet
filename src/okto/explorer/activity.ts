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

// Activity interface based on Okto API documentation
export interface OktoActivity {
    symbol: string
    image: string
    name: string
    short_name: string
    id: string
    group_id: string
    description: string
    quantity: string
    amount: string
    order_type: string
    transfer_type: string
    status: boolean
    created_at: number
    updated_at: number
    timestamp: number
    tx_hash: string
    network_id: string
    network_name: string
    network_explorer_url: string
    network_symbol: string
    caip_id: string
}

// Activity data interface
export interface OktoActivityData {
    count: number
    activity: OktoActivity[]
}

// Default activity data with empty values
const DEFAULT_ACTIVITY_DATA: OktoActivityData = {
    count: 0,
    activity: [],
}

// Pagination parameters interface
export interface ActivityPaginationParams {
    page: number
    size: number
}

/**
 * Fetches portfolio activity data for the authenticated user
 */
export async function fetchActivity(
    params: ActivityPaginationParams = { page: 1, size: 10 },
): Promise<OktoActivityData | null> {
    try {
        console.log('📊 [okto-activity] Fetching activity data...', params)

        // Check if user is authenticated
        if (!isAuthenticated()) {
            console.log('📊 [okto-activity] User not authenticated, skipping activity fetch')
            return null
        }

        // Create an authenticated fetcher
        const fetchWithAuth = await createAuthenticatedFetcher()
        if (!fetchWithAuth) {
            console.log('📊 [okto-activity] Failed to create authenticated fetcher')
            return null
        }

        // Use the fetcher to make the API call to the activity endpoint with pagination
        console.log('📊 [okto-activity] Fetching activity data from API...')
        const response = await fetchWithAuth(`/portfolio/activity?page=${params.page}&size=${params.size}`)
        console.log('📊 [okto-activity] Activity API response status:', response?.status)

        // Check if response has the expected structure
        if (!response || !response.data || !response.data.activity) {
            console.log('📊 [okto-activity] Invalid activity response structure:', response)
            return null
        }

        // Extract the data from the response
        const activityData = response.data as OktoActivityData

        console.log('📊 [okto-activity] Processed activity data:', {
            count: activityData.count,
            activities: activityData.activity.length,
        })

        return activityData
    } catch (error) {
        console.error('📊 [okto-activity] Error fetching activity:', error)
        return null
    }
}

/**
 * Observable state for activity using Legend App State with Tanstack Query
 */
export const activityState$ = observable(
    syncedQuery({
        queryClient,
        query: {
            queryKey: ['okto-activity', { page: 1, size: 10 }],
            queryFn: () => fetchActivity({ page: 1, size: 10 }),
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
 * Get current activity data without observation
 */
export function getCurrentActivity(): OktoActivityData {
    const activity = activityState$.get()
    console.log('📊 [okto-activity] getCurrentActivity:', activity ? 'has data' : 'no data')
    return activity || DEFAULT_ACTIVITY_DATA
}

/**
 * Manually refresh activity data with pagination
 */
export function refreshActivity(params: ActivityPaginationParams = { page: 1, size: 10 }) {
    // Check if authenticated before proceeding
    if (!isAuthenticated()) {
        console.log('📊 [okto-activity] refreshActivity: Not authenticated, skipping')
        return Promise.resolve(null)
    }

    console.log('📊 [okto-activity] refreshActivity: Starting refresh with params:', params)

    // Invalidate the query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['okto-activity', params] })

    // Also directly fetch activity to ensure immediate update
    return fetchActivity(params)
        .then(data => {
            console.log('📊 [okto-activity] refreshActivity: Refresh completed', data ? 'with data' : 'without data')
            if (data) {
                console.log('📊 [okto-activity] Total activities:', data.count)
            }
            return data
        })
        .catch(error => {
            console.error('📊 [okto-activity] refreshActivity: Error during refresh', error)
            return null
        })
}

/**
 * Load more activities by fetching the next page
 */
export async function loadMoreActivities(
    currentData: OktoActivityData,
    params: ActivityPaginationParams,
): Promise<OktoActivityData | null> {
    try {
        console.log('📊 [okto-activity] Loading more activities with params:', params)

        // Fetch the next page of activities
        const newData = await fetchActivity(params)

        if (!newData) {
            return currentData
        }

        // Merge the new activities with the existing ones
        return {
            count: newData.count,
            activity: [...currentData.activity, ...newData.activity],
        }
    } catch (error) {
        console.error('📊 [okto-activity] Error loading more activities:', error)
        return currentData
    }
}
