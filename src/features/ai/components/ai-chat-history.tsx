import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/tailwind'
import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import { Markdown } from './markdown'

type AIChatHistoryProps = {
    messages: Message[]
    isLoading: boolean
}

export function AIChatHistory({ messages, isLoading }: AIChatHistoryProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div ref={containerRef} className='flex-1 space-y-4 overflow-y-auto p-4'>
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={cn(
                        'mb-4 flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}>
                    {message.role !== 'user' && (
                        <Avatar className='h-8 w-8'>
                            <AvatarImage src='/ai-assistant.png' alt='AI' />
                            <AvatarFallback className='bg-primary/10 text-primary'>AI</AvatarFallback>
                        </Avatar>
                    )}

                    <div
                        className={cn(
                            'max-w-[80%] rounded-lg p-3',
                            message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                        )}>
                        {message.role === 'assistant' ? (
                            <Markdown content={message.content} />
                        ) : (
                            <p>{message.content}</p>
                        )}
                    </div>

                    {message.role === 'user' && (
                        <Avatar className='h-8 w-8'>
                            <AvatarImage src='/user-avatar.png' alt='User' />
                            <AvatarFallback className='bg-secondary'>U</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}

            {isLoading && (
                <div className='flex items-start gap-3'>
                    <Avatar className='h-8 w-8'>
                        <AvatarFallback className='bg-primary/10 text-primary'>AI</AvatarFallback>
                    </Avatar>
                    <div className='bg-muted rounded-lg p-3'>
                        <div className='flex space-x-2'>
                            <div className='h-2 w-2 animate-bounce rounded-full bg-current' />
                            <div className='h-2 w-2 animate-bounce rounded-full bg-current delay-75' />
                            <div className='h-2 w-2 animate-bounce rounded-full bg-current delay-150' />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
