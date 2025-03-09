import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

type AIChatInputProps = {
    onSendMessage: (message: string) => void
    isLoading: boolean
}

export function AIChatInput({ onSendMessage, isLoading }: AIChatInputProps) {
    console.log('🚀 Rendering AIChatInput', { isLoading })

    const [input, setInput] = useState('')

    // Log when the loading state changes
    useEffect(() => {
        console.log('⏳ AIChatInput - Loading state:', isLoading)
    }, [isLoading])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        console.log('📤 AIChatInput - Trying to send message:', input)

        if (input.trim() && !isLoading) {
            console.log('✅ AIChatInput - Sending message:', input.trim())
            onSendMessage(input.trim())
            setInput('')
        } else {
            console.log('⚠️ AIChatInput - Message not sent:', {
                inputEmpty: !input.trim(),
                isLoading,
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className='bg-background/95 border-t p-4 backdrop-blur'>
            <div className='flex items-end gap-2'>
                <Textarea
                    value={input}
                    onChange={e => {
                        console.log('🔄 AIChatInput - Input changed:', e.target.value)
                        setInput(e.target.value)
                    }}
                    placeholder='Ask anything about crypto...'
                    className='min-h-[60px] resize-none'
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            console.log('⌨️ AIChatInput - Enter pressed (without Shift)')
                            e.preventDefault()
                            handleSubmit(e)
                        }
                    }}
                />
                <Button type='submit' size='icon' disabled={!input.trim() || isLoading} className='h-10 w-10 shrink-0'>
                    <Send className='h-4 w-4' />
                </Button>
            </div>
        </form>
    )
}
