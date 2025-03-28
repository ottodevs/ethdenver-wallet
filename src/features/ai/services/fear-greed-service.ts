export interface FearGreedData {
    value: number
    value_classification: string
    timestamp: string
    time_until_update: string
}

export interface FearGreedHistoryData {
    value: number
    value_classification: string
    timestamp: string
    date: string
}

export interface FearGreedResponse {
    name: string
    data: FearGreedData[]
    metadata: {
        error: null | string
    }
}

export interface FearGreedHistoryResponse {
    name: string
    data: FearGreedHistoryData[]
    metadata: {
        error: null | string
    }
}

/**
 * Get the current Fear & Greed index
 */
export async function getCurrentFearGreedIndex(): Promise<FearGreedData> {
    try {
        // Use our proxy endpoint instead of directly calling the external API
        const response = await fetch('/api/fear-greed')

        if (!response.ok) {
            throw new Error(`Failed to fetch Fear & Greed index: ${response.status} ${response.statusText}`)
        }

        const data: FearGreedResponse = await response.json()

        if (data.metadata.error) {
            throw new Error(`API Error: ${data.metadata.error}`)
        }

        return data.data[0]
    } catch (error) {
        console.error('Error fetching Fear & Greed index:', error)
        throw error
    }
}

/**
 * Get historical Fear & Greed index data
 */
export async function getFearGreedHistory(limit: number = 30): Promise<FearGreedHistoryData[]> {
    try {
        // Use our proxy endpoint instead of directly calling the external API
        const response = await fetch(`/api/fear-greed?limit=${limit}`)

        if (!response.ok) {
            throw new Error(`Failed to fetch Fear & Greed history: ${response.status} ${response.statusText}`)
        }

        const data: FearGreedHistoryResponse = await response.json()

        if (data.metadata.error) {
            throw new Error(`API Error: ${data.metadata.error}`)
        }

        return data.data
    } catch (error) {
        console.error('Error fetching Fear & Greed history:', error)
        throw error
    }
}
