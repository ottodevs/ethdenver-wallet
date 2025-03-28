import NewChatPage from '@/app/(pages)/ask/new/page'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock motion/react
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
            <div {...props}>{children}</div>
        ),
        h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
            <h2 {...props}>{children}</h2>
        ),
        p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <p {...props}>{children}</p>,
    },
}))

// Mock the LoadingSpinner component
vi.mock('@/components/ui/loading-spinner', () => ({
    LoadingSpinner: ({ size }: { size?: string }) => (
        <div data-testid='loading-spinner' data-size={size}>
            Loading...
        </div>
    ),
}))

// Mock the next/navigation hooks
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

// Mock the generateId function
vi.mock('ai', () => ({
    generateId: () => 'mock-chat-id',
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

describe('NewChatPage', () => {
    const mockPush = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()

        // Mock router
        ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
        })

        // Mock setTimeout
        vi.useFakeTimers()

        // Restore original Object.keys
        Object.keys = originalObjectKeys
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.useRealTimers()

        // Restore original Object.keys
        Object.keys = originalObjectKeys
    })

    it('should render loading state', () => {
        render(<NewChatPage />)

        // Check if loading indicator is displayed
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
        expect(screen.getByText('Creating a new chat...')).toBeInTheDocument()
        expect(screen.getByText('Preparing your conversation with Aeris AI')).toBeInTheDocument()
    })

    it('should redirect to chat page with new ID after delay', () => {
        render(<NewChatPage />)

        // Initially, router.push should not be called
        expect(mockPush).not.toHaveBeenCalled()

        // Advance timers
        vi.advanceTimersByTime(800)

        // Now router.push should be called
        expect(mockPush).toHaveBeenCalledWith('/ask?id=mock-chat-id')
    })

    it('should reuse empty chat if one exists', () => {
        // Set up an empty chat in localStorage
        const emptyChat = [{ id: 'welcome', role: 'assistant', content: 'Welcome message' }]
        localStorageMock.setItem('chat:empty-chat-id', JSON.stringify(emptyChat))

        // Mock Object.keys for localStorage
        vi.spyOn(Object, 'keys').mockImplementation(obj => {
            if (obj === window.localStorage) {
                return ['chat:empty-chat-id']
            }
            return originalObjectKeys(obj)
        })

        render(<NewChatPage />)

        // Should redirect to the empty chat immediately
        expect(mockPush).toHaveBeenCalledWith('/ask?id=empty-chat-id')
    })
})
