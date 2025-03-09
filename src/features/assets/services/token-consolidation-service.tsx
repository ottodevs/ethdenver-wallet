'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
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

export function useTokenConsolidationService() {
    const oktoClient = useOkto()
    const { checkAuthStatus } = useAuth()
    const { addPendingTransaction, updatePendingTransaction } = useOktoTransactions()
    const { tokens, refetch } = useOktoPortfolio()
    const { selectedAccount } = useOktoAccount()

    const consolidateToEth = async () => {
        if (!oktoClient) {
            throw new Error('Okto client not initialized')
        }

        // Check authentication before continuing
        const isAuth = await checkAuthStatus()
        if (!isAuth) {
            throw new Error('Authentication required')
        }

        if (!selectedAccount) {
            throw new Error('No account selected')
        }

        console.log('Starting token consolidation...')

        // Filter tokens with value less than $10 USD that are not native ETH
        const tokensToConsolidate = tokens.filter(
            token => token.valueUsd < 10 && token.symbol !== 'ETH' && token.balance > 0 && !token.isNative,
        )

        if (tokensToConsolidate.length === 0) {
            console.log('No tokens to consolidate')
            return []
        }

        console.log('Tokens to consolidate:', tokensToConsolidate)

        // Map of CAIP-2 IDs by chain
        const caip2IdMap: Record<string, string> = {
            ethereum: 'eip155:1',
            polygon: 'eip155:137',
            arbitrum: 'eip155:42161',
            optimism: 'eip155:10',
            base: 'eip155:8453',
        }

        // Use the address of the selected account
        const userAddress = selectedAccount.address
        console.log('User address for consolidation:', userAddress)

        const results = []

        // Process each token for consolidation
        for (const token of tokensToConsolidate) {
            const chain = token.chain
            const caip2Id = caip2IdMap[chain] || 'eip155:1'

            // Create a pending transaction for optimistic UI
            const pendingTxId = `pending-consolidate-${token.id}-${Date.now()}`
            const pendingTx: Transaction = {
                id: pendingTxId,
                type: 'consolidate',
                hash: '',
                symbol: token.symbol,
                amount: token.balance.toString(),
                timestamp: Date.now(),
                status: 'pending',
            }
            // Update UI optimistically
            addPendingTransaction({
                ...pendingTx,
                networkName: token.chain,
                token: token.contractAddress || '',
                tokenSymbol: token.symbol,
                explorerUrl: getExplorerUrl(token.chain, 'token', token.contractAddress || '', true),
                from: userAddress,
                to: userAddress,
                amount: token.balance.toString(),
                hash: '',
                id: pendingTxId,
                timestamp: Date.now(),
                type: 'other',
                status: 'pending',
            })

            try {
                // Convert the balance to BigInt with the correct decimals
                const amountInSmallestUnit = BigInt(Math.floor(token.balance * 10 ** 18))

                // Prepare transfer parameters
                const transferParams = {
                    amount: amountInSmallestUnit,
                    recipient: userAddress as `0x${string}`, // User address as recipient
                    token: (token.contractAddress || '') as `0x${string}`, // Token address to consolidate
                    caip2Id: caip2Id,
                }

                console.log(`Consolidating ${token.symbol} to ETH on ${chain}:`, transferParams)

                // Execute the transfer
                const jobId = await tokenTransfer(oktoClient, transferParams)
                console.log(`Consolidation of ${token.symbol} submitted with jobId:`, jobId)
                // Update the transaction status
                updatePendingTransaction(pendingTxId)

                results.push({
                    token: token.symbol,
                    chain,
                    jobId,
                })
            } catch (error) {
                console.error(`Failed to consolidate ${token.symbol} on ${chain}:`, error)

                // Update the transaction status to failed
                updatePendingTransaction(pendingTxId)

                results.push({
                    token: token.symbol,
                    chain,
                    error: error,
                })
            }
        }

        // Force portfolio refresh after all transactions
        setTimeout(async () => {
            try {
                console.log('Refreshing portfolio after consolidation...')
                await refetch()
            } catch (refreshError) {
                console.error('Error refreshing portfolio:', refreshError)
            }
        }, 5000) // Wait 5 seconds to give time for transactions to be processed

        return results
    }

    return { consolidateToEth }
}
