import AskLayout from '@/app/(pages)/ask/layout'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// Mock push function
const mockPush = vi.fn()

// Mock the hooks and components
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

vi.mock('@/features/ai/components/chat-history', () => ({
    ChatHistory: ({ onNewChat }: { onNewChat: () => void }) => (
        <div data-testid='chat-history'>
            <button data-testid='new-chat-button' onClick={onNewChat}>
                New Chat
            </button>
        </div>
    ),
}))

// Mock window.matchMedia
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
})

describe('AskLayout', () => {
    it('should render the layout with chat history and children', () => {
        render(
            <AskLayout>
                <div data-testid='children'>Test Children</div>
            </AskLayout>,
        )

        expect(screen.getByTestId('chat-history')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('should create a new chat and redirect when New Chat button is clicked', () => {
        render(
            <AskLayout>
                <div>Test Children</div>
            </AskLayout>,
        )

        const newChatButton = screen.getByTestId('new-chat-button')
        fireEvent.click(newChatButton)

        // Check if router.push was called with a new chat ID
        expect(mockPush).toHaveBeenCalled()
        expect(mockPush.mock.calls[0][0]).toMatch(/\/ask\?id=/)
    })
})
