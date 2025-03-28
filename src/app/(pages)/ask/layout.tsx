'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ChatProvider } from '@/contexts/chat-context'

export default function AskLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
            <ChatProvider>{children}</ChatProvider>
        </ThemeProvider>
    )
}
