# Migration Plan: PWA with Legend State & TanStack Query

## 1. State Management Migration

### Core State Store Structure

```typescript
// src/lib/stores/app.store.ts

import { observable, computed } from '@legendapp/state'
import { persistObservable } from '@legendapp/state/persist'
import { persistPluginIndexedDB } from '@legendapp/state/persist-plugins/indexedDB'

export const appState$ = observable({
    ui: {
        theme: 'dark',
        isOnline: true,
        modals: {},
        notifications: [],
    },
    wallet: {
        selectedChain: null,
        assets: {},
        transactions: {},
        pendingTransactions: {},
    },
    auth: {
        session: null,
        userKeys: null,
        lastSync: null,
    },
})

// Configure persistence
persistObservable(appState$, {
    local: 'okto-app-state',
    persistLocal: persistPluginIndexedDB,
})
```

### Files to Modify

1. **Authentication Flow**

```typescript
//src/features/auth/contexts/auth-context.tsx

startLine: 44
endLine: 116
```

2. **Transaction Service**

```typescript
//src/features/assets/services/token-transfer-service.tsx

startLine: 29
endLine: 73
```

3. **Account State**

```typescript
//src/features/shared/state/account-state.ts
startLine: 43
endLine: 89
```

## 2. API Integration Layer

### Create New API Client

```typescript
//src/lib/api/okto-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            cacheTime: 1000 * 60 * 30,
            retry: 3,
            networkMode: 'offlineFirst',
        },
    },
})

export const createOktoApi = (baseUrl: string) => {
    // API implementation
}
```

### New Files Structure

```bash
src/
  features/
    assets/
      components/
      hooks/
        use-assets.ts
        use-transactions.ts
      services/
        token-transfer-service.ts
      types/
    auth/
      components/
      hooks/
        use-auth.ts
        use-user-keys.ts
      services/
        auth-service.ts
      types/
    shared/
      components/
      hooks/
        use-online-status.ts
      services/
        sync-service.ts
      types/
  lib/
    api/
      okto-client.ts
    utils/
      crypto.ts
      validation.ts
    constants/
      config.ts
    types/
      api.ts
  hooks/
    use-persistence.ts
    use-sync.ts
```

## 3. Migration Phases

### Phase 1: Core Setup (Week 1)

1. Install dependencies
2. Set up Legend State stores
3. Configure persistence layer

### Phase 2: State Migration (Week 2)

1. Migrate authentication state
2. Migrate wallet state
3. Migrate transaction state

### Phase 3: API Integration (Week 3)

1. Implement TanStack Query setup
2. Create API hooks
3. Add offline support

### Phase 4: PWA Features (Week 4)

1. Add service worker
2. Configure caching
3. Implement offline UI

## 4. Testing Strategy

### Unit Tests

- State persistence
- Offline sync
- Error handling

### Integration Tests

- Online/offline flows
- Data synchronization
- State transitions

### E2E Tests

- Offline scenarios
- Multi-device sync
- Performance metrics

## 5. Rollout Strategy

### Stage 1: Development

1. Set up development environment
2. Implement core features
3. Initial testing

### Stage 2: Beta Testing

1. Internal testing
2. Performance monitoring
3. Bug fixes

### Stage 3: Production

1. Gradual rollout
2. Monitor metrics
3. Gather feedback
