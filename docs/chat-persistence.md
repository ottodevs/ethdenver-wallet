# Chat Persistence Implementation

This document explains how chat persistence is implemented in the Aeris AI assistant.

## Overview

The chat persistence system allows users to maintain their conversation history across page refreshes and browser sessions. It uses a combination of:

1. **Client-side storage**: Using localStorage to persist chat messages on the client
2. **Server-side storage**: Using an in-memory store (would be replaced with a database in production)
3. **URL-based chat identification**: Using URL parameters to identify and load specific chats

## Components

### 1. Chat Store Service

Located at `src/features/ai/services/chat-store.ts`, this service provides functions for:

- Creating new chats
- Loading chat messages
- Saving chat messages
- Listing all chats
- Deleting chats

In the current implementation, it uses an in-memory Map for storage. In a production environment, this would be replaced with a database like MongoDB, PostgreSQL, or a specialized vector database.

### 2. Persistent Chat Hook

Located at `src/features/ai/hooks/use-persistent-chat.ts`, this custom React hook extends the Vercel AI SDK's `useChat` hook to add persistence functionality:

- Loads chat messages from localStorage on initial render
- Saves chat messages to localStorage after each message
- Provides functions for creating new chats and clearing the current chat
- Sends the chat ID with each request to the API

### 3. Chat API Route

Located at `src/app/api/chat/route.ts`, this API route:

- Receives messages and the chat ID from the client
- Implements rate limiting based on user tier (free vs premium)
- Streams responses from the AI model
- Saves the chat to the server-side store after completion
- Uses `consumeStream()` to ensure the chat is saved even if the client disconnects

### 4. Chat History Component

Located at `src/features/ai/components/chat-history.tsx`, this component:

- Displays a list of past conversations
- Allows users to switch between conversations
- Provides options to create new chats and delete existing ones
- Extracts titles from the first user message in each chat

### 5. Ask Page Layout

Located at `src/app/(pages)/ask/layout.tsx`, this layout component:

- Wraps the chat interface with the chat history sidebar
- Provides a function for creating new chats

## Flow

1. User navigates to `/ask`
2. If no chat ID is provided, they are redirected to `/ask/new`, which generates a new chat ID and redirects to `/ask?id={newId}`
3. The chat interface loads and checks localStorage for existing messages with the current chat ID
4. When the user sends a message:
    - The message is sent to the API with the chat ID
    - The API processes the message and streams the response
    - The response is saved to both localStorage and the server-side store
5. If the user refreshes the page, the chat is loaded from localStorage
6. The user can switch between past conversations using the chat history sidebar

## Rate Limiting

The system implements rate limiting to prevent abuse:

- Free tier: 10 requests per hour
- Premium tier: 50 requests per hour

In a production environment, this would be integrated with a user authentication system and a proper subscription management system.

## Testing

Tests for the chat persistence functionality are located at `src/__tests__/features/ai/hooks/use-persistent-chat.test.tsx`.

## Future Improvements

1. Replace the in-memory store with a proper database
2. Implement user authentication and tie chats to user accounts
3. Add chat title editing
4. Implement chat export/import functionality
5. Add chat sharing capabilities
6. Implement chat search functionality
7. Add chat categorization/tagging
