'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-context'
import { FearGreedChart } from '@/features/ai/components/fear-greed-chart'
import { Markdown } from '@/features/ai/components/markdown'
import type { FearGreedHistoryData } from '@/features/ai/services/fear-greed-service'
import { getCurrentFearGreedIndex, getFearGreedHistory } from '@/features/ai/services/fear-greed-service'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import { useChat as useAIChat } from '@ai-sdk/react'
import { format } from 'date-fns'
import { ArrowLeft, RefreshCw, Send, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AskAeris() {
    console.log('🚀 Renderizando AskAeris')

    const router = useRouter()
    const [error, setError] = useState<Error | null>(null)

    // Obtener datos reales del portfolio y cuenta
    const { tokens, totalBalanceUsd, refetch: refetchPortfolio } = useOktoPortfolio()
    const { selectedAccount } = useOktoAccount()
    const { handleLogout } = useAuth()

    const { addToast } = useToast()

    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, data } = useAIChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content:
                    "Hi there! I'm Aeris, your crypto assistant. How can I help you today? You can ask me about your wallet balance, crypto prices, or the market sentiment (Fear & Greed Index).",
            },
        ],
        onResponse: response => {
            console.log('🟢 AskAeris - Respuesta recibida:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            })

            // Resetear cualquier error previo cuando recibimos una respuesta
            setError(null)
        },
        onFinish: message => {
            console.log('✅ AskAeris - Mensaje completado:', message)
            console.log('📊 AskAeris - Datos adicionales:', data)

            // Verificar si hay anotaciones en el mensaje
            if (message.annotations) {
                console.log('🔖 AskAeris - Anotaciones:', message.annotations)
            }

            // Verificar si hay invocaciones de herramientas
            if (message.toolInvocations) {
                console.log('🔧 AskAeris - Invocaciones de herramientas:', message.toolInvocations)
            }
        },
        onError: err => {
            console.error('❌ AskAeris - Error en chat:', err)
            setError(err)
        },
        // Implementar herramientas del lado del cliente
        async onToolCall({ toolCall }) {
            console.log('🔧 AskAeris - Llamada a herramienta:', toolCall)

            if (toolCall.toolName === 'getWalletBalance') {
                console.log('🔧 Ejecutando herramienta getWalletBalance en cliente')

                // Add type assertion for args
                const args = toolCall.args as { refresh?: boolean }

                // Si se solicita refrescar, actualizar los datos
                if (args.refresh) {
                    await refetchPortfolio(true)
                }

                // Formatear los tokens para una mejor presentación
                const formattedTokens = tokens.map(token => ({
                    symbol: token.symbol,
                    balance: token.balance.toFixed(4),
                    valueUsd: token.valueUsd.toFixed(2),
                    chain: token.chain,
                }))

                const balance = {
                    address: selectedAccount?.address || 'No wallet connected',
                    tokens: formattedTokens,
                    totalBalanceUsd: totalBalanceUsd.toFixed(2),
                    formattedTotal: `$${totalBalanceUsd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} USD`,
                }

                return JSON.stringify(balance)
            }

            if (toolCall.toolName === 'getCryptoPrice') {
                // Add type assertion for args
                const args = toolCall.args as { symbol: string }

                console.log('🔧 Ejecutando herramienta getCryptoPrice en cliente para:', args.symbol)

                // Intentar obtener el precio del token desde nuestro portfolio
                const token = tokens.find(t => t.symbol.toLowerCase() === args.symbol.toLowerCase())

                if (token) {
                    // Si tenemos el token en nuestro portfolio, usar su valor
                    return `${args.symbol.toUpperCase()} price: $${token.valueUsd.toFixed(2)} USD`
                }

                // Precios de respaldo para tokens comunes
                const fallbackPrices: Record<string, string> = {
                    BTC: '$64,235.45',
                    ETH: '$2,456.78',
                    SOL: '$102.34',
                    USDC: '$1.00',
                    USDT: '$1.00',
                }

                const upperSymbol = args.symbol.toUpperCase()
                return upperSymbol in fallbackPrices ? fallbackPrices[upperSymbol] : 'Price not available'
            }

            // Nueva herramienta para cerrar sesión
            if (toolCall.toolName === 'logout') {
                console.log('🔧 Ejecutando herramienta logout en cliente')

                // Add type assertion for args
                const args = toolCall.args as { confirm: boolean }

                if (args.confirm) {
                    // Mostrar toast y programar el logout
                    addToast({
                        title: 'Logging out',
                        description: "You'll be redirected to the login page in a moment.",
                    })

                    // Programar el logout para que ocurra después de que el chatbot responda
                    setTimeout(() => {
                        console.log('👋 Cerrando sesión por solicitud del usuario vía chatbot')
                        handleLogout()
                        router.push('/auth')
                    }, 2000)

                    return "I've initiated the logout process. You'll be redirected to the login page in a moment."
                } else {
                    addToast({
                        title: 'Logout cancelled',
                        description: "You're still logged in.",
                    })
                    return "Logout cancelled. You're still logged in."
                }
            }

            // Nueva herramienta para obtener el índice Fear & Greed
            if (toolCall.toolName === 'getFearGreedIndex') {
                console.log('🔧 Ejecutando herramienta getFearGreedIndex en cliente')

                // Add type assertion for args
                const args = toolCall.args as { showChart?: boolean; days?: number }

                try {
                    // Obtener el índice actual
                    const currentIndex = await getCurrentFearGreedIndex()

                    // Si se solicita mostrar el gráfico, obtener datos históricos
                    if (args.showChart) {
                        const days = args.days || 30
                        const historyData = await getFearGreedHistory(days)

                        // Crear un ID único para el gráfico
                        const chartId = `fear-greed-chart-${Date.now()}`

                        // Almacenar los datos para que el componente pueda acceder a ellos
                        window.__fearGreedData = {
                            chartId,
                            currentValue: currentIndex.value,
                            currentClassification: currentIndex.value_classification,
                            historyData,
                        }

                        // Devolver un marcador especial que será reemplazado por el componente
                        return `<fear-greed-chart id="${chartId}" />
                        
Current Fear & Greed Index: ${currentIndex.value} (${currentIndex.value_classification})
Last updated: ${new Date(parseInt(currentIndex.timestamp) * 1000).toLocaleString()}`
                    }

                    // Si no se solicita el gráfico, solo devolver el índice actual
                    return `Current Fear & Greed Index: ${currentIndex.value} (${currentIndex.value_classification})
Last updated: ${new Date(parseInt(currentIndex.timestamp) * 1000).toLocaleString()}`
                } catch (error) {
                    console.error('Error getting Fear & Greed index:', error)
                    return 'Sorry, I could not retrieve the Fear & Greed index at this moment.'
                }
            }
        },
        maxSteps: 3, // Permitir múltiples pasos de herramientas
    })

    // Format current date and time
    const now = new Date()
    const formattedDateTime = `${format(now, 'EEEE')} ${format(now, 'h:mm a')}`

    // Clear chat function
    const clearChat = () => {
        console.log('🧹 AskAeris - Limpiando chat')
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content:
                    "Hi there! I'm Aeris, your crypto assistant. How can I help you today? You can ask me about your wallet balance, crypto prices, or the market sentiment (Fear & Greed Index).",
            },
        ])
        setError(null)
    }

    // Log cuando cambian los mensajes
    useEffect(() => {
        console.log('📨 AskAeris - Mensajes actualizados:', messages)
    }, [messages])

    // Log cuando cambia el estado de carga
    useEffect(() => {
        console.log('⏳ AskAeris - Estado de carga:', isLoading)
    }, [isLoading])

    // Log cuando hay un error
    useEffect(() => {
        if (error) {
            console.log('🚨 AskAeris - Error detectado:', error)
        }
    }, [error])

    // Función para manejar el envío del formulario con manejo de errores mejorado
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('📤 AskAeris - Enviando mensaje:', input)

        try {
            await handleSubmit(e)
            console.log('✅ AskAeris - Formulario enviado correctamente')
        } catch (err) {
            console.error('❌ AskAeris - Error al enviar formulario:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
        }
    }

    // Función para renderizar el contenido del mensaje con posibles componentes especiales
    const renderMessageContent = (content: string) => {
        // Buscar marcadores de gráficos Fear & Greed
        if (content.includes('<fear-greed-chart id="')) {
            const parts = content.split(/<fear-greed-chart id="([^"]+)" \/>/)

            if (parts.length >= 3) {
                const chartId = parts[1]
                const fearGreedData = window.__fearGreedData

                if (fearGreedData && fearGreedData.chartId === chartId) {
                    return (
                        <>
                            {parts[0] && <Markdown content={parts[0]} />}
                            <div className='my-4'>
                                <FearGreedChart
                                    data={fearGreedData.historyData}
                                    currentValue={fearGreedData.currentValue}
                                    currentClassification={fearGreedData.currentClassification}
                                />
                            </div>
                            {parts[2] && <Markdown content={parts[2]} />}
                        </>
                    )
                }
            }
        }

        // Si no hay componentes especiales, renderizar como Markdown normal
        return <Markdown content={content} />
    }

    return (
        <main className='flex h-screen flex-col bg-[#0D0D15] text-white'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-800 p-4'>
                <div className='flex items-center gap-3'>
                    <Button
                        onClick={() => router.back()}
                        size='icon'
                        variant='ghost'
                        className='text-white hover:bg-gray-800'>
                        <ArrowLeft className='h-5 w-5' />
                    </Button>
                    <div>
                        <h1 className='text-lg font-semibold text-white'>Ask Aeris</h1>
                        <p className='text-xs text-gray-400'>{formattedDateTime}</p>
                    </div>
                </div>
                <Button onClick={clearChat} size='icon' variant='ghost' className='text-white hover:bg-gray-800'>
                    <RefreshCw className='h-5 w-5' />
                </Button>
            </div>

            {/* Chat Area */}
            <div className='flex-1 space-y-4 overflow-y-auto p-4'>
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user' ? 'bg-[#4364F9] text-white' : 'bg-[#1A1A28] text-white'
                            }`}>
                            {message.role === 'assistant' ? (
                                renderMessageContent(message.content)
                            ) : (
                                <p>{message.content}</p>
                            )}

                            {/* Mostrar resultados de herramientas */}
                            {message.toolInvocations?.map((tool, toolIndex) => (
                                <div key={toolIndex} className='mt-2 rounded border border-gray-700 p-2'>
                                    <div className='flex items-center gap-1 text-xs text-gray-400'>
                                        <Wrench className='h-3 w-3' />
                                        <span>{tool.toolName}</span>
                                    </div>

                                    {'result' in tool ? (
                                        <div className='mt-1 text-sm'>
                                            <pre className='overflow-x-auto rounded bg-gray-900 p-2 text-xs whitespace-pre-wrap'>
                                                {typeof tool.result === 'string'
                                                    ? tool.result
                                                    : JSON.stringify(tool.result, null, 2)}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className='mt-1 text-xs text-gray-400 italic'>Processing...</div>
                                    )}
                                </div>
                            ))}

                            {/* Mostrar errores */}
                            {message.annotations && 'isError' in message.annotations && (
                                <div className='mt-2 text-sm text-red-400'>
                                    Error:{' '}
                                    {'errorMessage' in message.annotations
                                        ? String(message.annotations.errorMessage)
                                        : 'Unknown error'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className='flex justify-start'>
                        <div className='max-w-[80%] rounded-lg bg-[#1A1A28] p-3 text-white'>
                            <div className='flex space-x-2'>
                                <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400' />
                                <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-75' />
                                <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-150' />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error message display */}
                {error && (
                    <div className='flex justify-center'>
                        <div className='max-w-[80%] rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-500'>
                            <p className='font-medium'>Error: Unable to get response</p>
                            <p className='text-sm opacity-80'>Please try again or refresh the page</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className='border-t border-gray-800 p-4'>
                <form onSubmit={handleFormSubmit} className='flex gap-2'>
                    <div className='flex-1 rounded-full bg-[#1A1A28]'>
                        <input
                            className='w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none'
                            placeholder='Ask about your wallet, crypto prices, or market sentiment...'
                            value={input}
                            onChange={e => {
                                console.log('🔄 AskAeris - Input cambiado:', e.target.value)
                                handleInputChange(e)
                            }}
                        />
                    </div>
                    <Button
                        type='submit'
                        size='icon'
                        disabled={isLoading || !input.trim()}
                        className='flex h-12 w-12 items-center justify-center rounded-full bg-[#4364F9] hover:bg-blue-600 disabled:opacity-50'>
                        <Send className='h-5 w-5 text-white' />
                    </Button>
                </form>
            </div>
        </main>
    )
}

// Extender la interfaz Window para incluir los datos de Fear & Greed
declare global {
    interface Window {
        __fearGreedData?: {
            chartId: string
            currentValue: number
            currentClassification: string
            historyData: FearGreedHistoryData[]
        }
    }
}
