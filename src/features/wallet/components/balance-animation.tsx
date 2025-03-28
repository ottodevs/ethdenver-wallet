'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'

interface BalanceAnimationProps {
    value: string
    isPrivacyEnabled: boolean
    className?: string
}

/**
 * BalanceAnimation component
 * Provides smooth animations when the balance value changes
 */
export const BalanceAnimation = memo(function BalanceAnimation({
    value,
    isPrivacyEnabled,
    className = '',
}: BalanceAnimationProps) {
    const [displayValue, setDisplayValue] = useState(value)
    const [mounted, setMounted] = useState(false)

    // Set mounted state after hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Update the display value when the actual value changes
    useEffect(() => {
        // Only update if the value has actually changed
        if (value !== displayValue) {
            if (process.env.NODE_ENV === 'development') {
                console.log('💰 [balance-animation] Value changed:', value)
            }
            setDisplayValue(value)
        }
    }, [value, displayValue])

    // Animation variants
    const variants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    }

    // For debugging
    const displayContent = isPrivacyEnabled ? '••••••' : displayValue

    // Only log on development to avoid noise in tests
    if (process.env.NODE_ENV === 'development') {
        console.log('💰 [balance-animation] Rendering with value:', displayContent)
    }

    // Use a simpler version in test environment to avoid framer-motion issues
    if (process.env.NODE_ENV === 'test') {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <div className='text-3xl font-bold'>{displayContent}</div>
            </div>
        )
    }

    // During SSR, render a placeholder to avoid hydration errors
    if (!mounted) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <div className='text-3xl font-bold'>$0.00</div>
            </div>
        )
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <AnimatePresence mode='wait'>
                <motion.div
                    key={isPrivacyEnabled ? 'privacy' : displayValue}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    variants={variants}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className='text-3xl font-bold'>
                    {displayContent}
                </motion.div>
            </AnimatePresence>
        </div>
    )
})
