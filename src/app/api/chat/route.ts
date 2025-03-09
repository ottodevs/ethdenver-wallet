import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    console.log('🔍 API /api/chat - Received POST request')

    try {
        const { messages } = await req.json()
        console.log('📦 API /api/chat - Request body:', {
            messageCount: messages?.length || 0,
            lastMessage: messages?.length ? messages[messages.length - 1] : null,
        })

        if (!messages || !Array.isArray(messages)) {
            console.error('❌ API /api/chat - Invalid messages format:', messages)
            throw new Error('Invalid messages format')
        }

        console.log('🔄 API /api/chat - Starting response streaming')

        // Use streamText with tools
        const result = streamText({
            model: openai('gpt-4-turbo'),
            system: 'You are Aeris, a helpful crypto assistant. You can provide information about cryptocurrencies, blockchain technology, and help users with their wallet operations. Be concise, accurate, and friendly.',
            messages,
            temperature: 0.7,
            maxTokens: 1000,
            tools: {
                // Tool to query the balance (will be replaced by the client version)
                getWalletBalance: {
                    description: "Get the current balance of the user's crypto wallet",
                    parameters: z.object({
                        refresh: z.boolean().optional().describe('Whether to force refresh the balance data'),
                    }),
                },

                // Tool to get cryptocurrency price (will be replaced by the client version)
                getCryptoPrice: {
                    description: 'Get the current price of a cryptocurrency',
                    parameters: z.object({
                        symbol: z.string().describe('The symbol of the cryptocurrency (e.g., BTC, ETH, SOL)'),
                    }),
                },

                // Tool to logout
                logout: {
                    description: 'Log out the current user from their wallet',
                    parameters: z.object({
                        confirm: z.boolean().describe('Confirmation that the user wants to log out'),
                    }),
                },

                // New tool to get the Fear & Greed index
                getFearGreedIndex: {
                    description: 'Get the current Fear & Greed index for the crypto market',
                    parameters: z.object({
                        showChart: z.boolean().optional().describe('Whether to show a chart with historical data'),
                        days: z.number().optional().describe('Number of days for historical data (default: 30)'),
                    }),
                },
            },
            maxSteps: 3, // Allow multiple steps of tools
        })

        console.log('✅ API /api/chat - Streaming started correctly')

        // Use toDataStreamResponse with error handling
        return result.toDataStreamResponse({
            getErrorMessage: error => {
                console.error('❌ API /api/chat - Error in streaming:', error)
                return error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred'
            },
        })
    } catch (error) {
        console.error('❌ API /api/chat - General error:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
