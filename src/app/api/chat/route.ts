import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    console.log('🔍 API /api/chat - Recibida solicitud POST')

    try {
        const { messages } = await req.json()
        console.log('📦 API /api/chat - Cuerpo de la solicitud:', {
            messageCount: messages?.length || 0,
            lastMessage: messages?.length ? messages[messages.length - 1] : null,
        })

        if (!messages || !Array.isArray(messages)) {
            console.error('❌ API /api/chat - Formato de mensajes inválido:', messages)
            throw new Error('Invalid messages format')
        }

        console.log('🔄 API /api/chat - Iniciando streaming de respuesta')

        // Usar streamText con herramientas
        const result = streamText({
            model: openai('gpt-4-turbo'),
            system: 'You are Aeris, a helpful crypto assistant. You can provide information about cryptocurrencies, blockchain technology, and help users with their wallet operations. Be concise, accurate, and friendly.',
            messages,
            temperature: 0.7,
            maxTokens: 1000,
            tools: {
                // Herramienta para consultar el balance (será reemplazada por la versión cliente)
                getWalletBalance: {
                    description: "Get the current balance of the user's crypto wallet",
                    parameters: z.object({
                        refresh: z.boolean().optional().describe('Whether to force refresh the balance data'),
                    }),
                },

                // Herramienta para obtener precio de criptomonedas (será reemplazada por la versión cliente)
                getCryptoPrice: {
                    description: 'Get the current price of a cryptocurrency',
                    parameters: z.object({
                        symbol: z.string().describe('The symbol of the cryptocurrency (e.g., BTC, ETH, SOL)'),
                    }),
                },

                // Herramienta para cerrar sesión
                logout: {
                    description: 'Log out the current user from their wallet',
                    parameters: z.object({
                        confirm: z.boolean().describe('Confirmation that the user wants to log out'),
                    }),
                },

                // Nueva herramienta para obtener el índice Fear & Greed
                getFearGreedIndex: {
                    description: 'Get the current Fear & Greed index for the crypto market',
                    parameters: z.object({
                        showChart: z.boolean().optional().describe('Whether to show a chart with historical data'),
                        days: z.number().optional().describe('Number of days for historical data (default: 30)'),
                    }),
                },
            },
            maxSteps: 3, // Permitir múltiples pasos de herramientas
        })

        console.log('✅ API /api/chat - Streaming iniciado correctamente')

        // Usar toDataStreamResponse con manejo de errores
        return result.toDataStreamResponse({
            getErrorMessage: error => {
                console.error('❌ API /api/chat - Error en streaming:', error)
                return error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred'
            },
        })
    } catch (error) {
        console.error('❌ API /api/chat - Error general:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
