'use client'

import { PayTab } from '@/components/pay-tab'
import { ReceiveTab } from '@/components/receive-tab'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReceivePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('receive')

    return (
        <main
            className='flex min-h-screen flex-col'
            style={{
                background: 'linear-gradient(to bottom right, #252531, #13121E)',
            }}>
            {/* Navigation Header */}
            <div className='font-outfit flex items-center justify-between p-4 pt-6'>
                <Button variant='ghost' size='icon' className='h-8 w-8 text-white' onClick={() => router.back()}>
                    <ArrowLeft className='h-5 w-5' />
                </Button>
                <h1 className='text-center text-xl font-medium text-white'>RECEIVE</h1>
                <div className='w-8' />
            </div>

            {/* Main Content */}
            <div className='flex-1 px-6 py-4'>
                {/* Tab Selector */}
                <div className='mb-8 inline-flex h-[44px] w-full items-start justify-start gap-px rounded-[80px] border border-[#373a46] bg-[#181723] p-1'>
                    <div
                        onClick={() => setActiveTab('receive')}
                        className={`inline-flex h-[34px] shrink grow basis-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[80px] py-3 ${
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
                        className={`inline-flex h-[33px] shrink grow basis-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[80px] py-3 ${
                            activeTab === 'pay'
                                ? 'border border-[#373a46] bg-gradient-to-br from-[#343445] to-[#2a2a3e]'
                                : ''
                        }`}>
                        <div className='inline-flex items-center justify-start gap-4'>
                            <div className="font-['Outfit'] text-base leading-tight font-medium text-white">Pay</div>
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'receive' ? (
                    <ReceiveTab />
                ) : (
                    <PayTab onOpenChangeAction={() => {}} active={activeTab === 'pay'} />
                )}
            </div>
        </main>
    )
}
