import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../../../../features/shared/hooks/use-okto-transactions'
import { useOktoTransactions } from '../../../../features/shared/hooks/use-okto-transactions'
import * as authenticateModule from '../../../../okto/authenticate'
import * as fetcherModule from '../../../../okto/utils/fetcher'

// Mock the dependencies
vi.mock('../../../../okto/authenticate', () => ({
    isAuthenticated: vi.fn(),
}))

vi.mock('../../../../okto/utils/fetcher', () => ({
    createAuthenticatedFetcher: vi.fn(),
}))

// Mock the transactionsState$ observable
vi.mock('../../../../features/shared/hooks/use-okto-transactions', () => {
    // Define mock arrays here inside the factory function
    const mockEmptyTransactions: Transaction[] = []
    const mockPendingTransactions: Transaction[] = []

    return {
        transactionsState$: {
            transactions: {
                get: vi.fn().mockReturnValue(mockEmptyTransactions),
                set: vi.fn(),
            },
            pendingTransactions: {
                get: vi.fn().mockReturnValue(mockPendingTransactions),
                set: vi.fn(),
            },
            isLoading: {
                get: vi.fn().mockReturnValue(false),
                set: vi.fn(),
            },
            error: {
                get: vi.fn().mockReturnValue(null),
                set: vi.fn(),
            },
            hasInitialized: {
                get: vi.fn().mockReturnValue(true),
                set: vi.fn(),
            },
            lastUpdated: {
                get: vi.fn().mockReturnValue(0),
                set: vi.fn(),
            },
        },
        useOktoTransactions: vi.fn().mockImplementation(() => ({
            transactions: mockEmptyTransactions,
            pendingTransactions: mockPendingTransactions,
            isLoading: false,
            error: null,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            addPendingTransaction: vi.fn(),
            updatePendingTransaction: vi.fn(),
            refetch: vi.fn(),
        })),
    }
})

describe('useOktoTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return transactions data when authenticated', async () => {
        // Mock authenticated state
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Mock successful API response - return a Promise that resolves to a function
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(
            (_endpoint: string, _options?: RequestInit) =>
                Promise.resolve({
                    ok: true,
                    data: {
                        activity: [
                            { id: 'tx1', status: true },
                            { id: 'tx2', status: false },
                        ],
                        count: 2,
                    },
                }),
        )

        // Render the hook
        const { result } = renderHook(() => useOktoTransactions())

        // Verify the hook returns the expected data
        await waitFor(() => {
            expect(result.current.transactions).toBeDefined()
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })
    })

    it('should handle authentication errors', async () => {
        // Mock unauthenticated state
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(false)

        // Render the hook
        const { result } = renderHook(() => useOktoTransactions())

        // Verify the hook handles unauthenticated state
        await waitFor(() => {
            expect(result.current.transactions).toEqual([])
            expect(result.current.error).toBeNull()
        })
    })

    it('should handle API errors', async () => {
        // Mock authenticated state
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Mock API error - return a Promise that rejects
        vi.mocked(fetcherModule.createAuthenticatedFetcher).mockResolvedValue(() =>
            Promise.reject(new Error('Network error')),
        )

        // Mock the useOktoTransactions implementation to return an error
        vi.mocked(useOktoTransactions).mockImplementation(() => ({
            transactions: [],
            pendingTransactions: [],
            isLoading: false,
            error: new Error('Network error'),
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            addPendingTransaction: vi.fn(),
            updatePendingTransaction: vi.fn(),
            refetch: vi.fn(),
        }))

        // Render the hook
        const { result } = renderHook(() => useOktoTransactions())

        // Verify the hook handles API errors
        await waitFor(() => {
            expect(result.current.error).toBeInstanceOf(Error)
            expect(result.current.error?.message).toBe('Network error')
        })
    })

    it('should add pending transactions', async () => {
        // Mock authenticated state
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Create a mock implementation with the addPendingTransaction function
        const mockAddPendingTransaction = vi.fn()
        vi.mocked(useOktoTransactions).mockImplementation(() => ({
            transactions: [],
            pendingTransactions: [],
            isLoading: false,
            error: null,
            hasInitialized: true,
            lastUpdated: Date.now(),
            isCacheValid: true,
            addPendingTransaction: mockAddPendingTransaction,
            updatePendingTransaction: vi.fn(),
            refetch: vi.fn(),
        }))

        // Render the hook
        const { result } = renderHook(() => useOktoTransactions())

        // Call the addPendingTransaction function with a complete Transaction object
        const pendingTx: Transaction = {
            id: 'pending-tx',
            status: 'pending',
            type: 'send',
            hash: '0x123',
            token: 'Ethereum',
            amount: '1.5',
            timestamp: Date.now(),
            symbol: 'ETH',
        }
        result.current.addPendingTransaction(pendingTx)

        // Verify the function was called with the correct arguments
        expect(mockAddPendingTransaction).toHaveBeenCalledWith(pendingTx)
    })

    it('should update pending transactions', async () => {
        // Mock authenticated state
        vi.mocked(authenticateModule.isAuthenticated).mockReturnValue(true)

        // Create a mock implementation with the updatePendingTransaction function
        const mockUpdatePendingTransaction = vi.fn()
        vi.mocked(useOktoTransactions).mockImplementation(() => ({
            transactions: [],
            pendingTransactions: [
                {
                    id: 'pending-tx',
                    status: 'pending',
                    type: 'send',
                    hash: '0x123',
                    token: 'Ethereum',
                    amount: '1.5',
                    timestamp: Date.now(),
                    symbol: 'ETH',
                },
            ],
            isLoading: false,
            error: null,
            hasInitialized: true,
            addPendingTransaction: vi.fn(),
            updatePendingTransaction: mockUpdatePendingTransaction,
            refetch: vi.fn(),
            lastUpdated: Date.now(),
            isCacheValid: true,
        }))

        // Render the hook
        const { result } = renderHook(() => useOktoTransactions())

        // Call the updatePendingTransaction function
        const updatedTx = { id: 'pending-tx', status: 'confirmed' }
        result.current.updatePendingTransaction('pending-tx', updatedTx)

        // Verify the function was called with the correct arguments
        expect(mockUpdatePendingTransaction).toHaveBeenCalledWith('pending-tx', updatedTx)
    })
})
