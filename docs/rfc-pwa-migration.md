# RFC: PWA Migration with Legend State & TanStack Query

## Overview

This RFC proposes a migration strategy to transform the current Okto application into a Progressive Web App (PWA) with offline-first capabilities, real-time synchronization, and native-like performance.

## Goals

- Create a native-like PWA experience
- Implement offline-first architecture
- Provide real-time synchronization
- Optimize performance with fine-grained reactivity
- Maintain data consistency across sessions

## Technical Stack

### Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── ai//
│   │   ├── components/
│   │   ├── hooks/     # React hooks specific to AI
│   │   ├── services/  # Pure services without React
│   │   └── types/
│   └── auth/
│       ├── components/
│       ├── hooks/     # React hooks specific to auth
│       ├── services/  # Pure services without React
│       └── types/
├── lib/               # Pure utilities without React
│   ├── utils/
│   ├── constants/
│   └── types/
└── hooks/             # Global hooks
```

### Architectural Decisions

1. **Feature-First Organization**:

    - Each feature has its own complete structure
    - Includes its own hooks, services, and types
    - Facilitates maintenance and testing

2. **Clean Separation**:

    - `lib/`: Pure logic without React
    - `features/*/hooks/`: Hooks specific to each feature
    - `features/*/services/`: Pure business logic
    - `hooks/`: Shared hooks

3. **Dependency Rules**:
    - Services cannot depend on React
    - Hooks can use services and React
    - Components use hooks and services

### Core Technologies

- **Legend State**: State management and persistence
- **TanStack Query**: Remote data fetching and caching
- **Service Workers**: PWA capabilities
- **IndexedDB**: Local storage (via Legend State persist plugin)

## Architecture Design

### 1. State Management Layer

```typescript
// Global app state structure
const appState$ = observable({
    // UI State
    ui: {
        theme: 'light',
        isOnline: true,
        currentView: 'home',
        modals: {
            active: null,
            props: {},
        },
    },

    // User Session
    session: {
        token: null,
        userKeys: null,
        lastSync: null,
    },

    // Domain Data
    wallet: {
        assets: [],
        transactions: [],
        nfts: [],
    },
})

// Configure persistence
const persistConfig = configureSynced({
    persist: {
        plugin: observablePersistIndexedDB({
            indexedDB: {
                databaseName: 'OktoPWA',
                version: 1,
                tableNames: ['appState', 'cache'],
            },
        }),
        retrySync: true,
    },
    retry: {
        infinite: true,
        backoff: 'exponential',
        maxDelay: 30,
    },
})
```

### 2. API Integration Layer

```typescript
// API Client with TanStack Query integration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 30, // 30 minutes
            retry: 3,
        },
    },
})

// Synced queries with Legend State
export const useWalletAssets = (token: string) => {
    return syncedQuery({
        queryClient,
        query: {
            queryKey: ['wallet', 'assets', token],
            queryFn: () => oktoApi.getAssets(token),
            enabled: !!token,
            // Transform response to local state format
            select: data => ({
                assets: data.result.assets,
                lastUpdated: Date.now(),
            }),
        },
    })
}
```

### 3. UI Components with Fine-Grained Reactivity

```typescript
// Example of a reactive component
const WalletDashboard = observer(function WalletDashboard() {
  const { data, isLoading } = useWalletAssets(token)

  return (
    <div>
      <Show
        if={isLoading}
        else={() => (
          <For each={appState$.wallet.assets} optimized>
            {(asset$) => (
              <Memo>
                <AssetCard asset={asset$.get()} />
              </Memo>
            )}
          </For>
        )}
      >
        <LoadingSpinner />
      </Show>
    </div>
  )
})
```

## Implementation Phases

### Phase 1: State Management Setup

1. Configure Legend State with IndexedDB persistence
2. Set up basic state structure
3. Implement state synchronization logic

### Phase 2: API Integration

1. Set up TanStack Query client
2. Create API integration layer
3. Implement offline queue for mutations

### Phase 3: UI Components

1. Create base reactive components
2. Implement optimized rendering patterns
3. Add loading and error states

### Phase 4: PWA Features

1. Configure service worker
2. Add manifest.json
3. Implement push notifications
4. Add install prompts

## Offline-First Strategy

1. **Local-First Updates**

```typescript
// Example of optimistic updates
const updateAsset = async (assetId: string, update: AssetUpdate) => {
    // Update local state immediately
    appState$.wallet.assets[assetId].set(update)

    try {
        // Sync to server
        await oktoApi.updateAsset(assetId, update)
    } catch (error) {
        // Queue failed update for retry
        appState$.pendingUpdates.push({
            type: 'ASSET_UPDATE',
            payload: { assetId, update },
            timestamp: Date.now(),
        })
    }
}
```

2. **Sync Queue Management**

```typescript
// Process pending updates when online
effect(() => {
    const isOnline = appState$.ui.isOnline.get()
    const pendingUpdates = appState$.pendingUpdates.get()

    if (isOnline && pendingUpdates.length > 0) {
        processPendingUpdates()
    }
})
```

## Performance Considerations

1. **Component Optimization**

- Use `Memo` for static content
- Implement `For` with `optimized` prop for lists
- Use `Show` for conditional rendering

2. **Data Fetching**

- Implement proper cache invalidation
- Use stale-while-revalidate pattern
- Batch API requests where possible

## Migration Steps

1. **Initial Setup**

```bash
# Install required dependencies
npm install @legendapp/state @tanstack/react-query
```

2. **State Migration**

- Identify current state management patterns
- Map existing state to new structure
- Implement persistence layer

3. **Component Migration**

- Start with leaf components
- Move up component tree
- Add fine-grained reactivity

## Testing Strategy

1. **Unit Tests**

- Test state transformations
- Verify persistence logic
- Validate sync mechanisms

2. **Integration Tests**

- Test offline capabilities
- Verify sync recovery
- Validate optimistic updates

## Monitoring & Analytics

1. **Performance Metrics**

- Track render counts
- Monitor state updates
- Measure sync latency

2. **Error Tracking**

- Log sync failures
- Monitor offline queue
- Track API errors

## Security Considerations

1. **Data Encryption**

- Encrypt sensitive data in IndexedDB
- Secure token storage
- Implement proper key management

## Future Considerations

1. **Scalability**

- Implement state partitioning
- Add lazy loading for large datasets
- Optimize persistence strategy

2. **Feature Expansion**

- Add real-time collaboration
- Implement conflict resolution
- Add multi-device sync
