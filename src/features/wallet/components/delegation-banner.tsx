'use client'

import { Button } from '@/components/ui/button'
import { appState$, showBanner } from '@/lib/stores/app.store'
import { observer } from '@legendapp/state/react'
import { Shield, X } from 'lucide-react'

type Props = {
    onEnableClick: () => void
    onDismiss: () => void
}

function DelegationBannerReactive({ onEnableClick, onDismiss }: Props) {
    return (
        <div className='animate-in fade-in slide-in-from-top-5 pointer-events-none fixed top-4 right-0 left-0 z-50 mx-auto max-w-md px-4 duration-300'>
            <div className='pointer-events-auto rounded-xl border border-[#2E2E3D] bg-[#1C1C2A] p-4 shadow-md'>
                <div className='mb-3 flex items-center gap-3'>
                    <Shield className='size-6 text-[#4364F9]' />
                    <p className='flex-grow text-base font-medium text-white'>Enable automatic approvals</p>
                    <Button
                        size='sm'
                        variant='ghost'
                        className='size-8 rounded-full p-0 text-white hover:bg-[#373747]/50'
                        onClick={onDismiss}>
                        <X className='size-4' />
                    </Button>
                </div>

                <p className='mb-4 text-sm text-[#9493ac]'>
                    Enhance your experience by allowing automatic transactions without signing each time
                </p>

                <Button
                    className='w-full rounded-xl bg-[#4364F9] py-5 text-base text-white hover:bg-[#3a58da]'
                    onClick={onEnableClick}>
                    Enable Now
                </Button>
            </div>
        </div>
    )
}

export const DelegationBanner = observer(function DelegationBanner() {
    const handleDismiss = () => {
        appState$.ui.delegatedBannerDismissed.set(true)
    }

    const handleEnableClick = () => {
        appState$.ui.delegationEnabled.set(true)
    }

    const shouldShowBanner = showBanner()

    return (
        <div className='text-foreground w-full'>
            {shouldShowBanner && (
                <DelegationBannerReactive onDismiss={handleDismiss} onEnableClick={handleEnableClick} />
            )}
        </div>
    )
})

export default DelegationBanner
