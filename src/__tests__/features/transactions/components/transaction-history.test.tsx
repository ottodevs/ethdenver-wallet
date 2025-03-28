import { render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transactionsState$, useOktoTransactions } from '../../../../features/shared/hooks/use-okto-transactions'
import { TransactionHistory } from '../../../../features/transactions/components/transaction-history'

// Mock refetch function
const mockRefetch = vi.fn()
const mockAddPendingTransaction = vi.fn()
const mockUpdatePendingTransaction = vi.fn()

// Mock useState to control component's internal state
let mockIsLoading = true
let mockHasAttemptedRefresh = false

vi.mock('react', async () => {
    const actual = await vi.importActual('react')
    return {
        ...actual,
        useState: (initialValue: unknown) => {
            // For isLoading state
            if (initialValue === true) {
                return [mockIsLoading, vi.fn()]
            }
            // For hasAttemptedRefresh state
            if (initialValue === false && typeof initialValue === 'boolean') {
                return [mockHasAttemptedRefresh, vi.fn()]
            }
            // For other useState calls, return the initial value
            return [initialValue, vi.fn()]
        },
    }
})

// Mock the transactions state
vi.mock('../../../../features/shared/hooks/use-okto-transactions', () => ({
    transactionsState$: {
        transactions: {
            get: vi.fn(() => []),
            set: vi.fn(),
        },
        pendingTransactions: {
            get: vi.fn(() => []),
            set: vi.fn(),
        },
        isLoading: {
            get: vi.fn(() => false),
            set: vi.fn(),
        },
        error: {
            get: vi.fn(() => null),
            set: vi.fn(),
        },
        hasInitialized: {
            get: vi.fn(() => true),
            set: vi.fn(),
        },
        lastUpdated: {
            get: vi.fn(() => Date.now()),
            set: vi.fn(),
        },
    },
    useOktoTransactions: vi.fn(() => ({
        transactions: [],
        pendingTransactions: [],
        isLoading: false,
        error: null,
        hasInitialized: true,
        lastUpdated: Date.now(),
        isCacheValid: true,
        refetch: mockRefetch,
        addPendingTransaction: mockAddPendingTransaction,
        updatePendingTransaction: mockUpdatePendingTransaction,
    })),
}))

// Mock the oktoState
vi.mock('@/okto/state', () => ({
    oktoState: {
        auth: {
            isAuthenticated: {
                get: vi.fn(() => true),
                onChange: vi.fn(() => vi.fn()),
            },
        },
    },
}))

// Mock the observer function
vi.mock('@legendapp/state/react', () => ({
    observer: (component: React.ComponentType<unknown>) => component,
    useObservable: () => ({
        get: vi.fn(() => true),
    }),
}))

// Mock formatDistanceToNow
vi.mock('date-fns', () => ({
    formatDistanceToNow: vi.fn(() => '2 days ago'),
}))

// Mock motion
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}))

// Mock requestIdleCallback
global.requestIdleCallback = (callback: IdleRequestCallback) => {
    return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 100 }), 0) as unknown as number
}

global.cancelIdleCallback = (id: number) => {
    clearTimeout(id as unknown as NodeJS.Timeout)
}

describe('TransactionHistory', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers()

        // Reset mock state values
        mockIsLoading = true
        mockHasAttemptedRefresh = false
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders loading state', () => {
        // Mock loading state
        mockIsLoading = true
        vi.mocked(transactionsState$.isLoading.get).mockReturnValue(true)
        vi.mocked(transactionsState$.hasInitialized.get).mockReturnValue(false)

        render(<TransactionHistory animated={false} />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(100)

        // Verify loading indicator is shown
        expect(screen.getByTestId('transaction-history-loading')).toBeInTheDocument()
        // Verify multiple skeleton items are present
        const skeletonItems = screen.getAllByTestId('transaction-skeleton-item')
        expect(skeletonItems.length).toBeGreaterThan(0)
    })

    it('renders empty state', () => {
        // Mock empty state
        mockIsLoading = false
        vi.mocked(transactionsState$.transactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.pendingTransactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.isLoading.get).mockReturnValue(false)
        vi.mocked(transactionsState$.hasInitialized.get).mockReturnValue(true)
        vi.mocked(transactionsState$.error.get).mockReturnValue(null)

        // Override the useOktoTransactions hook to return empty state
        vi.mocked(useOktoTransactions).mockReturnValue({
            transactions: [],
            pendingTransactions: [],
            isLoading: false,
            error: null,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            refetch: mockRefetch,
            addPendingTransaction: mockAddPendingTransaction,
            updatePendingTransaction: mockUpdatePendingTransaction,
        })

        render(<TransactionHistory animated={false} />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(100)

        // Verify empty state message is shown
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
        // Mock error state
        mockIsLoading = false
        const mockError = new Error('Failed to load transactions')
        vi.mocked(transactionsState$.transactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.pendingTransactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.isLoading.get).mockReturnValue(false)
        vi.mocked(transactionsState$.hasInitialized.get).mockReturnValue(true)
        vi.mocked(transactionsState$.error.get).mockReturnValue(mockError)

        // Override the useOktoTransactions hook to return error state
        vi.mocked(useOktoTransactions).mockReturnValue({
            transactions: [],
            pendingTransactions: [],
            isLoading: false,
            error: mockError,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            refetch: mockRefetch,
            addPendingTransaction: mockAddPendingTransaction,
            updatePendingTransaction: mockUpdatePendingTransaction,
        })

        render(<TransactionHistory animated={false} />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(100)

        // Verify error message is shown
        expect(screen.getByText(/Failed to load transactions/i)).toBeInTheDocument()
    })

    it('renders transactions when available', () => {
        // Mock transactions data
        mockIsLoading = false
        const mockTransactions = [
            {
                id: 'tx1',
                type: 'send',
                hash: '0x123',
                token: 'Ethereum',
                amount: '1.5',
                timestamp: Date.now() - 172800000, // 2 days ago
                status: 'completed',
                symbol: 'ETH',
                networkName: 'Ethereum',
                networkSymbol: 'ETH',
                to: '0xabc',
                from: '0xdef',
            },
            {
                id: 'tx2',
                type: 'receive',
                hash: '0x456',
                token: 'USD Coin',
                amount: '100',
                timestamp: Date.now() - 86400000, // 1 day ago
                status: 'completed',
                symbol: 'USDC',
                networkName: 'Ethereum',
                networkSymbol: 'ETH',
                to: '0xdef',
                from: '0xabc',
            },
        ]

        vi.mocked(transactionsState$.transactions.get).mockReturnValue(mockTransactions)
        vi.mocked(transactionsState$.pendingTransactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.isLoading.get).mockReturnValue(false)
        vi.mocked(transactionsState$.hasInitialized.get).mockReturnValue(true)
        vi.mocked(transactionsState$.error.get).mockReturnValue(null)

        // Override the useOktoTransactions hook to return transactions
        vi.mocked(useOktoTransactions).mockReturnValue({
            transactions: mockTransactions,
            pendingTransactions: [],
            isLoading: false,
            error: null,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            refetch: mockRefetch,
            addPendingTransaction: mockAddPendingTransaction,
            updatePendingTransaction: mockUpdatePendingTransaction,
        })

        render(<TransactionHistory animated={false} />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(100)

        // Verify transactions are rendered
        expect(screen.getByTestId('transaction-list')).toBeInTheDocument()
        expect(screen.getByText(/Sent ETH/i)).toBeInTheDocument()
        expect(screen.getByText(/Received USDC/i)).toBeInTheDocument()
    })

    it('renders pending transactions', () => {
        // Mock pending transactions
        mockIsLoading = false
        const mockPendingTransactions = [
            {
                id: 'pending-tx1',
                type: 'send',
                hash: '0x789',
                token: 'Ethereum',
                amount: '0.5',
                timestamp: Date.now(),
                status: 'pending',
                symbol: 'ETH',
                networkName: 'Ethereum',
                networkSymbol: 'ETH',
                to: '0xabc',
                from: '0xdef',
            },
        ]

        vi.mocked(transactionsState$.transactions.get).mockReturnValue([])
        vi.mocked(transactionsState$.pendingTransactions.get).mockReturnValue(mockPendingTransactions)
        vi.mocked(transactionsState$.isLoading.get).mockReturnValue(false)
        vi.mocked(transactionsState$.hasInitialized.get).mockReturnValue(true)
        vi.mocked(transactionsState$.error.get).mockReturnValue(null)

        // Override the useOktoTransactions hook to return pending transactions
        vi.mocked(useOktoTransactions).mockReturnValue({
            transactions: [],
            pendingTransactions: mockPendingTransactions,
            isLoading: false,
            error: null,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            refetch: mockRefetch,
            addPendingTransaction: mockAddPendingTransaction,
            updatePendingTransaction: mockUpdatePendingTransaction,
        })

        render(<TransactionHistory animated={false} />)

        // Advance timers to trigger effects
        vi.advanceTimersByTime(100)

        // Verify pending transaction is rendered
        expect(screen.getByTestId('transaction-list')).toBeInTheDocument()
        expect(screen.getByText(/Sent ETH/i)).toBeInTheDocument()
        expect(screen.getByText(/pending/i, { exact: false })).toBeInTheDocument()
    })
})
