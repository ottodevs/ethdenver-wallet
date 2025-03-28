'use client'

import { BuyModal } from '@/components/buy-modal'
import { SendModal } from '@/components/send-modal'
import { SwapInterface } from '@/components/swap-interface'
import { observer } from '@legendapp/state/react'
import { AnimatePresence } from 'framer-motion'
import { RepeatIcon, SendIcon, SparklesIcon, WalletIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useMemo, useState } from 'react'

// Type for action configuration
type ActionConfig = {
    icon: React.ReactNode
    label: string
    onClick: () => void
}

// Memoized action button component
const ActionButton = memo(function ActionButton({ icon, label, onClick }: ActionConfig) {
    return (
        <div className='flex cursor-pointer flex-col items-center' onClick={onClick}>
            <div className='dark:text-foreground text-background relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#2D52EC]'>
                {icon}
            </div>
            <span className='text-muted-foreground mt-2 text-sm font-medium'>{label.toUpperCase()}</span>
        </div>
    )
})

// Memoized modal wrapper component
const ModalWrapper = memo(function ModalWrapper({
    isOpen,
    children,
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}) {
    return <AnimatePresence>{isOpen && children}</AnimatePresence>
})

// Main component using observer for state management
export const ActionButtons = observer(function ActionButtons() {
    const router = useRouter()

    // Memoized state handlers
    const [buyModalOpen, setBuyModalOpen] = useState(false)
    const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false)
    const [sendModalOpen, setSendModalOpen] = useState(false)

    // Memoized action handlers
    const handleBuyClick = useCallback(() => setBuyModalOpen(true), [])
    const handleSwapClick = useCallback(() => setSwapInterfaceOpen(true), [])
    const handleSendClick = useCallback(() => setSendModalOpen(true), [])
    const handleAskClick = useCallback(() => router.push('/ask'), [router])

    // Action buttons configuration
    const actions = useMemo<ActionConfig[]>(
        () => [
            {
                icon: <WalletIcon className='size-6' />,
                label: 'Buy',
                onClick: handleBuyClick,
            },
            {
                icon: <RepeatIcon className='size-6' />,
                label: 'Swap',
                onClick: handleSwapClick,
            },
            {
                icon: <SendIcon className='size-6' />,
                label: 'Send',
                onClick: handleSendClick,
            },
            {
                icon: <SparklesIcon className='size-6' />,
                label: 'Ask',
                onClick: handleAskClick,
            },
        ],
        [handleBuyClick, handleSwapClick, handleSendClick, handleAskClick],
    )

    return (
        <>
            <div className='mb-6 flex items-center justify-center'>
                <div className='flex w-full max-w-[400px] justify-around'>
                    {actions.map(action => (
                        <ActionButton key={action.label} {...action} />
                    ))}
                </div>
            </div>

            {/* Modals */}
            <ModalWrapper isOpen={swapInterfaceOpen} onOpenChange={setSwapInterfaceOpen}>
                <SwapInterface open={swapInterfaceOpen} onOpenChange={setSwapInterfaceOpen} />
            </ModalWrapper>

            <ModalWrapper isOpen={sendModalOpen} onOpenChange={setSendModalOpen}>
                <SendModal open={sendModalOpen} onOpenChange={setSendModalOpen} />
            </ModalWrapper>

            <ModalWrapper isOpen={buyModalOpen} onOpenChange={setBuyModalOpen}>
                <BuyModal open={buyModalOpen} onOpenChange={setBuyModalOpen} />
            </ModalWrapper>
        </>
    )
})
