import MessageItem from '@/components/message-item'
import type { Message } from '@/types/chat'
import { Bot } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ChatMessagesProps {
    messages: Message[]
    isTyping?: boolean
}

export default function ChatMessages({ messages, isTyping = false }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    return (
        <div className='flex-1 overflow-y-auto p-3 md:p-4'>
            {messages.length > 0 ? (
                <div className='space-y-4'>
                    {messages.map(message => (
                        <MessageItem key={message.id} message={message} />
                    ))}
                    {isTyping && (
                        <div className='flex items-start gap-3'>
                            <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-full'>
                                <Bot className='text-primary-foreground h-4 w-4' />
                            </div>
                            <div className='flex h-8 items-center'>
                                <div className='flex space-x-1'>
                                    <div className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full' />
                                    <div
                                        className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                                        style={{ animationDelay: '0.2s' }}
                                    />
                                    <div
                                        className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                                        style={{ animationDelay: '0.4s' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className='flex h-full flex-col items-center justify-center text-center'>
                    <Bot className='text-muted-foreground mb-4 h-12 w-12' />
                    <h3 className='mb-2 text-xl font-semibold'>How can I help you today?</h3>
                    <p className='text-muted-foreground max-w-md text-sm'>
                        Ask me anything or start a new conversation. I&apos;m here to assist you with information and
                        answers.
                    </p>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    )
}
