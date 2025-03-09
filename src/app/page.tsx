import { ErrorBoundary } from '@/features/shared/components/error-boundary'
import { WalletDashboard } from '@/features/wallet/components/wallet-dashboard'

export default async function RootPage() {
    return (
        <main className='bg-background flex min-h-screen flex-col items-center'>
            <div className='container flex max-w-md grow flex-col px-4'>
                <ErrorBoundary>
                    <WalletDashboard />
                </ErrorBoundary>
            </div>
        </main>
    )
}
