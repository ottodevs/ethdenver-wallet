import { useChat } from 'ai/react'
import { useEffect, useState } from 'react'
import type { Message } from '../types'

export function useAiChat() {
    console.log('🔄 useAiChat hook inicializado')

    const [initialMessage] = useState<Message>({
        role: 'assistant',
        content: "Hi there! I'm your crypto assistant. How can I help you today?",
    })

    console.log('📝 Mensaje inicial configurado:', initialMessage)

    const {
        messages: aiMessages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        setMessages,
        error,
    } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: initialMessage.content,
            },
        ],
        onResponse: response => {
            console.log('🟢 Respuesta recibida del API:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            })
        },
        onFinish: message => {
            console.log('✅ Mensaje completado:', message)
        },
        onError: error => {
            console.error('❌ Error en el chat:', error)
        },
    })

    // Log cuando cambian los mensajes
    useEffect(() => {
        console.log('📨 aiMessages actualizados:', aiMessages)
    }, [aiMessages])

    // Log cuando cambia el estado de carga
    useEffect(() => {
        console.log('⏳ Estado de carga:', isLoading)
    }, [isLoading])

    // Log cuando hay un error
    useEffect(() => {
        if (error) {
            console.error('🚨 Error detectado:', error)
        }
    }, [error])

    // Convertir el formato de mensajes de la biblioteca ai/react al formato de tu aplicación
    const messages: Message[] = aiMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
    }))

    const sendMessage = async (content: string) => {
        console.log('📤 Enviando mensaje:', content)

        try {
            // Crear un evento de formulario simulado
            const formEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>

            console.log('🔄 Actualizando input con:', content)
            handleInputChange({ target: { value: content } } as React.ChangeEvent<HTMLInputElement>)

            console.log('🔄 Enviando formulario...')
            await handleSubmit(formEvent)

            console.log('✅ Mensaje enviado correctamente')
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error)
        }
    }

    const clearChat = () => {
        console.log('🧹 Limpiando chat...')

        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: initialMessage.content,
            },
        ])

        console.log('✅ Chat limpiado')
    }

    // Verificar que la API esté configurada correctamente
    useEffect(() => {
        fetch('/api/chat', {
            method: 'HEAD',
        })
            .then(response => {
                console.log('🔍 Verificación de endpoint /api/chat:', {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                })
            })
            .catch(error => {
                console.error('❌ Error al verificar endpoint /api/chat:', error)
            })
    }, [])

    return {
        messages,
        isLoading,
        sendMessage,
        clearChat,
        input,
        handleInputChange,
        handleSubmit,
        error,
    }
}
