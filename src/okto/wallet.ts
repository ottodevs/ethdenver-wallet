import { oktoState } from './state'
import type { OktoWallet } from './types'

/**
 * Gets the current wallets from the state
 * @returns Array of OktoWallet objects
 */
export function getCurrentWallets(): OktoWallet[] {
    return oktoState.auth.wallets.get()
}

/**
 * Refreshes the wallets from the API
 * @returns Promise resolving to the updated wallets
 */
export async function refreshWallets(): Promise<OktoWallet[]> {
    try {
        // Implementation would make an API call to refresh wallets
        // For now, we'll just return the current wallets
        const wallets = getCurrentWallets()

        // If we had wallets, we'd update the state
        if (wallets.length > 0) {
            return wallets
        }

        // Mock a wallet if none exist
        const mockWallet: OktoWallet = {
            caip_id: 'eip155:1',
            network_name: 'Ethereum',
            address: '0x123',
            network_id: '1',
            network_symbol: 'ETH',
        }

        // Update the state with the mock wallet
        oktoState.auth.wallets.set([mockWallet])

        return [mockWallet]
    } catch (error) {
        console.error('Failed to refresh wallets:', error)
        return []
    }
}
