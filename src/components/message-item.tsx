import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/chat'
import { format } from 'date-fns'
import { Bot, User } from 'lucide-react'

interface MessageItemProps {
    message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
            <Avatar className='h-8 w-8'>
                <AvatarFallback className={cn(isUser ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
                    {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
                </AvatarFallback>
            </Avatar>
            <div
                className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 shadow-sm',
                    isUser ? 'bg-primary text-primary-foreground animate-slide-left' : 'bg-muted animate-slide-right',
                )}>
                <div className='break-words whitespace-pre-wrap'>{message.content}</div>
                <div
                    className={cn(
                        'mt-1 text-xs opacity-70',
                        isUser ? 'text-primary-foreground' : 'text-muted-foreground',
                    )}>
                    {format(new Date(message.timestamp), 'h:mm a')}
                </div>
            </div>
        </div>
    )
}
