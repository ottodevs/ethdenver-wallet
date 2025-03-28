export type MessageRole = 'user' | 'assistant'

export interface Message {
    id: string
    content: string
    role: MessageRole
    timestamp: string
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: string
    updatedAt: string
}

export interface ChatState {
    conversations: Conversation[]
    currentConversationId: string | null
    isTyping: boolean
}

export interface ChatContextType {
    state: ChatState
    dispatch: React.Dispatch<ChatAction>
}

export type ChatAction =
    | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
    | { type: 'SET_CURRENT_CONVERSATION'; payload: string }
    | { type: 'ADD_CONVERSATION'; payload: Conversation }
    | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
    | { type: 'DELETE_CONVERSATION'; payload: string }
    | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
    | { type: 'SET_TYPING'; payload: boolean }
