import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

type AIChatInputProps = {
    onSendMessage: (message: string) => void
    isLoading: boolean
}

export function AIChatInput({ onSendMessage, isLoading }: AIChatInputProps) {
    const [input, setInput] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim())
            setInput('')
        }
    }

    return (
        <form onSubmit={handleSubmit} className='bg-background/95 border-t p-4 backdrop-blur'>
            <div className='flex items-end gap-2'>
                <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder='Ask anything about crypto...'
                    className='min-h-[60px] resize-none'
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
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
