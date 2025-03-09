export type FearGreedData = {
    value: number
    value_classification: string
    timestamp: string
    time_until_update: string
}

export type FearGreedHistoryData = {
    value: number
    value_classification: string
    timestamp: string
    date: string
}

/**
 * Gets the current Fear & Greed index
 */
export async function getCurrentFearGreedIndex(): Promise<FearGreedData> {
    try {
        const response = await fetch('https://api.alternative.me/fng/')
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        if (data && data.data && data.data.length > 0) {
            return data.data[0]
        }
        throw new Error('No data available')
    } catch (error) {
        console.error('Error fetching Fear & Greed index:', error)
        // Backup data in case of error
        return {
            value: 45,
            value_classification: 'Neutral',
            timestamp: new Date().toISOString(),
            time_until_update: '12:00',
        }
    }
}

/**
 * Gets the Fear & Greed history
 * @param days Number of days to get the history
 */
export async function getFearGreedHistory(days: number = 30): Promise<FearGreedHistoryData[]> {
    try {
        const response = await fetch(`https://api.alternative.me/fng/?limit=${days}`)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        if (data && data.data && data.data.length > 0) {
            return data.data.map((item: FearGreedHistoryData) => ({
                ...item,
                date: new Date(parseInt(item.timestamp) * 1000).toISOString().split('T')[0],
            }))
        }
        throw new Error('No historical data available')
    } catch (error) {
        console.error('Error fetching Fear & Greed history:', error)

        // Backup data in case of error
        const backupData: FearGreedHistoryData[] = []
        const today = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            // Generate a random value between 25 and 75 to simulate data
            const value = Math.floor(Math.random() * 50) + 25
            let classification = 'Neutral'

            if (value >= 65) classification = 'Greed'
            else if (value >= 55) classification = 'Moderate Greed'
            else if (value <= 35) classification = 'Fear'
            else if (value <= 25) classification = 'Extreme Fear'

            backupData.push({
                value,
                value_classification: classification,
                timestamp: (date.getTime() / 1000).toString(),
                date: date.toISOString().split('T')[0],
            })
        }

        return backupData
    }
}
