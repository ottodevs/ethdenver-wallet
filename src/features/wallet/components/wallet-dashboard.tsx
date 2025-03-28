'use client'

import { useOkto } from '@/contexts/okto.context'
import { usePortfolio } from '@/hooks/use-portfolio'
import type { OktoPortfolioData } from '@/types/okto'
import { observer } from '@legendapp/state/react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { memo, useEffect, useState } from 'react'

// Import components directly for better reliability
import { ActionButtons } from './action-buttons'
import { BalanceDisplay } from './balance-display'
import { TabNavigation } from './tab-navigation'
import { TokenList } from './token-list'
import { WalletHeader } from './wallet-header'

// Only use dynamic imports for less critical components
const DelegationBanner = dynamic(() => import('./delegation-banner').then(mod => memo(mod.default)), {
    ssr: false,
    loading: () => null,
})

const TransactionHistory = dynamic(
    () => import('@/features/transactions/components/transaction-history').then(mod => mod.TransactionHistory),
    {
        ssr: false,
        loading: () => null,
    },
)

const NFTGallery = dynamic(() => import('./nft-gallery').then(mod => mod.NFTGallery), {
    ssr: false,
    loading: () => null,
})

// Import the DebugPanel component
const DebugPanel = dynamic(() => import('@/components/DebugPanel').then(mod => mod.DebugPanel), {
    ssr: false,
    loading: () => null,
})

// Memoize static container
const DashboardContainer = memo(function DashboardContainer({ children }: { children: React.ReactNode }) {
    return <div className='flex grow flex-col pt-4'>{children}</div>
})

// Memoize header section
const HeaderSection = memo(function HeaderSection({ onQrCodeClick }: { onQrCodeClick: () => void }) {
    return (
        <>
            <WalletHeader onQrCodeClick={onQrCodeClick} />
            <DelegationBanner />
        </>
    )
})

// Tab content component
const TabContent = memo(function TabContent({ activeTab }: { activeTab: string }) {
    return (
        <div className='px-4 py-4'>
            {activeTab === 'assets' ? (
                <TokenList />
            ) : activeTab === 'activity' ? (
                <TransactionHistory />
            ) : activeTab === 'nfts' ? (
                <NFTGallery />
            ) : null}
        </div>
    )
})

// Main component with optimized structure
export const WalletDashboard = observer(function WalletDashboard({
    initialPortfolio,
}: {
    initialPortfolio?: OktoPortfolioData | null
}) {
    // Use our custom hooks for authentication and portfolio data
    const { isAuthenticated } = useOkto()
    const { loadPortfolioData, setInitialPortfolioData } = usePortfolio()
    const router = useRouter()

    // Use local state for active tab to ensure proper reactivity
    const [activeTab, setActiveTab] = useState('assets')

    // Initialize portfolio data with server-side data if available
    useEffect(() => {
        if (initialPortfolio) {
            console.log('🏦 [wallet-dashboard] Initializing with server-side portfolio data')
            setInitialPortfolioData(initialPortfolio)
        }
    }, [initialPortfolio, setInitialPortfolioData])

    // Effect to load data when component mounts or auth state changes
    useEffect(() => {
        if (isAuthenticated) {
            console.log('🏦 [wallet-dashboard] Auth state is true, loading data')

            // Always force a refresh of data after login to ensure we have the latest data
            // This is critical for the login flow
            loadPortfolioData(true)
                .then(() => {
                    console.log('🏦 [wallet-dashboard] Portfolio data loaded after authentication')
                })
                .catch(error => {
                    console.error('Error loading portfolio data after authentication:', error)
                })
        }
    }, [isAuthenticated, loadPortfolioData])

    // Handle tab change
    const handleTabChange = (tab: string) => {
        if (tab === 'activity') {
            // Store the current timestamp as the last viewed time
            localStorage.setItem('lastViewedActivityTimestamp', Math.floor(Date.now() / 1000).toString())
        }
        setActiveTab(tab)
    }

    // Handle QR code button click
    const handleQrCodeClick = () => {
        router.push('/receive')
    }

    // Determine which gradient class to use based on theme
    const gradientClass = 'bg-gradient-to-b from-gray-900/10 to-gray-900/20 dark:from-gray-800/20 dark:to-gray-800/40'

    return (
        <DashboardContainer>
            <HeaderSection onQrCodeClick={handleQrCodeClick} />

            {/* Main content section */}
            <div className='flex flex-col'>
                <BalanceDisplay initialPortfolio={initialPortfolio} />
                <ActionButtons />
            </div>

            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

            <div className={`mx-auto w-full grow rounded-t-2xl ${gradientClass}`}>
                <TabContent activeTab={activeTab} />
            </div>

            {/* Add the DebugPanel component */}
            <DebugPanel />
        </DashboardContainer>
    )
})
