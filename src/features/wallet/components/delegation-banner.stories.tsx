import { Button } from '@/components/ui/button'
import { appState$ } from '@/lib/stores/app.store'
import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'
import { DelegationBanner } from './delegation-banner'

// A wrapper component to control the banner state
const DelegationBannerWithControls = ({
    initialDismissed = false,
    initialEnabled = false,
}: {
    initialDismissed: boolean
    initialEnabled: boolean
}) => {
    const [dismissed, setDismissed] = useState(initialDismissed)
    const [enabled, setEnabled] = useState(initialEnabled)

    // Set initial state
    useEffect(() => {
        appState$.ui.delegatedBannerDismissed.set(dismissed)
        appState$.ui.delegationEnabled.set(enabled)

        // Mock localStorage
        if (typeof window !== 'undefined') {
            if (enabled) {
                localStorage.setItem('okto_delegation_enabled', 'true')
            } else {
                localStorage.removeItem('okto_delegation_enabled')
            }

            if (dismissed) {
                localStorage.setItem('okto_delegation_banner_dismissed', 'true')
            } else {
                localStorage.removeItem('okto_delegation_banner_dismissed')
            }
        }

        // Cleanup function
        return () => {
            appState$.ui.delegatedBannerDismissed.set(false)
            appState$.ui.delegationEnabled.set(false)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('okto_delegation_enabled')
                localStorage.removeItem('okto_delegation_banner_dismissed')
            }
        }
    }, [dismissed, enabled])

    return (
        <div className='flex flex-col gap-4'>
            <div className='mb-4 flex flex-col gap-2 rounded-lg bg-gray-800 p-4'>
                <h3 className='font-medium text-white'>Controls</h3>
                <div className='flex gap-2'>
                    <Button
                        onClick={() => {
                            setDismissed(false)
                            setEnabled(false)
                        }}
                        variant={!dismissed && !enabled ? 'default' : 'outline'}
                        size='sm'>
                        Show Banner
                    </Button>
                    <Button
                        onClick={() => {
                            setDismissed(true)
                            setEnabled(false)
                        }}
                        variant={dismissed && !enabled ? 'default' : 'outline'}
                        size='sm'>
                        Dismissed
                    </Button>
                    <Button
                        onClick={() => {
                            setEnabled(true)
                        }}
                        variant={enabled ? 'default' : 'outline'}
                        size='sm'>
                        Enabled
                    </Button>
                </div>
                <div className='mt-2 text-xs text-gray-400'>
                    Current state: {enabled ? 'Enabled' : dismissed ? 'Dismissed' : 'Visible'}
                </div>
            </div>

            <div className='relative min-h-[300px] w-full'>
                <DelegationBanner />
                {(dismissed || enabled) && (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='rounded-lg bg-gray-800 p-4 text-sm text-white'>
                            {enabled ? 'Delegation is enabled' : 'Banner is dismissed'}
                            <Button
                                className='mt-2 w-full'
                                size='sm'
                                onClick={() => {
                                    setDismissed(false)
                                    setEnabled(false)
                                }}>
                                Reset State
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const meta: Meta<typeof DelegationBannerWithControls> = {
    title: 'Features/Wallet/DelegationBanner',
    component: DelegationBannerWithControls,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        initialDismissed: {
            control: 'boolean',
            description: 'Whether the banner is initially dismissed',
        },
        initialEnabled: {
            control: 'boolean',
            description: 'Whether delegation is initially enabled',
        },
    },
}

export default meta
type Story = StoryObj<typeof DelegationBannerWithControls>

export const Default: Story = {
    args: {
        initialDismissed: false,
        initialEnabled: false,
    },
}

export const InitiallyDismissed: Story = {
    args: {
        initialDismissed: true,
        initialEnabled: false,
    },
}

export const DelegationEnabled: Story = {
    args: {
        initialDismissed: false,
        initialEnabled: true,
    },
}
