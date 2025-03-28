import type { ActivityPaginationParams } from '@/okto/explorer/activity'
import { activityState$, loadMoreActivities, refreshActivity } from '@/okto/explorer/activity'
import { oktoState } from '@/okto/state'
import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Hook to access Okto portfolio activity data
 */
export function useOktoActivity() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [pagination, setPagination] = useState<ActivityPaginationParams>({ page: 1, size: 10 })

    // Get activity data directly from the observable state
    const activityData = activityState$.get()

    // Format the activities for easier consumption
    const activities = useMemo(() => {
        if (!activityData || !activityData.activity) {
            return []
        }

        return activityData.activity.map(activity => ({
            id: activity.id,
            symbol: activity.symbol,
            name: activity.name,
            image: activity.image,
            description: activity.description,
            quantity: activity.quantity,
            amount: activity.amount,
            orderType: activity.order_type,
            transferType: activity.transfer_type,
            status: activity.status,
            timestamp: activity.timestamp,
            txHash: activity.tx_hash,
            networkName: activity.network_name,
            networkSymbol: activity.network_symbol,
            explorerUrl: activity.network_explorer_url,
            // Format date for display
            date: new Date(activity.timestamp * 1000).toLocaleString(),
        }))
    }, [activityData])

    // Get total count
    const totalCount = useMemo(() => {
        if (!activityData) {
            return 0
        }
        return activityData.count
    }, [activityData])

    // Group activities by date
    const activitiesByDate = useMemo(() => {
        if (!activities.length) {
            return {}
        }

        return activities.reduce(
            (acc, activity) => {
                // Format date as YYYY-MM-DD
                const date = new Date(activity.timestamp * 1000).toISOString().split('T')[0]
                if (!acc[date]) {
                    acc[date] = []
                }
                acc[date].push(activity)
                return acc
            },
            {} as Record<string, typeof activities>,
        )
    }, [activities])

    // Refresh function
    const refetch = useCallback(
        async (params?: ActivityPaginationParams) => {
            if (!oktoState.auth.isAuthenticated.get()) {
                setError(new Error('Not authenticated'))
                return null
            }

            const queryParams = params || pagination

            try {
                setIsLoading(true)
                setError(null)

                // Refresh activity data
                const result = await refreshActivity(queryParams)
                console.log('📊 [useOktoActivity] Activity refreshed:', result)

                // Update pagination if params were provided
                if (params) {
                    setPagination(params)
                }

                return result
            } catch (err) {
                console.error('📊 [useOktoActivity] Error refreshing activity:', err)
                setError(err instanceof Error ? err : new Error(String(err)))
                return null
            } finally {
                setIsLoading(false)
            }
        },
        [pagination],
    )

    // Load more function for pagination
    const loadMore = useCallback(async () => {
        if (!oktoState.auth.isAuthenticated.get() || !activityData) {
            return null
        }

        try {
            setIsLoading(true)
            setError(null)

            // Calculate next page
            const nextPage = pagination.page + 1
            const nextParams = { ...pagination, page: nextPage }

            // Load more activities
            const result = await loadMoreActivities(activityData, nextParams)
            console.log('📊 [useOktoActivity] Loaded more activities:', result)

            // Update pagination
            setPagination(nextParams)

            return result
        } catch (err) {
            console.error('📊 [useOktoActivity] Error loading more activities:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
            return null
        } finally {
            setIsLoading(false)
        }
    }, [activityData, pagination])

    // Check if there are more activities to load
    const hasMore = useMemo(() => {
        if (!activityData) {
            return false
        }
        return activityData.activity.length < activityData.count
    }, [activityData])

    // Initial load when authenticated
    useEffect(() => {
        const isAuthenticated = oktoState.auth.isAuthenticated.get()

        if (isAuthenticated && (!activityData || !activityData.activity)) {
            console.log('📊 [useOktoActivity] Initial load triggered')
            refetch()
        }
    }, [activityData, refetch])

    // Subscribe to authentication changes
    useEffect(() => {
        const unsubscribe = oktoState.auth.isAuthenticated.onChange(isAuth => {
            console.log('📊 [useOktoActivity] Auth state changed:', isAuth)
            if (isAuth) {
                // Reset pagination and refetch
                const initialPagination = { page: 1, size: 10 }
                setPagination(initialPagination)
                refetch(initialPagination)
            } else {
                // Si el usuario ha cerrado sesión, limpiar los datos locales
                console.log('📊 [useOktoActivity] User logged out, clearing activity data')
                // No es necesario llamar a refetch aquí, ya que no estamos autenticados
                // Solo limpiamos el estado local
                setIsLoading(false)
                setError(null)
            }
        })

        return unsubscribe
    }, [refetch])

    // Refetch function with authentication check
    const safeRefetch = useCallback(
        async (params?: ActivityPaginationParams) => {
            // Verificar autenticación antes de intentar refrescar
            if (!oktoState.auth.isAuthenticated.get()) {
                console.log('📊 [useOktoActivity] Not authenticated, skipping refetch')
                return null
            }
            return refetch(params)
        },
        [refetch],
    )

    return {
        activities,
        activitiesByDate,
        totalCount,
        isLoading,
        error,
        refetch: safeRefetch,
        loadMore,
        hasMore,
        pagination,
        setPagination,
        rawData: activityData,
    }
}
