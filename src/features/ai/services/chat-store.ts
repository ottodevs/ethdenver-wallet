import type { Message } from 'ai'
import { generateId } from 'ai'

// Type for chat metadata
export interface ChatMetadata {
    id: string
    title: string
    createdAt: string
    updatedAt: string
}

// Server-side chat storage (would be replaced with a database in production)
const chatStore = new Map<string, Message[]>()

/**
 * Create a new chat and return its ID
 */
export async function createChat(): Promise<string> {
    const id = generateId()
    await saveChat({ id, messages: [] })
    return id
}

/**
 * Load chat messages by ID
 */
export async function loadChat(id: string): Promise<Message[]> {
    // In a real app, this would fetch from a database
    return chatStore.get(id) || []
}

/**
 * Save chat messages
 */
export async function saveChat({ id, messages }: { id: string; messages: Message[] }): Promise<void> {
    // In a real app, this would save to a database
    chatStore.set(id, messages)
}

/**
 * List all chats with metadata
 */
export async function listChats(): Promise<ChatMetadata[]> {
    // In a real app, this would query a database
    return Array.from(chatStore.entries()).map(([id]) => ({
        id,
        title: `Chat ${id.substring(0, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }))
}

/**
 * Delete a chat by ID
 */
export async function deleteChat(id: string): Promise<void> {
    // In a real app, this would delete from a database
    chatStore.delete(id)
}
