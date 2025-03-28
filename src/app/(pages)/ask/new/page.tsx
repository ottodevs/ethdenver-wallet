'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { generateId } from 'ai'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewChatPage() {
    const router = useRouter()

    useEffect(() => {
        // Search for an empty chat in localStorage
        const chatIds = Object.keys(localStorage)
            .filter(key => key.startsWith('chat:'))
            .map(key => key.replace('chat:', ''))

        // Verify if any is empty
        for (const id of chatIds) {
            try {
                const chatData = localStorage.getItem(`chat:${id}`)
                if (chatData) {
                    const messages = JSON.parse(chatData)
                    // Consider empty if it has no messages or only has the welcome message
                    if (
                        messages.length <= 1 ||
                        (messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === 'welcome')
                    ) {
                        // Use this empty chat
                        router.push(`/ask?id=${id}`)
                        return
                    }
                }
            } catch (e) {
                console.error('Error verifying empty chat:', e)
            }
        }

        // If there are no empty chats, create a new one
        const newChatId = generateId()

        // Small delay to show the animation
        const timer = setTimeout(() => {
            router.push(`/ask?id=${newChatId}`)
        }, 800)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className='flex h-full w-full flex-col items-center justify-center'>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='flex flex-col items-center space-y-4'>
                <LoadingSpinner size='lg' />
                <motion.h2
                    className='text-xl font-medium'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}>
                    Creating a new chat...
                </motion.h2>
                <motion.p
                    className='text-muted-foreground text-sm'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}>
                    Preparing your conversation with Aeris AI
                </motion.p>
            </motion.div>
        </div>
    )
}
