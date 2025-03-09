# Aeris Wallet Structure

## App Structure

```bash
src/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main dashboard (redirects to /auth if not authenticated)
│   ├── ask/
│   │   └── page.tsx               # AI assistant page
│   ├── auth/
│   │   └── page.tsx               # Authentication page
│   ├── buy/
│   │   └── page.tsx               # Buy crypto page
│   ├── receive/
│   │   └── page.tsx               # Receive crypto page
│   ├── send/
│   │   └── page.tsx               # Send crypto page
│   ├── settings/
│   │   └── page.tsx               # Settings page
│   └── swap/
│       └── page.tsx               # Swap tokens page
├── features/
│   ├── assets/
│   │   ├── components/
│   │   │   ├── token-list.tsx
│   │   │   └── token-item.tsx
│   │   ├── hooks/
│   │   │   └── use-tokens.tsx
│   │   └── services/
│   │       └── token-service.ts
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── onboarding.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.tsx
│   │   └── services/
│   │       └── auth-service.ts
│   ├── nfts/
│   │   ├── components/
│   │   │   ├── nft-gallery.tsx
│   │   │   └── nft-item.tsx
│   │   ├── hooks/
│   │   │   └── use-nfts.tsx
│   │   └── services/
│   │       └── nft-service.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── loading-screen.tsx
│   │   │   ├── error-display.tsx
│   │   │   └── responsive-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-copy-to-clipboard.tsx
│   │   │   └── use-okto-client.tsx
│   │   └── services/
│   │       └── chain-service.ts
│   ├── transactions/
│   │   ├── components/
│   │   │   ├── transaction-history.tsx
│   │   │   └── transaction-item.tsx
│   │   ├── hooks/
│   │   │   └── use-transactions.tsx
│   │   └── services/
│   │       ├── transaction-service.ts
│   │       └── token-transfer-service.ts
│   └── wallet/
│       ├── components/
│       │   ├── balance-display.tsx
│       │   ├── action-buttons.tsx
│       │   ├── tab-navigation.tsx
│       │   ├── token-list.tsx
│       │   └── wallet-header.tsx
│       ├── hooks/
│       │   ├── use-wallet.tsx
│       │   └── use-privacy-mode.tsx
│       └── services/
│           └── wallet-service.ts
└── lib/
    ├── utils/
    │   ├── format.ts
    │   └── explorer.ts
    └── middleware.ts              # Auth middleware
```

## Route Structure

- `/` - Main dashboard with wallet overview
- `/ask` - AI assistant
- `/auth` - Authentication page
- `/buy` - Buy crypto
- `/receive` - Receive crypto
- `/send` - Send crypto
- `/settings` - User settings
- `/swap` - Swap tokens

## Key Components

### Dashboard Components

- `WalletHeader` - Top navigation with options dropdown and QR code button
- `BalanceDisplay` - Shows total balance with privacy toggle
- `ActionButtons` - Buy, Swap, Send, Ask buttons
- `TabNavigation` - Assets, Activity, NFTs tabs
- `TokenList` - List of tokens with balances
- `TransactionHistory` - List of transactions
- `NFTGallery` - Gallery of NFTs

### Modal Components

- `SendModal` - Send crypto interface
- `SwapModal` - Swap tokens interface
- `BuyModal` - Buy crypto interface
- `ReceiveModal` - Receive crypto interface

### Shared Components

- `LoadingScreen` - Loading animation
- `ErrorDisplay` - Error messages
- `ResponsiveDialog` - Responsive modal dialog

## Implementation Plan

1. Create the feature folder structure
2. Extract components from the current Wallet component
3. Create page components for each route
4. Implement shared components
5. Refactor hooks and services by feature
6. Update imports and references

## Example Implementation

```typescript

//src/app/layout.tsx
import '@/app/globals.css'
import AppProvider from '@/components/providers'
import { outfit } from '@/lib/utils/fonts'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

export const metadata: Metadata = {
    title: 'Aeris Wallet',
    description:
        'Effortless login, seamless wallet management, and reliable transactions across the most popular blockchains—combining simplicity with interoperability.',
}

export default async function RootLayout({
  children,
}: Readonly<{
        children: React.ReactNode
    }>
) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${outfit.variable} antialiased`}
            >
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange
            >
                <AppProvider>{children}</AppProvider>
            </ThemeProvider>
            </body>
        </html>
    )
}
```

```typescript

//src/app/page.tsx
import { WalletDashboard } from '@/features/wallet/components/wallet-dashboard'

export default function HomePage() {
    return (
        <main className='flex min-h-screen flex-col items-center bg-[#11101C]'>
            <div className='container max-w-md px-4 min-h-screen'>
                <WalletDashboard />
            </div>
        </main>
    )
}
```

```typescript
//src/features/wallet/components/wallet-dashboard.tsx

'use client';

import { WalletHeader } from './wallet-header'
import { BalanceDisplay } from './balance-display'
import { ActionButtons } from './action-buttons'
import { TabNavigation } from './tab-navigation'
import { TokenList } from '@/features/assets/components/token-list'
import { TransactionHistory } from '@/features/transactions/components/transaction-history'
import { NFTGallery } from '@/features/nfts/components/nft-gallery'
import { LoadingScreen } from '@/features/shared/components/loading-screen'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { useOktoPortfolio } from '@/features/shared/hooks/use-okto-portfolio'
import { useState } from 'react'

export function WalletDashboard() {
    const { isLoading: accountLoading, isAuthenticated } = useOktoAccount()
    const { isLoading: isLoadingPortfolio, hasInitialized } = useOktoPortfolio()
    const [activeTab, setActiveTab] = useState('assets')

  // Show loading screen while authenticating or loading the portfolio
  if (accountLoading || (isAuthenticated && isLoadingPortfolio && !hasInitialized)) {
    return <LoadingScreen />;
    }

    return (
        <div className='pt-3 pb-4 font-outfit'>
            <WalletHeader />
            <BalanceDisplay />
            <ActionButtons />
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <div className='w-full mx-auto rounded-t-2xl bg-gradient-to-br from-[#252531] to-[#13121E] min-h-[calc(100vh-300px)]'>
                <div className='py-4'>
                    {activeTab === 'assets' ? (
                        <TokenList />
                    ) : activeTab === 'activity' ? (
                        <TransactionHistory />
                    ) : activeTab === 'nfts' ? (
                        <NFTGallery />
                    ) : null}
                </div>
            </div>
        </div>
    )
}
```
