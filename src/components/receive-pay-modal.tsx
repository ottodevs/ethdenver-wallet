'use client'

import { PayTab } from '@/components/pay-tab'
import { ReceiveTab } from '@/components/receive-tab'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useState } from 'react'

interface ReceivePayModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceivePayModal({ open, onOpenChange }: ReceivePayModalProps) {
    const [activeTab, setActiveTab] = useState('receive')

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title='RECEIVE'
            description=''
            contentClassName='max-w-md bg-gradient-to-br from-[#252531] to-[#13121E] rounded-t-2xl'
            hideCloseButton={true}>
            <div className='w-full px-4 pt-4 pb-16'>
                <div className='mb-8 inline-flex h-[42px] w-full items-start justify-start gap-px rounded-[80px] border border-[#373a46] bg-[#181723] p-1'>
                    <div
                        onClick={() => setActiveTab('receive')}
                        className={`inline-flex h-[34px] shrink grow basis-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[80px] px-[41px] py-3 ${
                            activeTab === 'receive'
                                ? 'border border-[#373a46] bg-gradient-to-br from-[#343445] to-[#2a2a3e]'
                                : ''
                        }`}>
                        <div className='inline-flex items-center justify-start gap-4'>
                            <div className="font-['Outfit'] text-base leading-tight font-medium text-white">
                                Receive
                            </div>
                        </div>
                    </div>
                    <div
                        onClick={() => setActiveTab('pay')}
                        className={`inline-flex h-[33px] shrink grow basis-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[80px] px-10 py-3 ${
                            activeTab === 'pay'
                                ? 'border border-[#373a46] bg-gradient-to-br from-[#343445] to-[#2a2a3e]'
                                : ''
                        }`}>
                        <div className='inline-flex items-center justify-start gap-4'>
                            <div className="font-['Outfit'] text-base leading-tight font-medium text-white">Pay</div>
                        </div>
                    </div>
                </div>

                {activeTab === 'receive' ? (
                    <ReceiveTab />
                ) : (
                    <PayTab
                        onOpenChangeAction={(open: boolean) => onOpenChange(open)}
                        active={activeTab === 'pay' && open}
                    />
                )}
            </div>
        </ResponsiveDialog>
    )
}
