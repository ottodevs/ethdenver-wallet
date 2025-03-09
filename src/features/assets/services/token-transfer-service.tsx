'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoTransactions } from '@/features/shared/hooks/use-okto-transactions'
import { getExplorerUrl } from '@/lib/utils/explorer'
import { tokenTransfer, useOkto } from '@okto_web3/react-sdk'

// Define the Transaction type
interface Transaction {
    id: string
    type: string
    hash: string
    amount: string
    timestamp: number
    status: 'pending' | 'completed' | 'failed'
    symbol: string
}

// Define the TokenTransferParams interface
interface TokenTransferParams {
    tokenId: string
    symbol: string
    recipient: string
    amount: number
    caip2Id: string
    tokenAddress?: string
}

export function useTokenTransferService() {
    const oktoClient = useOkto()
    const { checkAuthStatus } = useAuth()
    const { addPendingTransaction, updatePendingTransaction } = useOktoTransactions()

    const sendToken = async (params: TokenTransferParams) => {
        if (!oktoClient) {
            throw new Error('Okto client not initialized')
        }

        // Check authentication before continuing
        const isAuth = await checkAuthStatus()
        if (!isAuth) {
            throw new Error('Authentication required')
        }

        console.log('Starting token transfer with params:', params)

        // Create a pending transaction for optimistic UI
        const pendingTxId = `pending-${Date.now()}`
        const pendingTx: Transaction = {
            id: pendingTxId,
            type: 'send',
            hash: '',
            symbol: params.symbol,
            amount: params.amount.toString(),
            timestamp: Date.now(),
            status: 'pending',
        }
        // Update UI optimistically
        addPendingTransaction({
            ...pendingTx,
            networkName: params.caip2Id.split(':')[1], // e.g. "ethereum" from "eip155:1"
            token: params.tokenAddress || '',
            tokenSymbol: params.symbol,
            explorerUrl: getExplorerUrl(params.caip2Id.split(':')[1], 'token', params.tokenAddress || '', true),
            from: params.recipient,
            to: params.recipient,
            amount: params.amount.toString(),
            hash: '',
            id: pendingTxId,
            status: 'pending',
            timestamp: Date.now(),
            type: 'transfer',
        })

        try {
            // Convert amount to BigInt with proper decimals (usually 18 for most tokens)
            const amountInSmallestUnit = BigInt(Math.floor(params.amount * 10 ** 18))

            // Prepare transfer parameters according to Okto documentation
            const transferParams = {
                amount: amountInSmallestUnit,
                recipient: params.recipient as `0x${string}`,
                token: (params.tokenAddress || '') as `0x${string}`, // Empty string for native token
                caip2Id: params.caip2Id,
            }

            console.log('Transfer params:', transferParams)

            // Use the abstract flow directly - Okto handles internally the creation and execution of the UserOp
            const result = await tokenTransfer(oktoClient, transferParams)
            console.log('Token transfer result:', result)

            // The result is a jobId (string)
            const jobId = result
            console.log('Transaction submitted with jobId:', jobId)

            // Update the transaction status to completed with the jobId
            updatePendingTransaction(pendingTxId)

            return jobId
        } catch (error) {
            console.error('Token transfer failed:', error)

            // Update the transaction status to failed
            updatePendingTransaction(pendingTxId)

            throw error
        }
    }

    return { sendToken }
}
