import { useCallback, useState } from 'react'
import type { Message } from '../types'
import { useAiService } from './use-ai-service'

export function useAiChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi there! I'm your crypto assistant. How can I help you today?",
        },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const aiService = useAiService()

    const sendMessage = useCallback(
        async (content: string) => {
            // Add user message to chat
            const userMessage: Message = { role: 'user', content }
            setMessages(prev => [...prev, userMessage])

            // Set loading state
            setIsLoading(true)

            try {
                // Get AI response
                const response = await aiService.getCompletion([...messages, userMessage])

                // Add AI response to chat
                setMessages(prev => [...prev, { role: 'assistant', content: response }])
            } catch (error) {
                console.error('Error getting AI completion:', error)
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: 'Sorry, I encountered an error. Please try again later.',
                    },
                ])
            } finally {
                setIsLoading(false)
            }
        },
        [messages, aiService],
    )

    const clearChat = useCallback(() => {
        setMessages([
            {
                role: 'assistant',
                content: "Hi there! I'm your crypto assistant. How can I help you today?",
            },
        ])
    }, [])

    return {
        messages,
        isLoading,
        sendMessage,
        clearChat,
    }
}
