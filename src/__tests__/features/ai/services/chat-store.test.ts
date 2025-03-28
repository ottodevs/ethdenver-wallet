import { createChat, deleteChat, listChats, loadChat, saveChat } from '@/features/ai/services/chat-store'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the generateId function
vi.mock('ai', () => ({
    generateId: () => 'mock-chat-id',
}))

describe('chat-store', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()
    })

    it('should create a new chat', async () => {
        const chatId = await createChat()

        // Check if the chat ID is correct
        expect(chatId).toBe('mock-chat-id')

        // Check if the chat was saved
        const messages = await loadChat(chatId)
        expect(messages).toEqual([])
    })

    it('should save and load chat messages', async () => {
        const chatId = 'test-chat-id'
        const messages = [
            { id: 'msg1', role: 'user' as const, content: 'Hello' },
            { id: 'msg2', role: 'assistant' as const, content: 'Hi there!' },
        ]

        // Save the chat
        await saveChat({ id: chatId, messages })

        // Load the chat
        const loadedMessages = await loadChat(chatId)

        // Check if the loaded messages match the saved messages
        expect(loadedMessages).toEqual(messages)
    })

    it('should return empty array when loading non-existent chat', async () => {
        const messages = await loadChat('non-existent-chat-id')

        // Check if an empty array is returned
        expect(messages).toEqual([])
    })

    it('should list all chats', async () => {
        // Create some chats
        await saveChat({ id: 'chat-id-1', messages: [] })
        await saveChat({ id: 'chat-id-2', messages: [] })

        // List the chats
        const chats = await listChats()

        // Check if the chats are listed
        expect(chats.length).toBeGreaterThanOrEqual(2)
        expect(chats.some(chat => chat.id === 'chat-id-1')).toBe(true)
        expect(chats.some(chat => chat.id === 'chat-id-2')).toBe(true)
    })

    it('should delete a chat', async () => {
        const chatId = 'chat-to-delete'

        // Create a chat
        await saveChat({ id: chatId, messages: [] })

        // Check if the chat exists
        let messages = await loadChat(chatId)
        expect(messages).toEqual([])

        // Delete the chat
        await deleteChat(chatId)

        // Check if the chat was deleted
        messages = await loadChat(chatId)
        expect(messages).toEqual([])
    })
})
