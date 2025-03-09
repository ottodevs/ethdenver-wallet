'use client'

import { BuyModal } from '@/components/buy-modal'
import { SendModal } from '@/components/send-modal'
import { SwapInterface } from '@/components/swap-interface'
import { AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ActionButtons() {
    const router = useRouter()
    const [buyModalOpen, setBuyModalOpen] = useState(false)
    const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false)
    const [sendModalOpen, setSendModalOpen] = useState(false)

    return (
        <>
            <div className='mb-6 flex items-center justify-center'>
                <div className='flex w-full max-w-[400px] justify-around'>
                    <div className='flex cursor-pointer flex-col items-center' onClick={() => setBuyModalOpen(true)}>
                        <div className='flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#4364F9]'>
                            <Image src='/buy.svg' alt='Buy' width={48} height={48} />
                        </div>
                        <span className='mt-2 text-[14px] text-gray-400'>BUY</span>
                    </div>
                    <div
                        className='flex cursor-pointer flex-col items-center'
                        onClick={() => setSwapInterfaceOpen(true)}>
                        <div className='flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#4364F9]'>
                            <Image src='/swap.svg' alt='Swap' width={48} height={48} />
                        </div>
                        <span className='mt-2 text-[14px] text-gray-400'>SWAP</span>
                    </div>
                    <div className='flex cursor-pointer flex-col items-center' onClick={() => setSendModalOpen(true)}>
                        <div className='flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#4364F9]'>
                            <Image src='/send.svg' alt='Send' width={48} height={48} />
                        </div>
                        <span className='mt-2 text-[14px] text-gray-400'>SEND</span>
                    </div>
                    <div className='flex cursor-pointer flex-col items-center' onClick={() => router.push('/ask')}>
                        <div className='flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#4364F9]'>
                            <Image src='/ask.svg' alt='Ask' width={48} height={48} />
                        </div>
                        <span className='mt-2 text-[14px] text-gray-400'>ASK</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {swapInterfaceOpen && <SwapInterface open={swapInterfaceOpen} onOpenChange={setSwapInterfaceOpen} />}
            </AnimatePresence>

            <AnimatePresence>
                {sendModalOpen && <SendModal open={sendModalOpen} onOpenChange={setSendModalOpen} />}
            </AnimatePresence>

            <AnimatePresence>
                {buyModalOpen && <BuyModal open={buyModalOpen} onOpenChange={setBuyModalOpen} />}
            </AnimatePresence>
        </>
    )
}
