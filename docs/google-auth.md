# Google Authentication Service

## Overview

The Google Authentication Service provides a comprehensive solution for authenticating users with Google, supporting multiple authentication methods:

1. **FedCM (Federated Credential Management)** - A modern, privacy-preserving authentication API
2. **Google Identity Services (One Tap)** - Google's recommended authentication flow
3. **Traditional OAuth** - Fallback authentication method

## Architecture

The authentication system is split into two main components:

1. **GoogleAuthService** - A standalone class that handles all authentication logic
2. **useGoogleAuth** - A React hook that provides a React-friendly interface to the service

This separation allows for:

- Better testability of the authentication logic
- Potential reuse in non-React environments
- Cleaner code organization

## GoogleAuthService

The `GoogleAuthService` class manages:

- Detection of supported authentication methods
- Initialization of Google Identity Services
- FedCM credential management
- Authentication flows
- State management

### Key Methods

- `checkFedCMSupport()` - Detects if FedCM is available in the current browser
- `checkOneTapSupport()` - Checks if Google One Tap is supported
- `initializeGoogleIdentity()` - Sets up Google Identity Services
- `authenticateWithFedCM()` - Attempts authentication via FedCM
- `signInWithGoogle()` - Initiates traditional OAuth flow

## useGoogleAuth Hook

The React hook provides a simple interface to the service, exposing:

- Current authentication state
- Authentication methods
- Reference to button container for rendering Google buttons

### Usage Example

```tsx
function LoginComponent() {
    const { isFedCMAvailable, isAuthenticating, authenticateWithFedCM, signInWithGoogle } = useGoogleAuth()

    return (
        <div>
            {isFedCMAvailable ? (
                <button onClick={authenticateWithFedCM} disabled={isAuthenticating}>
                    Sign in with Google (FedCM)
                </button>
            ) : (
                <button onClick={signInWithGoogle} disabled={isAuthenticating}>
                    Sign in with Google
                </button>
            )}
        </div>
    )
}
```

## Authentication Flow

1. On initialization, the service detects available authentication methods
2. If FedCM is available, it attempts to silently obtain credentials
3. When user initiates login:
    - If FedCM is available, it tries FedCM authentication first
    - If FedCM fails or is unavailable, it falls back to OAuth
4. Authentication tokens are passed to NextAuth.js for session management

## Browser Compatibility

- FedCM: Chrome 108+ and other Chromium-based browsers
- Google Identity Services: Most modern browsers
- OAuth: All browsers
