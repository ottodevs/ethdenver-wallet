'use client'

import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useAuth } from '@/hooks/use-auth'
import { appState$ } from '@/lib/stores/app.store'
import { observer } from '@legendapp/state/react'
import { Check, Clock, Loader2, Lock, Shield, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DelegatedApprovalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const DelegatedApproval = observer(function DelegatedApproval({ open, onOpenChange }: DelegatedApprovalProps) {
    const { isAuthenticated } = useAuth()
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Force re-render when open state changes
    const [forceRender, setForceRender] = useState(0)

    useEffect(() => {
        if (open) {
            setForceRender(prev => prev + 1)
        }
    }, [open])

    // Get delegation state from app state
    const delegationEnabled = appState$.ui.delegationEnabled.get()

    // Check if delegation is already enabled when the dialog opens
    useEffect(() => {
        if (open) {
            // Sync with localStorage for backward compatibility
            const localDelegationEnabled = localStorage.getItem('okto_delegation_enabled')
            if (localDelegationEnabled && !delegationEnabled) {
                appState$.ui.delegationEnabled.set(true)
            }
        }
    }, [open, delegationEnabled])

    // Memoize handlers to prevent recreation on every render
    const handleApprove = useCallback(async () => {
        // Check authentication before continuing
        if (!isAuthenticated) {
            setStatus('error')
            setErrorMessage('Authentication required')
            return
        }

        setStatus('loading')
        setErrorMessage('')

        try {
            // Simulate a call to the Okto API to activate delegation
            // Use a shorter timeout to improve performance
            await new Promise(resolve => setTimeout(resolve, 500))

            // Update app state
            appState$.ui.delegationEnabled.set(true)

            // Store in localStorage for backward compatibility
            localStorage.setItem('okto_delegation_enabled', 'true')

            // Also store the session key if available
            const sessionKey = localStorage.getItem('okto_session_key')
            if (!sessionKey) {
                console.warn('No session key found in localStorage')
            }

            setStatus('success')
        } catch (error) {
            console.error('Failed to enable delegation:', error)
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to enable automatic approvals')
        }
    }, [isAuthenticated])

    const handleDisable = useCallback(async () => {
        setStatus('loading')

        try {
            // Simulate a call to the Okto API to disable delegation
            // Use a shorter timeout to improve performance
            await new Promise(resolve => setTimeout(resolve, 300))

            // Update app state
            appState$.ui.delegationEnabled.set(false)

            // Update localStorage for backward compatibility
            localStorage.removeItem('okto_delegation_enabled')

            setStatus('idle')
        } catch (error) {
            console.error('Failed to disable delegation:', error)
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to disable automatic approvals')
        }
    }, [])

    const handleClose = useCallback(() => {
        if (status !== 'loading') {
            onOpenChange(false)
            // Reset the state after the animation ends
            setTimeout(() => {
                if (status === 'success' || status === 'error') {
                    setStatus('idle')
                    setErrorMessage('')
                }
            }, 300)
        }
    }, [status, onOpenChange])

    return (
        <ResponsiveDialog
            key={`delegated-approval-${forceRender}`}
            open={open}
            onOpenChange={handleClose}
            title='Automatic Approvals'
            description='Streamline your transaction experience'
            contentClassName='bg-background border-border'>
            <div className='py-4'>
                {!delegationEnabled ? (
                    <>
                        <div className='mb-6 space-y-6'>
                            <div className='grid grid-cols-1 gap-4'>
                                <div className='bg-primary/5 flex items-start space-x-3 rounded-lg p-3'>
                                    <Zap className='text-primary mt-0.5 h-5 w-5' />
                                    <div>
                                        <h4 className='text-sm font-medium'>Faster Transactions</h4>
                                        <p className='text-muted-foreground text-xs'>
                                            Skip manual approvals for each transaction, saving you time.
                                        </p>
                                    </div>
                                </div>

                                <div className='bg-primary/5 flex items-start space-x-3 rounded-lg p-3'>
                                    <Clock className='text-primary mt-0.5 h-5 w-5' />
                                    <div>
                                        <h4 className='text-sm font-medium'>Seamless Experience</h4>
                                        <p className='text-muted-foreground text-xs'>
                                            Enjoy a smoother workflow without constant interruptions.
                                        </p>
                                    </div>
                                </div>

                                <div className='bg-primary/5 flex items-start space-x-3 rounded-lg p-3'>
                                    <Lock className='text-primary mt-0.5 h-5 w-5' />
                                    <div>
                                        <h4 className='text-sm font-medium'>Secure Implementation</h4>
                                        <p className='text-muted-foreground text-xs'>
                                            Your private keys remain secure and are never exposed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3'>
                                {errorMessage || 'An error occurred while enabling automatic approvals.'}
                            </div>
                        )}

                        <Button onClick={handleApprove} disabled={status === 'loading'} className='w-full'>
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Enabling...
                                </>
                            ) : (
                                <>
                                    <Shield className='mr-2 h-4 w-4' />
                                    Enable Automatic Approvals
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className='flex flex-col items-center justify-center space-y-4 py-4'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                                <Check className='h-8 w-8 text-green-600' />
                            </div>

                            <div className='space-y-2 text-center'>
                                <h3 className='text-lg font-semibold'>Automatic Approvals Enabled</h3>
                                <p className='text-muted-foreground text-sm'>
                                    You can now send tokens and interact with dApps without signing each transaction.
                                </p>
                            </div>

                            {status === 'error' && (
                                <div className='bg-destructive/10 text-destructive w-full rounded-md p-3'>
                                    {errorMessage || 'An error occurred while disabling automatic approvals.'}
                                </div>
                            )}

                            <div className='flex w-full flex-col space-y-2 pt-2'>
                                <Button
                                    variant='outline'
                                    onClick={handleDisable}
                                    disabled={status === 'loading'}
                                    className='w-full'>
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            Disabling...
                                        </>
                                    ) : (
                                        'Disable Automatic Approvals'
                                    )}
                                </Button>

                                <Button onClick={handleClose} className='w-full'>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ResponsiveDialog>
    )
})
