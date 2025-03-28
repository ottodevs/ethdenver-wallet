import type { Conversation } from '@/types/chat'

const mockData = {
    conversations: [
        {
            id: 'conv-1',
            title: 'Getting Started',
            messages: [
                {
                    id: 'msg-1',
                    content: "Hi there! I'm your AI assistant. How can I help you today?",
                    role: 'assistant' as const,
                    timestamp: '2024-03-17T12:00:00.000Z',
                },
            ],
            createdAt: '2024-03-17T12:00:00.000Z',
            updatedAt: '2024-03-17T12:00:00.000Z',
        },
        {
            id: 'conv-2',
            title: 'Help with TypeScript',
            messages: [
                {
                    id: 'msg-2',
                    content: 'Can you explain TypeScript generics?',
                    role: 'user' as const,
                    timestamp: '2024-03-17T12:05:00.000Z',
                },
                {
                    id: 'msg-3',
                    content:
                        "TypeScript generics allow you to write flexible, reusable code that works with multiple types while maintaining type safety. Here's a simple example:\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\n// Usage\nconst num = identity(123);     // Type is number\nconst str = identity('hello'); // Type is string\n```\n\nGenerics are particularly useful for collections, promises, and components that need to work with different types.",
                    role: 'assistant' as const,
                    timestamp: '2024-03-17T12:05:30.000Z',
                },
            ],
            createdAt: '2024-03-17T12:05:00.000Z',
            updatedAt: '2024-03-17T12:05:30.000Z',
        },
    ] as Conversation[],
}

export default mockData
