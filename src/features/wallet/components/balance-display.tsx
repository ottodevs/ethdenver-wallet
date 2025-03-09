import { observer } from '@legendapp/state/react'
import { Eye, EyeOff } from 'lucide-react'

import { portfolioState$ } from '@/features/shared/state/portfolio-state'
import { useWallet } from '@/features/wallet/hooks/use-wallet'

export const BalanceDisplay = observer(function BalanceDisplay() {
    const { privacyMode, togglePrivacyMode } = useWallet()

    // Obtenemos los valores directamente del estado observable
    const totalBalanceUsd = portfolioState$.totalBalanceUsd.get()
    const isLoading = portfolioState$.isLoading.get()

    // Format the balance properly, handling zero, undefined, or NaN values
    const formattedBalance =
        typeof totalBalanceUsd === 'number' && !isNaN(totalBalanceUsd)
            ? totalBalanceUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })
            : '0.00'

    return (
        <div className='mt-14 mb-10 flex flex-col items-center'>
            <div className='flex items-center gap-2'>
                <div className='font-outfit text-muted-foreground text-[16px]'>TOTAL BALANCE</div>
                <button onClick={togglePrivacyMode} className='flex h-5 w-5 items-center justify-center'>
                    {privacyMode ? (
                        <EyeOff className='text-foreground/60 h-4 w-4' />
                    ) : (
                        <Eye className='text-foreground/60 h-4 w-4' />
                    )}
                </button>
            </div>
            <div className='text-foreground mt-2 text-[42px] font-medium'>
                {privacyMode ? (
                    '••••••'
                ) : isLoading ? (
                    <span className='animate-pulse'>Loading...</span>
                ) : (
                    <>
                        <span className='mr-2'>$</span>
                        {formattedBalance}
                    </>
                )}
            </div>
        </div>
    )
})
