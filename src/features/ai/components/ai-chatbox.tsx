'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChat } from 'ai/react'
import { Bot, Send, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Markdown } from '../components/markdown'

export function AIChatbox() {
    console.log('🚀 Renderizando AIChatbox')

    const [isOpen, setIsOpen] = useState(false)
    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        api: '/api/chat',
        onResponse: response => {
            console.log('🟢 AIChatbox - Respuesta recibida:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            })
        },
        onFinish: message => {
            console.log('✅ AIChatbox - Mensaje completado:', message)
        },
        onError: err => {
            console.error('❌ AIChatbox - Error en chat:', err)
        },
    })

    // Log cuando cambian los mensajes
    useEffect(() => {
        console.log('📨 AIChatbox - Mensajes actualizados:', messages)
    }, [messages])

    // Log cuando cambia el estado de carga
    useEffect(() => {
        console.log('⏳ AIChatbox - Estado de carga:', isLoading)
    }, [isLoading])

    // Log cuando hay un error
    useEffect(() => {
        if (error) {
            console.error('🚨 AIChatbox - Error detectado:', error)
        }
    }, [error])

    // Log para el formulario de envío
    const handleFormSubmit = async (e: React.FormEvent) => {
        console.log('📤 AIChatbox - Enviando mensaje:', input)
        try {
            await handleSubmit(e)
            console.log('✅ AIChatbox - Formulario enviado correctamente')
        } catch (err) {
            console.error('❌ AIChatbox - Error al enviar formulario:', err)
        }
    }

    return (
        <div className='fixed right-4 bottom-4 z-50'>
            {isOpen ? (
                <Card className='flex h-96 w-80 flex-col'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <Bot className='h-5 w-5' />
                            AI Assistant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='flex-grow overflow-hidden'>
                        <ScrollArea className='h-full'>
                            {messages.map(message => (
                                <div key={message.id} className='mb-4 flex items-start gap-2'>
                                    <Avatar>
                                        <AvatarFallback>
                                            {message.role === 'user' ? (
                                                <User className='h-4 w-4' />
                                            ) : (
                                                <Bot className='h-4 w-4' />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 space-y-2'>
                                        <p className='text-sm font-medium'>{message.role === 'user' ? 'You' : 'AI'}</p>
                                        {message.role === 'assistant' ? (
                                            <Markdown content={message.content} />
                                        ) : (
                                            <p className='text-sm'>{message.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className='mb-4 flex items-start gap-2'>
                                    <Avatar>
                                        <AvatarFallback>
                                            <Bot className='h-4 w-4' />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 space-y-2'>
                                        <p className='text-sm font-medium'>AI</p>
                                        <div className='flex space-x-2'>
                                            <div className='h-2 w-2 animate-bounce rounded-full bg-current' />
                                            <div className='h-2 w-2 animate-bounce rounded-full bg-current delay-75' />
                                            <div className='h-2 w-2 animate-bounce rounded-full bg-current delay-150' />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                        <form onSubmit={handleFormSubmit} className='flex w-full gap-2'>
                            <Input
                                placeholder='Ask about your portfolio...'
                                value={input}
                                onChange={e => {
                                    console.log('🔄 AIChatbox - Input cambiado:', e.target.value)
                                    handleInputChange(e)
                                }}
                            />
                            <Button type='submit' size='icon' disabled={isLoading}>
                                <Send className='h-4 w-4' />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => {
                        console.log('🔘 AIChatbox - Abriendo chatbox')
                        setIsOpen(true)
                    }}
                    className='h-12 w-12 rounded-full'>
                    <Bot className='h-6 w-6' />
                </Button>
            )}
        </div>
    )
}
