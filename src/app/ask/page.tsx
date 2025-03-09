'use client'

import { Button } from '@/components/ui/button'
import { useChat } from 'ai/react'
import { format } from 'date-fns'
import { ArrowLeft, RefreshCw, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AskAeris() {
    const router = useRouter()
    const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: "Hi there! I'm Aeris, your crypto assistant. How can I help you today?",
            },
        ],
    })

    // Format current date and time
    const now = new Date()
    const formattedDateTime = `${format(now, 'EEEE')} ${format(now, 'h:mm a')}`

    // Clear chat function
    const clearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: "Hi there! I'm Aeris, your crypto assistant. How can I help you today?",
            },
        ])
    }

    return (
        <main className='flex min-h-screen flex-col' style={{ background: '#11101C' }}>
            {/* Header with time and battery icons (purely decorative) */}
            <div className='flex items-center justify-between p-2 text-sm text-white'>
                <div>9:41</div>
                <div className='flex items-center gap-1'>
                    <div className='relative h-3 w-4'>
                        <div className='absolute inset-0 rounded-sm border border-white' />
                        <div className='absolute inset-y-0 left-0 m-[1px] w-3/4 bg-white' />
                    </div>
                </div>
            </div>

            {/* Navigation Header */}
            <div className='font-outfit flex items-center justify-between p-4'>
                <Button variant='ghost' size='icon' className='h-8 w-8 text-white' onClick={() => router.back()}>
                    <ArrowLeft className='h-5 w-5' />
                </Button>
                <h1 className='text-center text-xl font-medium text-white'>ASK AERIS</h1>
                <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-white'
                    onClick={clearChat}
                    title='Clear chat'>
                    <RefreshCw className='h-5 w-5' />
                </Button>
            </div>

            {/* Date Display */}
            <div className='my-2 text-center text-sm text-gray-400'>{formattedDateTime}</div>

            {/* Chat Container */}
            <div className='flex-1 overflow-auto px-4 py-2'>
                <div className='flex flex-col gap-4'>
                    {messages.length > 0 ? (
                        messages.map(message => (
                            <div
                                key={message.id}
                                className={`${message.role === 'user' ? 'self-end' : 'self-start'} max-w-[85%]`}>
                                <div
                                    className={`rounded-2xl p-4 ${
                                        message.role === 'user' ? 'bg-[#4364F9] text-white' : 'bg-gray-800 text-white'
                                    }`}>
                                    <p className='text-[15px]'>{message.content}</p>
                                    {message.role === 'assistant' && message.content.includes('/thinking') && (
                                        <div className='mt-1 text-xs text-gray-400 italic'>/thinking</div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className='max-w-[85%] self-start'>
                                <div className='rounded-2xl bg-gray-800 p-4 text-white'>
                                    <p className='text-[15px]'>
                                        Can you please help me send my friend ottodevs.ens 200 USDC tokens?
                                    </p>
                                </div>
                            </div>
                            <div className='my-2 text-center text-sm text-gray-400'>{formattedDateTime}</div>
                            <div className='max-w-[85%] self-end'>
                                <div className='rounded-2xl bg-[#1F2B66] p-4 text-white'>
                                    <p className='text-[15px]'>
                                        I noticed that you have 239.87 USDC tokens spread across 4 different networks.
                                        Let&apos;s consolidate them so we can make this easy for you... /thinking
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className='border-t border-gray-800 p-4'>
                <form onSubmit={handleSubmit} className='flex gap-2'>
                    <div className='flex-1 rounded-full bg-[#1A1A28]'>
                        <input
                            className='w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none'
                            placeholder='Message'
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <Button
                        type='submit'
                        size='icon'
                        className='flex h-12 w-12 items-center justify-center rounded-full bg-[#4364F9] hover:bg-blue-600'>
                        <Send className='h-5 w-5 text-white' />
                    </Button>
                </form>
            </div>
        </main>
    )
}
