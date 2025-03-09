'use client'

import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import type { NFT } from '@/features/shared/state/nfts-state'
import { nftsState$, syncNFTs, transferNFT as transferNFTAction } from '@/features/shared/state/nfts-state'
import { useOkto } from '@okto_web3/react-sdk'
import { useCallback, useEffect } from 'react'

export type { NFT } from '@/features/shared/state/nfts-state'

export const useOktoNFTs = () => {
    const oktoClient = useOkto()
    const { selectedAccount } = useOktoAccount()
    const { isAuthenticated } = useAuth()

    // Get values from the observable state
    const nfts = nftsState$.nfts.get()
    const isLoading = nftsState$.isLoading.get()
    const error = nftsState$.error.get()
    const lastUpdated = nftsState$.lastUpdated.get()

    // Sync when dependencies change
    useEffect(() => {
        if (oktoClient && selectedAccount && isAuthenticated) {
            console.log('[useOktoNFTs] Dependencies changed, syncing NFTs')
            syncNFTs(oktoClient)
        }
    }, [oktoClient, selectedAccount, isAuthenticated])

    // Function to transfer an NFT
    const transferNFT = useCallback(
        async (nft: NFT, recipient: string) => {
            if (!oktoClient) throw new Error('Okto client not initialized')
            return transferNFTAction(nft, recipient, oktoClient)
        },
        [oktoClient],
    )

    return {
        nfts,
        isLoading,
        error,
        isInitialized: lastUpdated > 0,
        transferNFT,
        refetch: (forceRefresh = true) => syncNFTs(oktoClient, forceRefresh),
    }
}
