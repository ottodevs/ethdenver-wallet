'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { APP_VERSION } from '@/lib/constants'
import { appState$, settings$, toggleDebugMode } from '@/lib/stores/app.store'
import { observer } from '@legendapp/state/react'
import { ArrowLeft, Bug, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const SettingsPage = observer(function SettingsPage() {
    const delegationEnabled = appState$.ui.delegationEnabled.get()
    const bannerDismissed = appState$.ui.delegatedBannerDismissed.get()
    const debugMode = settings$.debugMode.get()
    const [isDev, setIsDev] = useState(false)

    // Check if we're in development mode
    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development')
    }, [])

    const resetBannerDismissal = () => {
        appState$.ui.delegatedBannerDismissed.set(false)
        toast.success('Banner reset successfully', {
            description: 'The automatic approvals banner will be shown again',
        })
    }

    const handleDebugToggle = () => {
        toggleDebugMode()
        toast.success(debugMode ? 'Debug mode disabled' : 'Debug mode enabled', {
            description: debugMode ? 'Debug panel will be hidden' : 'Debug panel will be shown in the top-right corner',
        })
    }

    return (
        <div className='container max-w-md py-8'>
            <div className='mb-6 flex items-center'>
                <Link href='/' className='mr-2'>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <ArrowLeft className='h-4 w-4' />
                    </Button>
                </Link>
                <h1 className='text-xl font-semibold'>Settings</h1>
            </div>

            <div className='space-y-6'>
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Configure security settings for your wallet</CardDescription>
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

                {/* Debug settings card - only shown in development mode */}
                {isDev && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Developer Settings</CardTitle>
                            <CardDescription>Debug tools and developer options</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='flex items-center justify-between py-2'>
                                <div className='space-y-0.5'>
                                    <div className='flex items-center gap-2'>
                                        <Bug className='text-primary h-4 w-4' />
                                        <span className='text-sm font-medium'>Debug Mode</span>
                                    </div>
                                    <p className='text-muted-foreground text-xs'>
                                        Show debug information panel in the top-right corner
                                    </p>
                                </div>
                                <Switch checked={debugMode} onCheckedChange={handleDebugToggle} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                        <CardDescription>Application information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center justify-between py-2'>
                            <div className='space-y-0.5'>
                                <span className='text-sm font-medium'>Version</span>
                                <p className='text-muted-foreground text-xs'>{APP_VERSION}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
})

export default SettingsPage
