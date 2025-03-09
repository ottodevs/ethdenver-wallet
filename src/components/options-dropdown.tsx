// components/options-dropdown.tsx
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast-context'
import { useCopyToClipboard } from '@/features/shared/hooks/use-copy-to-clipboard'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { DelegatedApproval } from '@/features/wallet/components/delegated-approval'
import { useWallet } from '@/features/wallet/hooks/use-wallet'
import { openExplorer } from '@/lib/utils/explorer'
import { Check, Copy, ExternalLink, LogOut, Moon, MoreVertical, Settings, Shield, Sun } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export function OptionsDropdown() {
    const { theme, setTheme } = useTheme()
    const { disconnect } = useWallet()
    const { selectedAccount } = useOktoAccount()
    const walletAddress = selectedAccount?.address || ''
    const [delegatedApprovalOpen, setDelegatedApprovalOpen] = useState(false)
    const router = useRouter()
    const { addToast, removeToast } = useToast()
    const { copyToClipboard, copying } = useCopyToClipboard()
    const themeToastIdRef = useRef<string | null>(null)

    const handleCopyAddress = () => {
        if (!walletAddress) {
            console.log('No wallet address available')
            return
        }

        console.log('Copying address in options dropdown:', walletAddress)
        copyToClipboard(walletAddress, 'Address')
    }

    const handleViewOnExplorer = () => {
        if (!walletAddress) return
        openExplorer('ethereum', 'address', walletAddress, true)
    }

    const handleNavigateToSettings = () => {
        router.push('/settings')
    }

    const handleLogout = async () => {
        try {
            // First disconnect from Okto
            disconnect()

            // Then sign out from Next-Auth with relative URL
            await signOut({ redirect: true, callbackUrl: '/auth' })
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)

        // Remove previous theme toast if exists
        if (themeToastIdRef.current) {
            removeToast(themeToastIdRef.current)
        }

        // Show toast notification and store its ID
        const toastId = Math.random().toString(36).substring(2, 9)
        themeToastIdRef.current = toastId

        addToast({
            id: toastId,
            description: `Switched to ${newTheme} mode`,
            variant: 'default',
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                        <MoreVertical className='h-5 w-5' />
                        <span className='sr-only'>Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleCopyAddress}>
                        {copying ? <Check className='mr-2 h-4 w-4' /> : <Copy className='mr-2 h-4 w-4' />}
                        {copying ? 'Copied!' : 'Copy Address'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewOnExplorer}>
                        <ExternalLink className='mr-2 h-4 w-4' />
                        View on Explorer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleTheme}>
                        {theme === 'dark' ? (
                            <>
                                <Sun className='mr-2 h-4 w-4' />
                                Light Mode
                            </>
                        ) : (
                            <>
                                <Moon className='mr-2 h-4 w-4' />
                                Dark Mode
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDelegatedApprovalOpen(true)}>
                        <Shield className='mr-2 h-4 w-4' />
                        Automatic Approvals
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNavigateToSettings}>
                        <Settings className='mr-2 h-4 w-4' />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className='text-red-500 focus:text-red-500'>
                        <LogOut className='mr-2 h-4 w-4' />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DelegatedApproval open={delegatedApprovalOpen} onOpenChange={setDelegatedApprovalOpen} />
        </>
    )
}
