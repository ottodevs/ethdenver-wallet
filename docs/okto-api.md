# Okto API Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
    - [Headers](#headers)
    - [Authorization Token Format](#authorization-token-format)
    - [Token Lifecycle](#token-lifecycle)
4. [API Endpoints](#api-endpoints)
    - [Account Management](#account-management)
        - [Get User Keys](#get-user-keys)
    - [Transaction Management](#transaction-management)
    - [Asset Management](#asset-management)
5. [Implementation Guide](#implementation-guide)
    - [TanStack Query Setup](#tanstack-query-setup)
    - [Legend State Integration](#legend-state-integration)
    - [Usage Examples](#usage-examples)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)
8. [Best Practices](#best-practices)

## Introduction

This document outlines the Okto API endpoints and their usage based on observed interactions. This documentation will help implement a custom client using TanStack Query and Legend State.

## Base URL

- Sandbox: `https://sandbox-okto-gateway.oktostage.com/rpc`

## Authentication

### Headers

```typescript
{
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "Authorization": "Bearer ${token}"
}
```

### Authorization Token Format

The authorization token is a base64 encoded JSON object with the following structure:

```typescript
{
  "type": "ecdsa_uncompressed",
  "data": {
    "expire_at": number, // Unix timestamp (current time + 90 minutes)
    "session_pub_key": string // Uncompressed public key with 0x prefix
  },
  "data_signature": string // Message signature
}
```

## API Endpoints

### Account Management

#### Get User Keys

Retrieves the user's cryptographic keys and wallet information.

**Request:**

```typescript
{
  "method": "getUserKeys",
  "jsonrpc": "2.0",
  "id": string, // UUID
  "params": []
}
```

**Response:**

```typescript
{
  "jsonrpc": "2.0",
  "id": string, // Same UUID as request
  "result": {
    "userId": string,
    "userSWA": string, // Smart Wallet Address
    "ecdsaPublicKey": string,
    "eddsaPublicKey": string,
    "ecdsaKeyId": string,
    "eddsaKeyId": string
  }
}
```

### Transaction Management

Coming soon:

- `sendTransaction`
- `signMessage`
- `estimateGas`

### Asset Management

Coming soon:

- `getAssets`
- `getTransactionHistory`
- `getNFTs`

## Implementation Guide

Here's how we could implement a custom Okto client using TanStack Query and Legend State:

```typescript
import { observable } from '@legendapp/state'
import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

// State store
export const oktoState$ = observable({
    userKeys: null,
    isInitialized: false,
    error: null,
})

// API client
export const oktoApi = {
    getUserKeys: async (token: string) => {
        const response = await fetch('https://sandbox-okto-gateway.oktostage.com/rpc', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                method: 'getUserKeys',
                jsonrpc: '2.0',
                id: crypto.randomUUID(),
                params: [],
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to fetch user keys')
        }

        return response.json()
    },
}

// Query hook
export const useOktoUserKeys = (token: string) => {
    return syncedQuery({
        queryClient,
        query: {
            queryKey: ['okto', 'userKeys', token],
            queryFn: () => oktoApi.getUserKeys(token),
            enabled: !!token,
        },
    })
}
```

## Usage Examples

```typescript
import { observer } from '@legendapp/state/react'
import { useOktoUserKeys } from './okto.store'

export const WalletComponent = observer(function WalletComponent() {
  const { data, isLoading } = useOktoUserKeys(token)

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div>Wallet Address: {data.result.userSWA}</div>
    </div>
  )
})
```

## Error Handling

Common error codes and their meaning:

- 401: Unauthorized - Invalid or expired token
- 403: Forbidden - Insufficient permissions
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error

## Rate Limits

- Default rate: TBD requests per minute
- Burst rate: TBD requests per second
- Rate limits are applied per API key

## Best Practices

1. Implement token refresh mechanism
2. Use request queuing for concurrent calls
3. Implement proper error handling
4. Cache responses when appropriate
5. Monitor rate limits
