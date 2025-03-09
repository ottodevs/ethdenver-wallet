'use client'

import { TokenList } from '@/features/assets/components/token-list'
import { NFTGallery } from '@/features/nfts/components/nft-gallery'
import { LoadingScreen } from '@/features/shared/components/loading-screen'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { nftsState$ } from '@/features/shared/state/nfts-state'
import { portfolioState$ } from '@/features/shared/state/portfolio-state'
import { transactionsState$ } from '@/features/shared/state/transactions-state'
import { TransactionHistory } from '@/features/transactions/components/transaction-history'
import { observer } from '@legendapp/state/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ActionButtons } from './action-buttons'
import { BalanceDisplay } from './balance-display'
import { DelegationBanner } from './delegation-banner'
import { TabNavigation } from './tab-navigation'
import { WalletHeader } from './wallet-header'

export const WalletDashboard = observer(function WalletDashboard() {
    const { isLoading, isAuthenticated } = useOktoAccount()
    const [activeTab, setActiveTab] = useState('assets')
    const [isClient, setIsClient] = useState(false)
    const { theme } = useTheme()

    // Use useEffect to detect client-side rendering
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Only access state on the client side
    const pendingTransactions = isClient ? transactionsState$.pendingTransactions.get() : []
    const isLoadingPortfolio = isClient ? portfolioState$.isLoading.get() : true
    const isLoadingNFTs = isClient ? nftsState$.isLoading.get() : true

    // Determinamos si estamos cargando basado en el tab activo
    const isLoadingContent =
        isLoading ||
        (isAuthenticated && ((activeTab === 'assets' && isLoadingPortfolio) || (activeTab === 'nfts' && isLoadingNFTs)))

    // Show a simple loading state during server rendering or initial client render
    if (!isClient) {
        return <div className='flex grow flex-col pt-4'>Loading...</div>
    }

    // Show loading screen while authenticating or loading the content
    if (isLoadingContent) {
        return <LoadingScreen accountLoading={isLoading} isAuthenticated={isAuthenticated} />
    }

    // If not authenticated, don't show anything while redirecting
    if (!isAuthenticated) {
        return null
    }

    // Determine which gradient class to use based on theme
    const gradientClass = theme === 'dark' ? 'bg-gradient-card-dark' : 'bg-gradient-card-light'

    return (
        <div className='flex grow flex-col pt-4'>
            <WalletHeader />
            <DelegationBanner />
            <BalanceDisplay />
            <ActionButtons />

            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hasPendingTransactions={pendingTransactions?.length > 0}
            />

            <div className={`mx-auto w-full grow rounded-t-2xl ${gradientClass}`}>
                <div className='py-4'>
                    {activeTab === 'assets' ? (
                        <TokenList />
                    ) : activeTab === 'activity' ? (
                        <TransactionHistory />
                    ) : activeTab === 'nfts' ? (
                        <NFTGallery />
                    ) : null}
                </div>
            </div>
        </div>
    )
})
