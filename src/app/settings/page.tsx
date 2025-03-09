'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_VERSION } from '@/lib/constants'
import { ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [delegationEnabled, setDelegationEnabled] = useState(false)
    const [bannerDismissed, setBannerDismissed] = useState(false)

    // Load settings from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDelegationEnabled = !!localStorage.getItem('okto_delegation_enabled')
            const isBannerDismissed = !!localStorage.getItem('okto_delegation_banner_dismissed')

            setDelegationEnabled(isDelegationEnabled)
            setBannerDismissed(isBannerDismissed)
        }
    }, [])

    const resetBannerDismissal = () => {
        localStorage.removeItem('okto_delegation_banner_dismissed')
        setBannerDismissed(false)
        toast.success('Banner reset successfully', {
            description: 'The automatic approvals banner will be shown again',
        })
    }

    return (
        <div className='container max-w-4xl space-y-6 py-6'>
            <div className='flex items-center gap-2'>
                <Link href='/' className='text-muted-foreground hover:text-foreground flex items-center text-sm'>
                    <ArrowLeft className='mr-1 h-4 w-4' />
                    Back to Dashboard
                </Link>
            </div>

            <div>
                <h1 className='text-3xl font-bold'>Settings</h1>
                <p className='text-muted-foreground'>Manage your application preferences</p>
            </div>

            <div className='grid gap-4'>
                <Card>
                    <CardHeader>
                        <CardTitle>Automatic Approvals</CardTitle>
                        <CardDescription>Manage transaction approval settings</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='flex items-center justify-between py-2'>
                            <div className='space-y-0.5'>
                                <div className='flex items-center gap-2'>
                                    <Shield className='text-primary h-4 w-4' />
                                    <span className='text-sm font-medium'>Automatic Approvals</span>
                                </div>
                                <p className='text-muted-foreground text-xs'>
                                    {delegationEnabled
                                        ? 'Automatic approvals are enabled'
                                        : 'Automatic approvals are disabled'}
                                </p>
                            </div>
                            <div className='bg-primary h-4 w-4 rounded-full' />
                        </div>

                        {bannerDismissed && (
                            <div className='flex items-center justify-between py-2'>
                                <div className='space-y-0.5'>
                                    <span className='text-sm font-medium'>Approvals Banner</span>
                                    <p className='text-muted-foreground text-xs'>
                                        The automatic approvals banner is currently hidden
                                    </p>
                                </div>
                                <Button variant='outline' size='sm' onClick={resetBannerDismissal}>
                                    Reset Banner
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                        <CardDescription>Application information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center justify-between py-2'>
                            <span className='text-sm font-medium'>Version</span>
                            <span className='text-muted-foreground text-sm'>{APP_VERSION}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
