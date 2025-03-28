import { useChat as useAIChat, type Message } from '@ai-sdk/react'
import { generateId } from 'ai'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Define the interface for the toolCall
interface ToolCallParams {
    toolCall: {
        id: string
        type: string
        toolName: string
        args: Record<string, unknown>
        result?: string | Record<string, unknown>
        status?: string
    }
}

interface UsePersistentChatOptions {
    initialMessages?: Message[]
    api?: string
    onResponse?: (response: Response) => void | Promise<void>
    onFinish?: (message: Message) => void | Promise<void>
    onError?: (error: Error) => void | Promise<void>
    // Use the defined interface instead of any
    onToolCall?: (params: ToolCallParams) => string | Promise<string | void> | void
}

export function usePersistentChat({
    initialMessages = [],
    api = '/api/chat',
    onResponse,
    onFinish,
    onError,
    onToolCall,
}: UsePersistentChatOptions = {}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chatId = searchParams.get('id')
    const [isInitialized, setIsInitialized] = useState(false)

    // Create chat hook with the API
    const chat = useAIChat({
        api,
        initialMessages,
        id: chatId || undefined,
        onResponse,
        onFinish: async message => {
            // Save to localStorage after each message
            if (chatId) {
                const messages = [...chat.messages]
                localStorage.setItem(`chat:${chatId}`, JSON.stringify(messages))

                // Update last used timestamp
                localStorage.setItem(`chat:${chatId}:lastUsed`, Date.now().toString())

                // If this is the first user message, use it as the title
                if (!localStorage.getItem(`chat:${chatId}:title`)) {
                    const firstUserMessage = messages.find(m => m.role === 'user')
                    if (firstUserMessage) {
                        // Truncate long messages for the title
                        let title = firstUserMessage.content.substring(0, 30)
                        if (firstUserMessage.content.length > 30) {
                            title += '...'
                        }
                        localStorage.setItem(`chat:${chatId}:title`, title)
                    }
                }
            }

            // Call the original onFinish if provided
            if (onFinish) await onFinish(message)
        },
        onError,
        // Pass the onToolCall handler if provided
        // @ts-expect-error - The types do not exactly match but it works at runtime
        onToolCall,
        // Send the chat ID with each request
        body: chatId ? { chatId } : undefined,
    })

    // Load chat from localStorage on initial render
    useEffect(() => {
        if (chatId && !isInitialized) {
            const savedChat = localStorage.getItem(`chat:${chatId}`)
            if (savedChat) {
                try {
                    const messages = JSON.parse(savedChat) as Message[]
                    // Verify that messages is an array before continuing
                    if (!Array.isArray(messages)) {
                        console.error('Chat data is not an array:', messages)
                        // Initialize with an empty array
                        chat.setMessages([])
                    } else {
                        // Only set if we have messages and they're different from initialMessages
                        if (
                            messages.length > 0 &&
                            (initialMessages.length === 0 ||
                                messages.length !== initialMessages.length ||
                                messages[0].id !== initialMessages[0].id)
                        ) {
                            chat.setMessages(messages)
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse saved chat:', e)
                }
            }
            setIsInitialized(true)
        }
    }, [chatId, chat.setMessages, initialMessages, isInitialized, chat])

    // Update the initialization state when the chatId changes
    useEffect(() => {
        if (chatId) {
            setIsInitialized(false)
        }
    }, [chatId])

    // Create a new chat and redirect to it
    const createNewChat = useCallback(() => {
        // Search for an empty chat in localStorage
        const chatIds = Object.keys(localStorage)
            .filter(key => key.startsWith('chat:'))
            .map(key => key.replace('chat:', ''))
            .filter(id => !id.includes(':lastUsed') && !id.includes(':title'))

        // Verify if any is empty
        for (const id of chatIds) {
            try {
                const chatData = localStorage.getItem(`chat:${id}`)
                if (chatData) {
                    const messages = JSON.parse(chatData) as Message[]
                    // Consider empty if it has no messages or only has the welcome message
                    if (
                        messages.length <= 1 ||
                        (messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === 'welcome')
                    ) {
                        // Use this empty chat
                        router.push(`/ask?id=${id}`)
                        return
                    }
                }
            } catch (e) {
                console.error('Error verifying empty chat:', e)
            }
        }

        // If there are no empty chats, create a new one
        const newChatId = generateId()

        // Initialize with welcome message
        const welcomeMessage = {
            id: 'welcome',
            role: 'assistant' as const,
            content:
                "Hi there! I'm Aeris, your crypto assistant. How can I help you today? You can ask me about your wallet balance, crypto prices, or the market sentiment (Fear & Greed Index).",
        }

        // Save initial message to localStorage
        localStorage.setItem(`chat:${newChatId}`, JSON.stringify([welcomeMessage]))

        // Set default title until user sends first message
        localStorage.setItem(`chat:${newChatId}:title`, 'New conversation')

        // Set last used timestamp
        localStorage.setItem(`chat:${newChatId}:lastUsed`, Date.now().toString())

        router.push(`/ask?id=${newChatId}`)
    }, [router])

    // Clear the current chat
    const clearChat = useCallback(() => {
        if (chatId) {
            chat.setMessages([])
            localStorage.setItem(`chat:${chatId}`, JSON.stringify([]))

            // We don't delete the chat, we just empty it
            // Update the timestamp to make it appear as recent
            localStorage.setItem(`chat:${chatId}:lastUsed`, Date.now().toString())
        }
    }, [chatId, chat])

    return {
        ...chat,
        chatId,
        createNewChat,
        clearChat,
    }
}
