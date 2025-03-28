'use client'

import { oktoState } from '@/okto/state'
import { useObservable } from '@legendapp/state/react'
import { LogoutButton } from './LogoutButton'

/**
 * Truncates an Ethereum address to show the first 6 and last 4 characters
 * @param address The full Ethereum address
 * @returns The truncated address in format "0x1234...5678"
 */
const truncateAddress = (address: string): string => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export function AuthStatus() {
    // Use observable to reactively track auth state
    const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    const wallets = useObservable(oktoState.auth.wallets)
    const selectedWallet = oktoState.auth.selectedWallet.get()
    const walletsLoading = useObservable(oktoState.auth.walletsLoading)

    // Debug output to console
    console.log('AuthStatus render:', {
        isAuthenticated: isAuthenticated.get(),
        walletsCount: wallets.get().length,
        selectedWallet,
        walletsLoading: walletsLoading.get(),
    })

    if (!isAuthenticated.get()) {
        return null
    }

    return (
        <div className='rounded-md bg-green-50 p-4'>
            <div className='flex'>
                <div className='flex-shrink-0'>
                    <svg className='h-5 w-5 text-green-400' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                        <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                            clipRule='evenodd'
                        />
                    </svg>
                </div>
                <div className='ml-3'>
                    <h3 className='text-sm font-medium text-green-800'>Authentication successful</h3>
                    <div className='mt-2 text-sm text-green-700'>
                        {walletsLoading.get() ? (
                            <p>Loading wallets...</p>
                        ) : (
                            <>
                                <p>You have {wallets.get().length} wallet(s)</p>
                                {selectedWallet && (
                                    <p className='font-medium'>
                                        Selected: {selectedWallet.network_name} (
                                        {truncateAddress(selectedWallet.address)})
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <div className='mt-4'>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
