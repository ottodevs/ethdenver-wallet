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
    console.log('🚀 Renderizando AIChatInput', { isLoading })

    const [input, setInput] = useState('')

    // Log cuando cambia el estado de carga
    useEffect(() => {
        console.log('⏳ AIChatInput - Estado de carga:', isLoading)
    }, [isLoading])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        console.log('📤 AIChatInput - Intentando enviar mensaje:', input)

        if (input.trim() && !isLoading) {
            console.log('✅ AIChatInput - Enviando mensaje:', input.trim())
            onSendMessage(input.trim())
            setInput('')
        } else {
            console.log('⚠️ AIChatInput - No se envió el mensaje:', {
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
                        console.log('🔄 AIChatInput - Input cambiado:', e.target.value)
                        setInput(e.target.value)
                    }}
                    placeholder='Ask anything about crypto...'
                    className='min-h-[60px] resize-none'
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            console.log('⌨️ AIChatInput - Enter presionado (sin Shift)')
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
