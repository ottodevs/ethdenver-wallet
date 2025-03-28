import type { ChatAction, ChatContextType, ChatState } from '@/types/chat'
import { createContext, useContext, useReducer, type ReactNode } from 'react'

const initialState: ChatState = {
    conversations: [],
    currentConversationId: null,
    isTyping: false,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
    switch (action.type) {
        case 'SET_CONVERSATIONS':
            return {
                ...state,
                conversations: action.payload,
            }
        case 'SET_CURRENT_CONVERSATION':
            return {
                ...state,
                currentConversationId: action.payload,
            }
        case 'ADD_CONVERSATION':
            return {
                ...state,
                conversations: [action.payload, ...state.conversations],
                currentConversationId: action.payload.id,
            }
        case 'UPDATE_CONVERSATION':
            return {
                ...state,
                conversations: state.conversations.map(conv => (conv.id === action.payload.id ? action.payload : conv)),
            }
        case 'DELETE_CONVERSATION':
            return {
                ...state,
                conversations: state.conversations.filter(conv => conv.id !== action.payload),
                currentConversationId:
                    state.currentConversationId === action.payload
                        ? (state.conversations.find(conv => conv.id !== action.payload)?.id ?? null)
                        : state.currentConversationId,
            }
        case 'ADD_MESSAGE':
            return {
                ...state,
                conversations: state.conversations.map(conv =>
                    conv.id === action.payload.conversationId
                        ? {
                              ...conv,
                              messages: [...conv.messages, action.payload.message],
                              updatedAt: new Date().toISOString(),
                          }
                        : conv,
                ),
            }
        case 'SET_TYPING':
            return {
                ...state,
                isTyping: action.payload,
            }
        default:
            return state
    }
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(chatReducer, initialState)

    return <ChatContext.Provider value={{ state, dispatch }}>{children}</ChatContext.Provider>
}

export function useChatContext() {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider')
    }
    return context
}
