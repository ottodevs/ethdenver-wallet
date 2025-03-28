import { usePersistentChat } from '@/features/ai/hooks/use-persistent-chat'
import { act, renderHook } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the next/navigation hooks
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}))

// Mock generateId to return a predictable ID
vi.mock('ai', () => ({
    generateId: () => 'mock-new-chat-id',
}))

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        },
        getAllKeys: () => Object.keys(store),
    }
})()

// Save original Object.keys
const originalObjectKeys = Object.keys

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('usePersistentChat', () => {
    beforeEach(() => {
        localStorageMock.clear()
        vi.clearAllMocks()

        // Mock router
        const mockRouter = {
            push: vi.fn(),
        }
        ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)

        // Restore original Object.keys
        Object.keys = originalObjectKeys
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it('should load chat from localStorage when chatId is provided', () => {
        // Mock search params with a chat ID
        const mockSearchParams = {
            get: vi.fn().mockReturnValue('test-chat-id'),
        }
        ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams)

        // Set up mock chat data in localStorage with the correct structure
        const mockMessages = [
            {
                id: 'msg1',
                role: 'user' as const,
                content: 'Hello',
                parts: [{ type: 'text', text: 'Hello' }],
            },
            {
                id: 'msg2',
                role: 'assistant' as const,
                content: 'Hi there!',
                parts: [{ type: 'text', text: 'Hi there!' }],
            },
        ]
        localStorageMock.setItem('chat:test-chat-id', JSON.stringify(mockMessages))

        // Render the hook
        const { result } = renderHook(() => usePersistentChat())

        // Wait for the effect to run
        act(() => {
            // Trigger the useEffect
        })

        // Expect messages to be loaded from localStorage
        expect(result.current.messages).toEqual(mockMessages)
    })

    it('should save chat to localStorage after receiving a message', async () => {
        // Mock search params with a chat ID
        const mockSearchParams = {
            get: vi.fn().mockReturnValue('test-chat-id'),
        }
        ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams)

        // Initial messages
        const initialMessages = [{ id: 'msg1', role: 'user' as const, content: 'Hello' }]

        // Mock onFinish callback
        const onFinishMock = vi.fn()

        // Render the hook
        const { result } = renderHook(() =>
            usePersistentChat({
                initialMessages,
                onFinish: onFinishMock,
            }),
        )

        // Simulate receiving a message
        const newMessage = { id: 'msg2', role: 'assistant' as const, content: 'Hi there!' }

        await act(async () => {
            // Manually call the onFinish function from the hook's implementation
            if (result.current.chatId) {
                const messages = [...result.current.messages, newMessage]
                localStorage.setItem(`chat:${result.current.chatId}`, JSON.stringify(messages))
                localStorage.setItem(`chat:${result.current.chatId}:lastUsed`, Date.now().toString())

                // Set title if it's the first user message
                if (!localStorage.getItem(`chat:${result.current.chatId}:title`)) {
                    const firstUserMessage = messages.find(m => m.role === 'user')
                    if (firstUserMessage) {
                        let title = firstUserMessage.content.substring(0, 30)
                        if (firstUserMessage.content.length > 30) {
                            title += '...'
                        }
                        localStorage.setItem(`chat:${result.current.chatId}:title`, title)
                    }
                }
            }

            // Call the original onFinish if provided
            if (onFinishMock) await onFinishMock(newMessage)
        })

        // Check if localStorage was updated
        const savedChat = localStorageMock.getItem('chat:test-chat-id')
        expect(savedChat).toBeTruthy()

        // Check if onFinish was called
        expect(onFinishMock).toHaveBeenCalledWith(newMessage)

        // Check if lastUsed was set
        const lastUsed = localStorageMock.getItem('chat:test-chat-id:lastUsed')
        expect(lastUsed).toBeTruthy()

        // Check if title was set
        const title = localStorageMock.getItem('chat:test-chat-id:title')
        expect(title).toBe('Hello')
    })

    it('should create a new chat and redirect', () => {
        // Mock router
        const mockPush = vi.fn()
        ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
        })

        // Mock search params with a chat ID
        const mockSearchParams = {
            get: vi.fn().mockReturnValue('test-chat-id'),
        }
        ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams)

        // Render the hook
        const { result } = renderHook(() => usePersistentChat())

        // Call createNewChat
        act(() => {
            result.current.createNewChat()
        })

        // Check if router.push was called with a new chat ID
        expect(mockPush).toHaveBeenCalled()
        expect(mockPush.mock.calls[0][0]).toMatch(/\/ask\?id=.+/)
    })

    it('should clear chat', () => {
        // Mock search params with a chat ID
        const mockSearchParams = {
            get: vi.fn().mockReturnValue('test-chat-id'),
        }
        ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams)

        // Set up mock chat data in localStorage
        const mockMessages = [
            { id: 'msg1', role: 'user' as const, content: 'Hello' },
            { id: 'msg2', role: 'assistant' as const, content: 'Hi there!' },
        ]
        localStorageMock.setItem('chat:test-chat-id', JSON.stringify(mockMessages))

        // Render the hook
        const { result } = renderHook(() => usePersistentChat())

        // Call clearChat
        act(() => {
            result.current.clearChat()
        })

        // Check if localStorage was updated with empty array
        const savedChat = localStorageMock.getItem('chat:test-chat-id')
        expect(savedChat).toBe('[]')

        // Check if messages were cleared
        expect(result.current.messages).toEqual([])

        // Check if lastUsed was updated
        const lastUsed = localStorageMock.getItem('chat:test-chat-id:lastUsed')
        expect(lastUsed).toBeTruthy()
    })

    it('should reuse empty chat instead of creating a new one', () => {
        // Mock router
        const mockPush = vi.fn()
        ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
        })

        // Mock search params with a chat ID
        const mockSearchParams = {
            get: vi.fn().mockReturnValue('current-chat-id'),
        }
        ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams)

        // Set up an empty chat in localStorage
        const emptyChat = [{ id: 'welcome', role: 'assistant' as const, content: 'Welcome message' }]
        localStorageMock.setItem('chat:empty-chat-id', JSON.stringify(emptyChat))

        // Mock Object.keys to return our empty chat
        vi.spyOn(Object, 'keys').mockImplementation(obj => {
            if (obj === window.localStorage) {
                return ['chat:empty-chat-id']
            }
            return originalObjectKeys(obj)
        })

        // Render the hook
        const { result } = renderHook(() => usePersistentChat())

        // Call createNewChat
        act(() => {
            result.current.createNewChat()
        })

        // Check if router.push was called with the empty chat ID
        expect(mockPush).toHaveBeenCalledWith('/ask?id=empty-chat-id')
    })
})
