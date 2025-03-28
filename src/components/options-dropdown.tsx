// components/options-dropdown.tsx
import { computed } from '@legendapp/state'
import { Copy, ExternalLink, LogOut, Moon, MoreVertical, Settings as SettingsIcon, Shield, Sun } from 'lucide-react'
import Link from 'next/link'
import { memo, useCallback, useMemo, useState } from 'react'

import { useToast } from '@/components/hooks/use-toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'
import { useCopyToClipboard } from '@/features/shared/hooks/use-copy-to-clipboard'
import { DelegatedApproval } from '@/features/wallet/components/delegated-approval'
import { appState$, settings$ } from '@/lib/stores/app.store'
import { openExplorer } from '@/lib/utils/explorer'
import { useWalletAddress } from '@/okto/hooks'
import { formatAddress } from '@/okto/utils/address'

// Computed observable for theme icon
const themeIcon$ = computed(() =>
    settings$.theme.get() === 'dark' ? <Sun className='mr-2 size-4' /> : <Moon className='mr-2 size-4' />,
)

// Computed observable for theme text
const themeText$ = computed(() => (settings$.theme.get() === 'dark' ? 'Light Mode' : 'Dark Mode'))

// Memoized theme toggle item
const ThemeToggleItem = memo(function ThemeToggleItem() {
    const toggleTheme = () => {
        settings$.theme.set(theme => (theme === 'dark' ? 'light' : 'dark'))
    }

    return (
        <DropdownMenuItem onClick={toggleTheme}>
            {themeIcon$.get()}
            {themeText$.get()}
        </DropdownMenuItem>
    )
})

// Memoized copy address item
const CopyAddressItem = memo(function CopyAddressItem() {
    const { copyToClipboard } = useCopyToClipboard()
    const { walletAddress, isLoading } = useWalletAddress()
    const { toast } = useToast()

    // Memoize the formatted address to prevent recalculation on every render
    const displayAddress = useMemo(() => {
        return walletAddress ? formatAddress(walletAddress) : ''
    }, [walletAddress])

    // Memoize the copy handler to prevent recreation on every render
    const handleCopyAddress = useCallback(() => {
        if (walletAddress) {
            copyToClipboard(walletAddress, 'Wallet Address')
        } else {
            toast({
                title: 'No wallet address available',
                description: 'Please connect your wallet or try again later.',
                variant: 'destructive',
            })
        }
    }, [walletAddress, copyToClipboard, toast])

    return (
        <DropdownMenuItem
            onClick={handleCopyAddress}
            disabled={isLoading}
            className={!walletAddress && !isLoading ? 'cursor-not-allowed opacity-50' : ''}>
            <Copy className='mr-2 size-4' />
            <div className='flex flex-col'>
                <span>Copy Address</span>
                {!isLoading && walletAddress && <span className='text-muted-foreground text-xs'>{displayAddress}</span>}
                {isLoading && <span className='text-muted-foreground text-xs'>Loading...</span>}
                {!isLoading && !walletAddress && (
                    <span className='text-muted-foreground text-xs'>No address available</span>
                )}
            </div>
        </DropdownMenuItem>
    )
})

// Memoized view on explorer item
const ViewOnExplorerItem = memo(function ViewOnExplorerItem() {
    const { walletAddress, isLoading } = useWalletAddress()
    const { toast } = useToast()

    // Memoize the handler to prevent recreation on every render
    const handleViewOnExplorer = useCallback(() => {
        if (walletAddress) {
            // Use the current chain or default to ethereum
            const currentChain = appState$.wallet.selectedChain.get() || 'ethereum'
            openExplorer(currentChain, 'address', walletAddress)
        } else {
            toast({
                title: 'No wallet address available',
                description: 'Please connect your wallet or try again later.',
                variant: 'destructive',
            })
        }
    }, [walletAddress, toast])

    return (
        <DropdownMenuItem
            onClick={handleViewOnExplorer}
            disabled={isLoading || !walletAddress}
            className={!walletAddress && !isLoading ? 'cursor-not-allowed opacity-50' : ''}>
            <ExternalLink className='mr-2 size-4' />
            View on Explorer
        </DropdownMenuItem>
    )
})

// Memoized delegated signatures item
const DelegatedSignaturesItem = memo(function DelegatedSignaturesItem() {
    const [isOpen, setIsOpen] = useState(false)
    const delegationEnabled = appState$.ui.delegationEnabled.get()

    // Ensure the modal opens correctly
    const handleOpenModal = useCallback(() => {
        setIsOpen(true)
    }, [])

    return (
        <>
            <DropdownMenuItem onClick={handleOpenModal}>
                <Shield className='mr-2 size-4' />
                <div className='flex flex-col'>
                    <span>Delegated Signatures</span>
                    <span className='text-muted-foreground text-xs'>{delegationEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
            </DropdownMenuItem>
            <DelegatedApproval open={isOpen} onOpenChange={setIsOpen} />
        </>
    )
})

// Memoized settings item
const SettingsItem = memo(function SettingsItem() {
    return (
        <Link href='/settings' passHref>
            <DropdownMenuItem asChild>
                <span>
                    <SettingsIcon className='mr-2 size-4' />
                    Settings
                </span>
            </DropdownMenuItem>
        </Link>
    )
})

// Memoized sign out item
const SignOutItem = memo(function SignOutItem() {
    const signOut = useSignOut()

    return (
        <DropdownMenuItem onClick={signOut} className='text-red-500 focus:text-red-500'>
            <LogOut className='mr-2 size-4' />
            Sign Out
        </DropdownMenuItem>
    )
})

export const OptionsDropdown = memo(function OptionsDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <span className='flex items-center justify-center'>
                    <MoreVertical className='size-5' />
                    <span className='sr-only'>Open menu</span>
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <CopyAddressItem />
                <ViewOnExplorerItem />
                <DropdownMenuSeparator />
                <ThemeToggleItem />
                <DelegatedSignaturesItem />
                <SettingsItem />
                <DropdownMenuSeparator />
                <SignOutItem />
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
