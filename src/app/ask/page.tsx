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
    console.log('🚀 Rendering AskAeris')

    const router = useRouter()
    const [error, setError] = useState<Error | null>(null)

    // Get real portfolio and account data
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
            console.log('🟢 AskAeris - Response received:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            })

            // Reset any previous error when we receive a response
            setError(null)
        },
        onFinish: message => {
            console.log('✅ AskAeris - Message completed:', message)
            console.log('📊 AskAeris - Additional data:', data)

            // Check if there are annotations in the message
            if (message.annotations) {
                console.log('🔖 AskAeris - Annotations:', message.annotations)
            }

            // Check if there are tool invocations
            if (message.toolInvocations) {
                console.log('🔧 AskAeris - Tool invocations:', message.toolInvocations)
            }
        },
        onError: err => {
            console.log('❌ AskAeris - Error in chat:', err)
            setError(err)
        },
        // Implement tool calls on the client side
        async onToolCall({ toolCall }) {
            console.log('🔧 AskAeris - Tool call:', toolCall)

            if (toolCall.toolName === 'getWalletBalance') {
                console.log('🔧 AskAeris - Executing getWalletBalance in client')

                // Add type assertion for args
                const args = toolCall.args as { refresh?: boolean }

                // If refresh is requested, update the data
                if (args.refresh) {
                    await refetchPortfolio(true)
                }

                // Format the tokens for a better presentation
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

                console.log('🔧 AskAeris - Executing getCryptoPrice in client for:', args.symbol)

                // Try to get the token price from our portfolio
                const token = tokens.find(t => t.symbol.toLowerCase() === args.symbol.toLowerCase())

                if (token) {
                    // If we have the token in our portfolio, use its value
                    return `${args.symbol.toUpperCase()} price: $${token.valueUsd.toFixed(2)} USD`
                }

                // Fallback prices for common tokens
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

            // New tool to logout
            if (toolCall.toolName === 'logout') {
                console.log('🔧 AskAeris - Executing logout in client')

                // Add type assertion for args
                const args = toolCall.args as { confirm: boolean }

                if (args.confirm) {
                    // Show toast and schedule the logout
                    addToast({
                        title: 'Logging out',
                        description: "You'll be redirected to the login page in a moment.",
                    })

                    // Schedule the logout to happen after the chatbot responds
                    setTimeout(() => {
                        console.log('👋 Logging out due to user request via chatbot')
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

            // New tool to get the Fear & Greed index
            if (toolCall.toolName === 'getFearGreedIndex') {
                console.log('🔧 AskAeris - Executing getFearGreedIndex in client')

                // Add type assertion for args
                const args = toolCall.args as { showChart?: boolean; days?: number }

                try {
                    // Get the current index
                    const currentIndex = await getCurrentFearGreedIndex()

                    // If chart is requested, get historical data
                    if (args.showChart) {
                        const days = args.days || 30
                        const historyData = await getFearGreedHistory(days)

                        // Create a unique ID for the chart
                        const chartId = `fear-greed-chart-${Date.now()}`

                        // Store the data so the component can access it
                        window.__fearGreedData = {
                            chartId,
                            currentValue: currentIndex.value,
                            currentClassification: currentIndex.value_classification,
                            historyData,
                        }

                        // Return a special marker that will be replaced by the component
                        return `<fear-greed-chart id="${chartId}" />
                        
Current Fear & Greed Index: ${currentIndex.value} (${currentIndex.value_classification})
Last updated: ${new Date(parseInt(currentIndex.timestamp) * 1000).toLocaleString()}`
                    }

                    // If no chart is requested, return the current index
                    return `Current Fear & Greed Index: ${currentIndex.value} (${currentIndex.value_classification})
Last updated: ${new Date(parseInt(currentIndex.timestamp) * 1000).toLocaleString()}`
                } catch (error) {
                    console.error('Error getting Fear & Greed index:', error)
                    return 'Sorry, I could not retrieve the Fear & Greed index at this moment.'
                }
            }
        },
        maxSteps: 3, // Allow multiple tool steps
    })

    // Current time
    const now = new Date()
    const formattedDateTime = `${format(now, 'EEEE')} ${format(now, 'h:mm a')}`

    // Clear chat function
    const clearChat = () => {
        console.log('🧹 AskAeris - Clearing chat')
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

    // Log when messages change
    useEffect(() => {
        console.log('📨 AskAeris - Messages updated:', messages)
    }, [messages])

    // Log when the loading state changes
    useEffect(() => {
        console.log('⏳ AskAeris - Loading state:', isLoading)
    }, [isLoading])

    // Log when there is an error
    useEffect(() => {
        if (error) {
            console.log('🚨 AskAeris - Error detected:', error)
        }
    }, [error])

    // Function to handle the form submission with improved error handling
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('📤 AskAeris - Sending message:', input)

        try {
            handleSubmit(e)
            console.log('✅ AskAeris - Form submitted successfully')
        } catch (err) {
            console.log('❌ AskAeris - Error submitting form:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
        }
    }

    // Function to render the message content with possible special components
    const renderMessageContent = (content: string) => {
        // Search for Fear & Greed chart markers
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

        // If there are no special components, render as normal Markdown
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

                            {/* Show tool results */}
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

                            {/* Show errors */}
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
                                console.log('🔄 AskAeris - Input changed:', e.target.value)
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

// Extend the Window interface to include Fear & Greed data
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
