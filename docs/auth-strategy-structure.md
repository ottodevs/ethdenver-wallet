# Next.js App Structure & Authentication Strategy

## Overview

This document outlines a recommended architectural approach for structuring our blockchain-based portfolio management web application, focusing on Next.js best practices, efficient authentication management with NextAuth, and scalability with a feature-based modular structure.

The goal is to enhance maintainability, scalability, SSR performance, testing efficiency, and provide a native-like user experience (PWA/App Shell).

---

## Proposed Directory Structure

Simplify and clarify our existing structure by clearly grouping routes and features:

```bash
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx       # Public Login Page (Google OAuth)
│   ├── (dashboard)/            # Authenticated routes (middleware enforced)
│   │   ├── wallet/page.tsx
│   │   ├── send/page.tsx
│   │   ├── receive/page.tsx
│   │   ├── swap/page.tsx
│   │   ├── buy/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── chatbot/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── chat/route.ts
│   ├── layout.tsx              # Global App Shell (navigation, providers)
│   └── middleware.ts           # Global authentication enforcement
│
├── features/
│   ├── auth/
│   ├── wallet/
│   ├── transactions/
│   ├── chatbot/                # Renamed from ai for clarity
│   ├── assets/                 # Unify `tokens` and `nfts` here
│   └── shared/
│
├── lib/
│   ├── blockchain/             # wagmi, ethers.js or viem clients
│   └── utils/
│
└── components/ui/              # Generic shared UI components (buttons, inputs, etc.)
```

---

## Detailed Recommendations

### 1. Authentication Flow Adjustment

Invert the current authentication logic:

- **Public route:** `/login` (OAuth login page)
- **Protected routes** under `/dashboard/*`

**Example middleware (`middleware.ts`):**

```ts
export { default } from 'next-auth/middleware'

export const config = {
    matcher: ['/dashboard/:path*'], // enforce auth automatically
}
```

**Benefits:**

- Centralized auth logic, simple protection rules.
- Easy maintenance and clear redirection behavior.

---

### 2. Simplify Feature Structure

Current structure is slightly more complex than necessary. Simplify by combining similar features:

- Merge NFTs and tokens into a unified `assets` feature, sharing components and logic.

```
features/assets/
├── components/
│   ├── nft-gallery.tsx
│   ├── token-item.tsx
│   └── token-selector.tsx
├── hooks/
│   ├── use-nfts.ts
│   └── use-tokens.ts
└── services/
    ├── token-service.ts
    └── nft-service.ts
```

- Rename the AI feature clearly as `chatbot` for better domain clarity.

**Benefits:**

- Clearer domain representation.
- Reduced code duplication and easier team collaboration.

---

### 3. Adopt App Shell Layout Pattern

Implement a global app shell layout (`app/layout.tsx`):

```tsx
// layout.tsx example
export default function Layout({ children }) {
    return (
        <Providers>
            <Navigation />
            <main>{children}</main>
        </Providers>
    )
}
```

Use **React Server Components (RSC)** and HTTP streaming for fast rendering.

**Benefits:**

- Native app-like navigation experience.
- Better state management and reduced reloads.

---

### 3. Enhance UX with Progressive Web App (PWA)

Use [`next-pwa`](https://github.com/shadowwalker/next-pwa) to add offline-first support and caching.

**Setup example:**

```bash
npm install next-pwa
```

```js
// next.config.js
const withPWA = require('next-pwa')({
    dest: 'public',
})

module.exports = withPWA({})
```

**Benefits:**

- Faster load times and native feel on mobile and desktop.
- Offline-first capabilities enhancing user experience.

---

### 4. Decouple Blockchain SDKs and Services

Abstract blockchain logic in `lib/blockchain` to decouple your code from specific SDK implementations:

```shell
lib/
├── blockchain/
│   ├── wagmi-client.ts
│   ├── viem-client.ts
│   └── types.ts
```

Then, consume this abstraction in your feature-specific hooks (`features/wallet/hooks/use-wallet.tsx`).

**Benefits:**

- Easier unit testing and isolation.
- Facilitates future changes in blockchain SDK/library.

---

### 5. Testing and Quality Assurance

- Write unit tests for all hooks (`use-wallet`, `use-chatbot`, etc.).
- Isolate services (`wallet-service`, `chatbot-service`) with mocks.

Recommended testing tools:

- Jest/Vitest (unit tests).
- React Testing Library for UI components.

---

### Priority-based Roadmap for Refactoring

Recommended implementation order:

| Priority                                                  | Task                                         | Complexity | Impact |
| --------------------------------------------------------- | -------------------------------------------- | ---------- | ------ |
| ✅ High                                                   | Centralize Auth Logic (Middleware, `/login`) | High       |
| ✅ High priority: enhances security immediately.          |                                              |
|                                                           |                                              |            |
| ✅ Merge Assets (NFT & Tokens) and rename AI → Chatbot    | Medium                                       |
| ✅ Medium priority: clarity & simplicity.                 |                                              |
|                                                           |                                              |            |
| ✅ Decouple Blockchain SDK & Abstract in `lib/blockchain` | High                                         |
| ✅ High priority: critical for scalability and testing.   |                                              |
|                                                           |                                              |            |
| ✅ Implement App Shell layout with streaming              | High                                         |
| ✅ High priority: native UX improvements.                 |                                              |
|                                                           |                                              |            |
| ✅ PWA integration (Optional but recommended)             | Low                                          |
| ✅ Low priority: progressive enhancement.                 |                                              |

---

## Final Recommended Structure

Implementing the changes above, the structure would look similar to:

```bash
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── middleware.ts
├── features/
│   ├── auth/
│   ├── wallet/
│   ├── chatbot/
│   ├── assets/
│   ├── transactions/
│   └── shared/
├── lib/
│   └── blockchain/
└── components/ui/
```

---

## Conclusion

Adopting this structure and refactoring plan will yield a clearer, more maintainable codebase, improved developer experience, and an enhanced native-like user experience, setting our application on a solid foundation for future scalability and high-quality production standards.
