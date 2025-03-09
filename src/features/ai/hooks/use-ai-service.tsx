import { useCallback } from 'react'
import type { Message } from '../types'

export function useAiService() {
    const getCompletion = useCallback(async (messages: Message[]): Promise<string> => {
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            return data.response
        } catch (error) {
            console.error('Error in AI service:', error)
            throw error
        }
    }, [])

    return { getCompletion }
}
