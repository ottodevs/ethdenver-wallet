import { useChat } from 'ai/react'
import { useEffect, useState } from 'react'
import type { Message } from '../types'

export function useAiChat() {
    console.log('🔄 useAiChat hook initialized')

    const [initialMessage] = useState<Message>({
        role: 'assistant',
        content: "Hi there! I'm your crypto assistant. How can I help you today?",
    })

    console.log('📝 Initial message configured:', initialMessage)

    const {
        messages: aiMessages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        setMessages,
        error,
    } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: initialMessage.content,
            },
        ],
        onResponse: response => {
            console.log('🟢 Received API response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            })
        },
        onFinish: message => {
            console.log('✅ Message completed:', message)
        },
        onError: error => {
            console.error('❌ Chat error:', error)
        },
    })

    // Log when messages change
    useEffect(() => {
        console.log('📨 aiMessages updated:', aiMessages)
    }, [aiMessages])

    // Log when the loading state changes
    useEffect(() => {
        console.log('⏳ Loading state:', isLoading)
    }, [isLoading])

    // Log when there is an error
    useEffect(() => {
        if (error) {
            console.error('🚨 Error detected:', error)
        }
    }, [error])

    // Convert the format of messages from the ai/react library to the format of your application
    const messages: Message[] = aiMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
    }))

    const sendMessage = async (content: string) => {
        console.log('📤 Sending message:', content)

        try {
            // Create a simulated form event
            const formEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>

            console.log('🔄 Updating input with:', content)
            handleInputChange({ target: { value: content } } as React.ChangeEvent<HTMLInputElement>)

            console.log('🔄 Sending form...')
            await handleSubmit(formEvent)

            console.log('✅ Message sent correctly')
        } catch (error) {
            console.error('❌ Error sending message:', error)
        }
    }

    const clearChat = () => {
        console.log('🧹 Clearing chat...')

        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: initialMessage.content,
            },
        ])

        console.log('✅ Chat cleared')
    }

    // Check that the API is configured correctly
    useEffect(() => {
        fetch('/api/chat', {
            method: 'HEAD',
        })
            .then(response => {
                console.log('🔍 Checking /api/chat endpoint:', {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                })
            })
            .catch(error => {
                console.error('❌ Error checking /api/chat endpoint:', error)
            })
    }, [])

    return {
        messages,
        isLoading,
        sendMessage,
        clearChat,
        input,
        handleInputChange,
        handleSubmit,
        error,
    }
}
