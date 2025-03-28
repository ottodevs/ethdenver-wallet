import { ChatHistory } from '@/features/ai/components/chat-history'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the next/navigation hooks
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
    usePathname: vi.fn(),
}))

// Mock the UI components
vi.mock('@/components/ui/sidebar', () => ({
    Sidebar: ({ children }: { children: React.ReactNode }) => <div data-testid='sidebar'>{children}</div>,
    SidebarProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='sidebar-provider'>{children}</div>
    ),
    SidebarHeader: ({ children }: { children: React.ReactNode }) => <div data-testid='sidebar-header'>{children}</div>,
    SidebarContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='sidebar-content'>{children}</div>
    ),
    SidebarFooter: ({ children }: { children: React.ReactNode }) => <div data-testid='sidebar-footer'>{children}</div>,
    SidebarMenu: ({ children }: { children: React.ReactNode }) => <div data-testid='sidebar-menu'>{children}</div>,
    SidebarMenuButton: ({
        children,
        onClick,
        isActive,
        ...props
    }: {
        children: React.ReactNode
        onClick?: () => void
        isActive?: boolean
        [key: string]: unknown
    }) => (
        <button data-testid='sidebar-menu-button' data-active={isActive} onClick={onClick} {...props}>
            {children}
        </button>
    ),
    SidebarTrigger: () => <button data-testid='sidebar-trigger'>Toggle</button>,
}))

// Mock the ArrowLeft icon
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react')
    return {
        ...(actual as object),
        ArrowLeft: () => <span data-testid='arrow-left-icon'>Back</span>,
        MessageSquare: () => <span data-testid='message-square-icon'>Message</span>,
        Search: () => <span data-testid='search-icon'>Search</span>,
        Plus: () => <span data-testid='plus-icon'>Plus</span>,
        MoreHorizontal: () => <span data-testid='more-icon'>More</span>,
        Edit2: () => <span data-testid='edit-icon'>Edit</span>,
        Trash: () => <span data-testid='trash-icon'>Trash</span>,
    }
})

// Mock the toast
vi.mock('@/components/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}))

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
        h2: ({ children, ...props }: { children: React.ReactNode }) => <h2 {...props}>{children}</h2>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ChatHistory', () => {
    const mockOnNewChat = vi.fn()
    const mockPush = vi.fn()
    const mockPathname = '/ask'

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
            length: Object.keys(store).length,
            key: (index: number) => Object.keys(store)[index],
            store,
        }
    })()

    // Save original localStorage and Object.keys
    const originalLocalStorage = global.localStorage
    const originalObjectKeys = Object.keys

    beforeEach(() => {
        vi.clearAllMocks()

        // Replace localStorage with mock
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        localStorageMock.clear()

        // Mock Object.keys to work with our localStorage mock
        Object.keys = (obj: object | Record<string, unknown>) => {
            if (obj === localStorageMock) {
                return Object.keys(localStorageMock.store || {})
            }
            return originalObjectKeys(obj)
        }

        // Mock router
        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>)

        // Mock pathname
        vi.mocked(usePathname).mockReturnValue(mockPathname)

        // Mock search params
        vi.mocked(useSearchParams).mockReturnValue({
            get: vi.fn().mockImplementation(param => {
                if (param === 'id') return 'chat-id-1'
                return null
            }),
        } as unknown as ReturnType<typeof useSearchParams>)
    })

    afterEach(() => {
        // Restore original localStorage and Object.keys
        Object.defineProperty(window, 'localStorage', { value: originalLocalStorage })
        Object.keys = originalObjectKeys
    })

    it('should render empty state when no chats exist', () => {
        render(<ChatHistory onNewChat={mockOnNewChat} />)

        // Check if empty state message is displayed
        expect(screen.getByText('No chat history')).toBeInTheDocument()
    })

    it('should render chat list when chats exist', async () => {
        // Set up mock chat data in localStorage
        const chatData = [
            { id: 'welcome', role: 'assistant', content: 'Welcome message' },
            { id: 'msg1', role: 'user', content: 'Hello there' },
        ]

        localStorageMock.setItem('chat:chat-id-1', JSON.stringify(chatData))
        localStorageMock.setItem('chat:chat-id-1:title', 'Test Chat')
        localStorageMock.setItem('chat:chat-id-1:lastUsed', Date.now().toString())

        // Mock the Object.keys specifically for this test
        const originalKeys = Object.keys
        Object.keys = (obj: object | Record<string, unknown>) => {
            if (obj === localStorageMock) {
                return ['chat:chat-id-1', 'chat:chat-id-1:title', 'chat:chat-id-1:lastUsed']
            }
            return originalKeys(obj)
        }

        render(<ChatHistory onNewChat={mockOnNewChat} />)

        // Wait for the chat list to be rendered and verify the chat title is displayed
        await waitFor(() => {
            // Look for the chat title directly instead of using data-testid
            const chatTitle = screen.getByText('Test Chat')
            expect(chatTitle).toBeInTheDocument()
        })
    })

    it('should call onNewChat when New Chat button is clicked', () => {
        render(<ChatHistory onNewChat={mockOnNewChat} />)

        // Find the New Chat button by its text content
        const newChatButton = screen.getByText('New Chat')
        fireEvent.click(newChatButton)

        expect(mockOnNewChat).toHaveBeenCalled()
    })

    it('should navigate to home when back button is clicked', () => {
        // Render the component
        render(<ChatHistory onNewChat={mockOnNewChat} />)

        // Find and click the back button using the data-testid
        const backButton = screen.getByTestId('arrow-left-icon')
        fireEvent.click(backButton.parentElement as HTMLElement)

        // Check if router.push was called with the home path
        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should filter chats when search query changes', async () => {
        // Set up mock chat data in localStorage
        const chatData = [
            { id: 'welcome', role: 'assistant', content: 'Welcome message' },
            { id: 'msg1', role: 'user', content: 'Hello there' },
        ]

        localStorageMock.setItem('chat:chat-id-1', JSON.stringify(chatData))
        localStorageMock.setItem('chat:chat-id-1:title', 'Test Chat')
        localStorageMock.setItem('chat:chat-id-1:lastUsed', Date.now().toString())

        localStorageMock.setItem('chat:chat-id-2', JSON.stringify(chatData))
        localStorageMock.setItem('chat:chat-id-2:title', 'Another Chat')
        localStorageMock.setItem('chat:chat-id-2:lastUsed', Date.now().toString())

        // Mock the Object.keys specifically for this test
        const originalKeys = Object.keys
        Object.keys = (obj: object | Record<string, unknown>) => {
            if (obj === localStorageMock) {
                return [
                    'chat:chat-id-1',
                    'chat:chat-id-1:title',
                    'chat:chat-id-1:lastUsed',
                    'chat:chat-id-2',
                    'chat:chat-id-2:title',
                    'chat:chat-id-2:lastUsed',
                ]
            }
            return originalKeys(obj)
        }

        render(<ChatHistory onNewChat={mockOnNewChat} />)

        // Wait for the chat list to be rendered
        await waitFor(() => {
            // Look for both chat titles
            const testChat = screen.getByText('Test Chat')
            const anotherChat = screen.getByText('Another Chat')
            expect(testChat).toBeInTheDocument()
            expect(anotherChat).toBeInTheDocument()
        })

        // Find the search input and type a query
        const searchInput = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(searchInput, { target: { value: 'Test' } })

        // Check that only the matching chat is displayed
        await waitFor(() => {
            expect(screen.getByText('Test Chat')).toBeInTheDocument()
            expect(screen.queryByText('Another Chat')).not.toBeInTheDocument()
        })
    })
})
