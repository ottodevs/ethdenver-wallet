'use client'

import ChatInput from '@/components/chat-input'
import ChatMessages from '@/components/chat-messages'
import ChatSidebar from '@/components/chat-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useChatContext } from '@/contexts/chat-context'
import mockData from '@/data/conversations'
import { generateId } from '@/lib/utils'
import type { Conversation, Message } from '@/types/chat'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

// Separates the logic that uses useSearchParams into a separate component
function ChatContainerInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('id')
    const { state, dispatch } = useChatContext()
    const [inputValue, setInputValue] = useState('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Load initial data
    useEffect(() => {
        dispatch({ type: 'SET_CONVERSATIONS', payload: mockData.conversations })

        // Set current conversation based on URL param or default to most recent
        if (conversationId) {
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationId })
        } else if (mockData.conversations.length > 0) {
            const mostRecent = mockData.conversations[0]
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: mostRecent.id })
            router.replace(`?id=${mostRecent.id}`)
        }
    }, [conversationId, dispatch, router])

    const currentConversation = state.conversations.find(conv => conv.id === state.currentConversationId)

    useEffect(() => {
        // Update current conversation when URL changes
        if (conversationId && conversationId !== state.currentConversationId) {
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationId })
        }
    }, [conversationId, dispatch, state.currentConversationId])

    const handleNewConversation = () => {
        const newConversation: Conversation = {
            id: generateId(),
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        dispatch({ type: 'ADD_CONVERSATION', payload: newConversation })
        router.push(`?id=${newConversation.id}`)
        setIsMobileMenuOpen(false)
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !currentConversation) return

        const userMessage: Message = {
            id: generateId(),
            content: inputValue.trim(),
            role: 'user',
            timestamp: new Date().toISOString(),
        }

        // Add user message immediately
        dispatch({
            type: 'ADD_MESSAGE',
            payload: { conversationId: currentConversation.id, message: userMessage },
        })

        setInputValue('')
        dispatch({ type: 'SET_TYPING', payload: true })

        try {
            // Here you would typically call your AI service
            // For now, we'll simulate a response
            const response = await new Promise<string>(resolve => {
                setTimeout(() => {
                    resolve(`This is a simulated AI response to: "${userMessage.content}"`)
                }, 1000)
            })

            const aiMessage: Message = {
                id: generateId(),
                content: response,
                role: 'assistant',
                timestamp: new Date().toISOString(),
            }

            dispatch({
                type: 'ADD_MESSAGE',
                payload: { conversationId: currentConversation.id, message: aiMessage },
            })

            // Update conversation title if it's the first message
            if (currentConversation.messages.length === 0) {
                const truncatedTitle =
                    userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + '...' : userMessage.content

                dispatch({
                    type: 'UPDATE_CONVERSATION',
                    payload: { ...currentConversation, title: truncatedTitle },
                })
            }
        } catch (error) {
            console.error('Error getting AI response:', error)
            // Here you might want to show an error message to the user
        } finally {
            dispatch({ type: 'SET_TYPING', payload: false })
        }
    }

    return (
        <SidebarProvider>
            <div className='bg-background flex h-screen w-full overflow-hidden'>
                <ChatSidebar
                    conversations={state.conversations}
                    currentConversationId={state.currentConversationId}
                    onSelectConversation={conversation => {
                        router.push(`?id=${conversation.id}`)
                        setIsMobileMenuOpen(false)
                    }}
                    onNewConversation={handleNewConversation}
                    onRenameConversation={(id, newTitle) => {
                        const conversation = state.conversations.find(conv => conv.id === id)
                        if (conversation) {
                            dispatch({
                                type: 'UPDATE_CONVERSATION',
                                payload: { ...conversation, title: newTitle },
                            })
                        }
                    }}
                    onDeleteConversation={id => {
                        dispatch({ type: 'DELETE_CONVERSATION', payload: id })
                        if (state.currentConversationId === id) {
                            const nextConversation = state.conversations.find(conv => conv.id !== id)
                            if (nextConversation) {
                                router.push(`?id=${nextConversation.id}`)
                            } else {
                                router.push('/')
                            }
                        }
                    }}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                />
                <main className='flex-1'>
                    <div className='flex h-full flex-col'>
                        <ChatMessages messages={currentConversation?.messages ?? []} isTyping={state.isTyping} />
                        <div className='bg-background border-t p-3 md:p-4'>
                            <ChatInput
                                value={inputValue}
                                onChange={setInputValue}
                                onSubmit={handleSendMessage}
                                disabled={!currentConversation}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}

// Container component that handles the Suspense
function ChatContainer() {
    return (
        <Suspense fallback={<div className='flex h-screen items-center justify-center'>Loading...</div>}>
            <ChatContainerInner />
        </Suspense>
    )
}

export default function ChatPage() {
    return <ChatContainer />
}
