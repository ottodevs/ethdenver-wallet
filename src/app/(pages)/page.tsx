import { WalletDashboard } from '@/features/wallet/components/wallet-dashboard'
import { getPortfolioData } from '@/lib/portfolio'

// Indicate that this page should be dynamically rendered
export const dynamic = 'force-dynamic'

/**
 * Root page component that renders the wallet dashboard
 * This is a server component that fetches initial data and passes it to the client component
 */
export default async function RootPage() {
    // Fetch initial portfolio data on the server
    const initialPortfolio = await getPortfolioData()

    return (
        <main className='bg-background flex min-h-screen flex-col items-center'>
            <div className='container flex max-w-md grow flex-col px-4'>
                <WalletDashboard initialPortfolio={initialPortfolio} />
            </div>
        </main>
    )
}
