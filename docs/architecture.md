# Application Wallet Architecture

## Overview

The application Wallet is designed as a Progressive Web App (PWA) with offline-first capabilities, real-time synchronization, and native-like performance. The architecture is based on a stateless approach for UI components, while state management and data handling are managed through reactive services.

## Key Technologies

- **Next.js**: React framework for rendering and routing
- **Legend State**: Reactive state management and persistence
- **TanStack Query**: API request management and caching
- **Okto SDK**: Blockchain interaction and wallet management
- **Next-Auth**: OAuth authentication with providers (Google)
- **Tailwind CSS**: Styles and UI components

## Authentication Flow

### User already authenticated

1. The app loads a stateless app-shell with animations and basic UI
2. The existing session is validated using Next-Auth
3. The Google ID token is used to initialize the Okto client
4. Once the client is initialized, the TanStack Query queries are activated
5. The obtained data is synchronized with Legend State
6. The reactive components connected to Legend State are updated automatically

### User not authenticated

1. The absence of a session is detected and the user is redirected to the login page
2. The user authenticates with Google using Next-Auth
3. The Google ID token is obtained and the Okto client is initialized
4. The same data flow as in the previous case is followed

## Data Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Componentes   │◄────┤  Legend State   │◄────┤ TanStack Query  │
│     React       │     │  (Observable)   │     │   (Cache/API)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  Cliente Okto   │
                                               │                 │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │   APIs Okto     │
                                               │                 │
                                               └─────────────────┘
```

## Data Flow for Wallet Balance

1. The `BalanceDisplay` component uses the `useWalletBalance` hook
2. `useWalletBalance` obtains the session token and configures a query with TanStack Query
3. When the query is activated, `oktoApi.getAssets(token)` is called
4. The API response is processed to extract the total balance
5. The balance is stored in the observable `walletBalance$`
6. The `BalanceDisplay` component updates automatically when the observable changes

## Design Principles

1. **Stateless UI**: The components do not maintain their own state, only consume observables
2. **Granular Reactivity**: Only the components affected by data changes are rendered
3. **Offline-First**: Data is persisted locally and synchronized when there is a connection
4. **Native Experience**: Smooth animations, gestures, and transitions for a native experience
5. **Separation of Responsibilities**:
    - Components: Rendering and user events
    - Hooks: Connection between components and state
    - Stores: State management and persistence
    - Services: Business logic and API communication

## Folder Structure

```
src/
  ├── app/                # Routes and layouts of Next.js
  ├── components/         # Reusable UI components
  ├── features/           # Functional modules
  │   ├── assets/         # Asset/token management
  │   ├── auth/           # Authentication and session
  │   ├── wallet/         # Wallet functionality
  │   └── shared/         # Shared components and logic
  ├── lib/                # Utilities and configuration
  │   ├── api/            # API clients
  │   ├── stores/         # Legend State stores
  │   └── utils/          # Utility functions
  ├── providers/          # Context providers
  └── styles/             # Global styles
```

## Implementation of Wallet Balance

The wallet balance is obtained through the `getAssets` API of Okto. The response from this API contains the total value in USD of all user assets. This value is extracted and stored in the observable `walletBalance$`, which is consumed by the `BalanceDisplay` component.

It is crucial to ensure that:

1. The query is activated correctly when the token is available
2. The API response is processed correctly to extract the balance
3. The observable is updated with the correct value
4. The component subscribes correctly to the observable

## Debugging and Monitoring

To facilitate debugging, detailed logs have been implemented at critical points in the data flow:

1. Initialization of the Okto client
2. Query configuration
3. API response processing
4. Observable updates
5. Component rendering

These logs allow identifying problems in the data flow and ensuring that each step is executed correctly.
