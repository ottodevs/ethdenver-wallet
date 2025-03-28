import { observer } from '@legendapp/state/react'
import { Eye, EyeOff } from 'lucide-react'
import { memo, useEffect, useState } from 'react'

import { settings$, togglePrivacyMode } from '@/lib/stores/app.store'
import type { OktoPortfolioData } from '@/types/okto'
import { BalanceAmount } from './balance-amount'

// Updated to avoid hydration errors by only rendering on the client side
const PrivacyToggleIcon = observer(() => {
    const privacyMode = settings$.privacyMode.get()
    const [mounted, setMounted] = useState(false)

    // Only render after component is mounted on client
    useEffect(() => {
        setMounted(true)
    }, [])

    // During SSR or before client-side hydration, render a placeholder
    if (!mounted) {
        return <div className='text-foreground/60 *:size-4' />
    }

    return <div className='text-foreground/60 *:size-4'>{privacyMode ? <EyeOff /> : <Eye />}</div>
})

// Memoized PrivacyToggle to prevent unnecessary re-renders on each click
const PrivacyToggle = memo(function PrivacyToggle() {
    return (
        <button
            onClick={togglePrivacyMode}
            className='flex items-center justify-center'
            aria-label='Toggle balance visibility'>
            <PrivacyToggleIcon />
        </button>
    )
})

interface BalanceDisplayProps {
    initialPortfolio?: OktoPortfolioData | null
}

export const BalanceDisplay = memo(function BalanceDisplayUI({ initialPortfolio }: BalanceDisplayProps) {
    return (
        <div className='mt-14 mb-10 flex flex-col items-center'>
            <div className='flex items-center gap-2'>
                <div className='font-outfit text-muted-foreground text-[16px]'>TOTAL BALANCE</div>
                <PrivacyToggle />
            </div>
            <BalanceAmount initialPortfolio={initialPortfolio} />
        </div>
    )
})
