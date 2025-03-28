import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/chat'
import { Check, MessageSquare, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'

interface ChatSidebarProps {
    conversations: Conversation[]
    currentConversationId: string | null
    onSelectConversation: (conversation: Conversation) => void
    onNewConversation: () => void
    onRenameConversation: (id: string, newTitle: string) => void
    onDeleteConversation: (id: string) => void
    isMobileMenuOpen: boolean
    setIsMobileMenuOpen: (isOpen: boolean) => void
}

export default function ChatSidebar({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onRenameConversation,
    onDeleteConversation,
    isMobileMenuOpen,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setIsMobileMenuOpen,
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const handleStartRename = (id: string, currentTitle: string) => {
        setEditingId(id)
        setEditingTitle(currentTitle)
    }

    const handleSaveRename = (id: string) => {
        if (editingTitle.trim()) {
            onRenameConversation(id, editingTitle.trim())
        }
        setEditingId(null)
    }

    const handleCancelRename = () => {
        setEditingId(null)
    }

    return (
        <div
            className={cn(
                'bg-background fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            )}>
            <div className='flex h-full flex-col'>
                <div className='flex items-center justify-between p-4'>
                    <h2 className='text-lg font-semibold'>Conversations</h2>
                    <Button variant='outline' size='icon' onClick={onNewConversation} className='h-8 w-8'>
                        <Plus className='h-4 w-4' />
                        <span className='sr-only'>New Conversation</span>
                    </Button>
                </div>

                <div className='px-3'>
                    <div className='relative'>
                        <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                        <Input
                            placeholder='Search conversations...'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='pl-8'
                        />
                    </div>
                </div>

                <nav className='flex-1 space-y-1 p-3'>
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(conversation => (
                            <div key={conversation.id} className='relative'>
                                {editingId === conversation.id ? (
                                    <div className='flex w-full items-center space-x-1 rounded-md border p-1'>
                                        <input
                                            type='text'
                                            value={editingTitle}
                                            onChange={e => setEditingTitle(e.target.value)}
                                            className='flex-1 bg-transparent px-1 focus:outline-none'
                                            autoFocus
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    handleSaveRename(conversation.id)
                                                } else if (e.key === 'Escape') {
                                                    handleCancelRename()
                                                }
                                            }}
                                        />
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-6 w-6'
                                            onClick={() => handleSaveRename(conversation.id)}>
                                            <Check className='h-3 w-3' />
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-6 w-6'
                                            onClick={handleCancelRename}>
                                            <X className='h-3 w-3' />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='group relative flex items-center'>
                                        <button
                                            onClick={() => onSelectConversation(conversation)}
                                            className={cn(
                                                'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                                conversation.id === currentConversationId && 'bg-accent',
                                            )}>
                                            <MessageSquare className='h-4 w-4' />
                                            <span className='truncate'>{conversation.title}</span>
                                        </button>

                                        <div className='absolute top-1/2 right-0 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant='ghost' size='icon' className='h-7 w-7'>
                                                        <Pencil className='h-3 w-3' />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align='end' className='w-40'>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleStartRename(conversation.id, conversation.title)
                                                        }>
                                                        <Pencil className='mr-2 h-4 w-4' />
                                                        <span>Rename</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteConversation(conversation.id)}
                                                        className='text-destructive focus:text-destructive'>
                                                        <Trash2 className='mr-2 h-4 w-4' />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                            No conversations found
                        </div>
                    )}
                </nav>

                <div className='p-3'>
                    <Button variant='outline' className='w-full justify-start' onClick={onNewConversation}>
                        <Plus className='mr-2 h-4 w-4' />
                        New Conversation
                    </Button>
                </div>
            </div>
        </div>
    )
}
