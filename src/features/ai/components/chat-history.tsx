'use client'

import { useToast } from '@/components/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Edit2, MessageSquare, MoreHorizontal, Plus, Search, Trash } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ChatHistoryProps {
    onNewChat: () => void
    onChatSelected?: () => void
}

interface ChatItem {
    id: string
    title: string
    active: boolean
    isEmpty: boolean
    lastUsed: number
}

// Define the interface for the messages in localStorage
interface StoredMessage {
    id: string
    role: string
    content: string
    parts?: Array<{ type: string; text: string }>
}

export function ChatHistory({ onNewChat, onChatSelected }: ChatHistoryProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentChatId = searchParams.get('id')
    const { toast } = useToast()

    const [chats, setChats] = useState<ChatItem[]>([])
    const [filteredChats, setFilteredChats] = useState<ChatItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [editingChat, setEditingChat] = useState<ChatItem | null>(null)
    const [newTitle, setNewTitle] = useState('')
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
    const [_touchStartTime, setTouchStartTime] = useState<number | null>(null)

    // Load chat history from localStorage
    useEffect(() => {
        // Define the loadChats function inside the effect to ensure it has access to the latest state
        const loadChatsFromStorage = () => {
            // Get all chat IDs from localStorage
            const chatIds = Object.keys(localStorage)
                .filter(key => key.startsWith('chat:') && !key.includes(':lastUsed') && !key.includes(':title'))
                .map(key => key.replace('chat:', ''))

            // Create chat items from localStorage data
            const chatItems = chatIds.map(id => {
                const title = localStorage.getItem(`chat:${id}:title`) || `Chat ${id.substring(0, 6)}`
                const lastUsed = parseInt(localStorage.getItem(`chat:${id}:lastUsed`) || '0', 10)
                let isEmpty = false

                try {
                    // Try to parse chat data
                    const chatData = localStorage.getItem(`chat:${id}`)
                    if (chatData) {
                        const messages = JSON.parse(chatData) as StoredMessage[]
                        // Check if chat is empty (no messages or only welcome message)
                        isEmpty =
                            messages.length === 0 ||
                            (messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === 'welcome')
                    }
                } catch (e) {
                    console.error('Failed to parse chat data:', e)
                }

                return {
                    id,
                    title,
                    active: id === currentChatId,
                    isEmpty,
                    lastUsed,
                }
            })

            // Sort by most recently used
            chatItems.sort((a, b) => b.lastUsed - a.lastUsed)

            setChats(chatItems)
            setFilteredChats(chatItems)
        }

        // Load chats immediately
        loadChatsFromStorage()

        // Set up an interval to check for new chats periodically
        const intervalId = setInterval(loadChatsFromStorage, 1000)

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId)
    }, [currentChatId])

    // Filter chats when search query changes
    useEffect(() => {
        if (!searchQuery) {
            setFilteredChats(chats)
        } else {
            const filtered = chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
            setFilteredChats(filtered)
        }
    }, [searchQuery, chats])

    // Update last used timestamp when switching chats
    useEffect(() => {
        if (currentChatId) {
            localStorage.setItem(`chat:${currentChatId}:lastUsed`, Date.now().toString())
        }
    }, [currentChatId])

    const handleChatClick = (id: string) => {
        router.push(`${pathname}?id=${id}`)
        // Call the onChatSelected callback if provided (for mobile view switching)
        if (onChatSelected) {
            onChatSelected()
        }
    }

    const handleDeleteChat = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        if (e) {
            e.stopPropagation()
        }

        localStorage.removeItem(`chat:${id}`)
        localStorage.removeItem(`chat:${id}:lastUsed`)
        localStorage.removeItem(`chat:${id}:title`)

        // Remove from state
        setChats(chats.filter(chat => chat.id !== id))
        setFilteredChats(filteredChats.filter(chat => chat.id !== id))

        // If we deleted the current chat, find an empty chat or create a new one
        if (id === currentChatId) {
            const emptyChat = chats.find(chat => chat.isEmpty && chat.id !== id)
            if (emptyChat) {
                router.push(`${pathname}?id=${emptyChat.id}`)
            } else {
                onNewChat()
            }
        }

        toast({
            title: 'Chat deleted',
            description: 'The chat has been deleted successfully',
        })
    }

    const handleEditChat = (e: React.MouseEvent | React.TouchEvent | null, chat: ChatItem) => {
        if (e) {
            e.stopPropagation()
        }
        setEditingChat(chat)
        setNewTitle(chat.title)
        setIsEditDialogOpen(true)
    }

    const saveTitle = () => {
        if (editingChat && newTitle.trim()) {
            localStorage.setItem(`chat:${editingChat.id}:title`, newTitle.trim())

            // Update state
            const updatedChats = chats.map(chat =>
                chat.id === editingChat.id ? { ...chat, title: newTitle.trim() } : chat,
            )
            setChats(updatedChats)
            setFilteredChats(
                updatedChats.filter(
                    chat => !searchQuery || chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
                ),
            )

            setIsEditDialogOpen(false)
            setEditingChat(null)

            toast({
                title: 'Title updated',
                description: 'The chat title has been updated successfully',
            })
        }
    }

    // Touch event handlers for mobile
    const handleTouchStart = (chat: ChatItem) => {
        setTouchStartTime(Date.now())
        const timer = setTimeout(() => {
            handleEditChat(null, chat)
        }, 500) // 500ms long press
        setLongPressTimer(timer)
    }

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer)
            setLongPressTimer(null)
        }
        setTouchStartTime(null)
    }

    const handleTouchMove = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer)
            setLongPressTimer(null)
        }
    }

    const handleBackToHome = () => {
        router.push('/')
    }

    return (
        <Sidebar className='border-r border-gray-800 bg-[#0D0D15] shadow-md'>
            <SidebarHeader className='flex flex-col border-b border-gray-800 bg-[#1A1A28]'>
                <div className='flex items-center justify-between p-4'>
                    <div className='flex items-center'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleBackToHome}
                            className='mr-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white'>
                            <ArrowLeft className='h-5 w-5' />
                        </Button>
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className='text-lg font-semibold text-white'>
                            Aeris AI
                        </motion.h2>
                    </div>
                    <SidebarTrigger className='text-gray-400 transition-colors hover:bg-gray-800 hover:text-white' />
                </div>

                <div className='px-4 pb-3'>
                    <div className='relative'>
                        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500' />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder='Search chats...'
                            className='border-gray-800 bg-[#0D0D15] pl-9 text-sm text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                        />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className='bg-[#0D0D15]'>
                <div className='px-4 py-3'>
                    <Button
                        onClick={onNewChat}
                        className='w-full justify-start bg-[#4364F9] text-white shadow-md transition-colors hover:bg-blue-600'
                        variant='default'>
                        <Plus className='mr-2 h-4 w-4' />
                        <span>New Chat</span>
                    </Button>
                </div>

                <Separator className='my-2 bg-gray-800' />

                <SidebarMenu>
                    <AnimatePresence>
                        {filteredChats.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className='text-muted-foreground p-6 text-center text-sm'>
                                <MessageSquare className='mx-auto mb-2 h-10 w-10 opacity-50' />
                                {searchQuery ? (
                                    <>
                                        <p className='text-gray-400'>No chats found</p>
                                        <p className='mt-1 text-xs text-gray-500'>Try a different search term</p>
                                    </>
                                ) : (
                                    <>
                                        <p className='text-gray-400'>No chat history</p>
                                        <p className='mt-1 text-xs text-gray-500'>Start a new conversation</p>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            filteredChats.map((chat, index) => (
                                <motion.div
                                    key={chat.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.1, delay: index * 0.02 }}
                                    className='px-2 py-1'>
                                    <div
                                        className={`group relative flex w-full items-center justify-between rounded-md p-2 transition-all ${
                                            chat.active
                                                ? 'bg-[#1A1A28] text-white'
                                                : 'text-gray-300 hover:bg-[#1A1A28]/50'
                                        }`}>
                                        {/* Chat title button */}
                                        <button
                                            className='flex flex-grow items-center overflow-hidden text-left'
                                            onClick={() => handleChatClick(chat.id)}
                                            onTouchStart={() => handleTouchStart(chat)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchMove={handleTouchMove}>
                                            <MessageSquare
                                                className={`mr-2 h-4 w-4 shrink-0 transition-colors ${chat.active ? 'text-[#4364F9]' : 'text-gray-500'}`}
                                            />
                                            <span className='truncate'>{chat.title}</span>
                                        </button>

                                        {/* Dropdown menu */}
                                        <div className='flex items-center'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-8 w-8 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-800 hover:text-white'>
                                                        <MoreHorizontal className='h-4 w-4' />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align='end'
                                                    className='min-w-32 border-gray-800 bg-[#1A1A28] text-white'>
                                                    <DropdownMenuItem
                                                        onClick={e => handleEditChat(e, chat)}
                                                        className='cursor-pointer hover:bg-gray-800 focus:bg-gray-800'>
                                                        <Edit2 className='mr-2 h-4 w-4' />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={e => handleDeleteChat(e, chat.id)}
                                                        className='cursor-pointer text-red-400 hover:bg-gray-800 focus:bg-gray-800 focus:text-red-400'>
                                                        <Trash className='mr-2 h-4 w-4' />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className='border-t border-gray-800 bg-[#1A1A28] p-4'>
                <div className='flex h-[53px] items-center justify-center'>
                    <p className='flex items-center text-xs text-gray-400'>
                        <span className='mr-1'>Powered by</span>
                        <span className='font-semibold text-white'>Aeris AI</span>
                    </p>
                </div>
            </SidebarFooter>

            {/* Edit Chat Title Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className='border-gray-800 bg-[#1A1A28] text-white sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Enter a new title for this conversation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-3'>
                        <Input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder='Enter a new title'
                            autoFocus
                            className='border-gray-800 bg-[#0D0D15] text-white transition-all focus-visible:ring-[#4364F9]'
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    saveTitle()
                                }
                            }}
                        />
                        <div className='flex justify-end space-x-2'>
                            <Button
                                variant='outline'
                                onClick={() => setIsEditDialogOpen(false)}
                                className='border-gray-700 text-white hover:bg-gray-800 hover:text-white'>
                                Cancel
                            </Button>
                            <Button onClick={saveTitle} className='bg-[#4364F9] text-white hover:bg-blue-600'>
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Sidebar>
    )
}
