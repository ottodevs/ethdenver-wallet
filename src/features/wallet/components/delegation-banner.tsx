'use client'

import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DelegatedApproval } from './delegated-approval'

export function DelegationBanner() {
    const [visible, setVisible] = useState(false)
    const [delegatedApprovalOpen, setDelegatedApprovalOpen] = useState(false)

    // Check if delegation is already enabled or banner was dismissed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDelegationEnabled = localStorage.getItem('okto_delegation_enabled')
            const isBannerDismissed = localStorage.getItem('okto_delegation_banner_dismissed')

            // Only show the banner if delegation is NOT enabled AND banner is NOT dismissed
            setVisible(!isDelegationEnabled && !isBannerDismissed)
        }
    }, [])

    const handleDismiss = () => {
        // Store the dismissal in localStorage
        localStorage.setItem('okto_delegation_banner_dismissed', 'true')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <>
            <div className='animate-in fade-in slide-in-from-top-5 pointer-events-none fixed top-4 right-0 left-0 z-50 mx-auto max-w-md px-4 duration-300'>
                <div className='pointer-events-auto rounded-xl border border-[#2E2E3D] bg-[#1C1C2A] p-4 shadow-md'>
                    <div className='mb-3 flex items-center gap-3'>
                        <Shield className='h-6 w-6 text-[#4364F9]' />
                        <p className='flex-grow text-base font-medium text-white'>Enable automatic approvals</p>
                        <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 rounded-full p-0 text-white hover:bg-[#373747]/50'
                            onClick={handleDismiss}>
                            <X className='h-4 w-4' />
                        </Button>
                    </div>

                    <p className='mb-4 text-sm text-[#9493ac]'>
                        Enhance your experience by allowing automatic transactions without signing each time
                    </p>

                    <Button
                        className='w-full rounded-xl bg-[#4364F9] py-5 text-base text-white hover:bg-[#3a58da]'
                        onClick={() => {
                            setDelegatedApprovalOpen(true)
                            setVisible(false)
                        }}>
                        Enable Now
                    </Button>
                </div>
            </div>

            <DelegatedApproval open={delegatedApprovalOpen} onOpenChange={setDelegatedApprovalOpen} />
        </>
    )
}
