import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import VoiceRecorder from '@/components/voice-recorder'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    disabled?: boolean
    className?: string
}

export default function ChatInput({ value, onChange, onSubmit, disabled = false, className }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
        }
    }

    return (
        <div className={cn('flex items-end gap-2', className)}>
            <div className='relative flex-1'>
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Type your message...'
                    className='max-h-[120px] min-h-[40px] resize-none py-3 pr-10'
                    rows={1}
                    disabled={disabled}
                />
            </div>
            <VoiceRecorder onTranscript={onChange} className='shrink-0' disabled={disabled} />
            <Button
                type='submit'
                size='icon'
                disabled={!value.trim() || disabled}
                className={cn('h-10 w-10 shrink-0', !value.trim() && 'opacity-50')}
                onClick={onSubmit}>
                <Send className='h-4 w-4' />
                <span className='sr-only'>Send</span>
            </Button>
        </div>
    )
}
