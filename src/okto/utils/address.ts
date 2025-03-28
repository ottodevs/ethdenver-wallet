/**
 * Formats a wallet address for display by shortening it
 * @param address The full wallet address
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns The formatted address or empty string if address is invalid
 */
export function formatAddress(address: string | null | undefined, startChars = 6, endChars = 4): string {
    if (!address) return ''

    // Clean the address (remove 0x if present)
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

    // If the address is too short, return it as is
    if (cleanAddress.length <= startChars + endChars) {
        return address
    }

    // Format the address
    const start = address.startsWith('0x')
        ? `0x${cleanAddress.slice(0, startChars)}`
        : cleanAddress.slice(0, startChars)
    const end = cleanAddress.slice(-endChars)

    return `${start}...${end}`
}

/**
 * Checks if a string is a valid Ethereum address
 * @param address The address to check
 * @returns True if the address is valid, false otherwise
 */
export function isValidAddress(address: string | null | undefined): boolean {
    if (!address) return false

    // Basic validation: must be 42 characters long (with 0x prefix) and contain only hex characters
    const regex = /^0x[a-fA-F0-9]{40}$/
    return regex.test(address)
}

/**
 * Ensures an address has the 0x prefix
 * @param address The address to normalize
 * @returns The normalized address or null if address is invalid
 */
export function normalizeAddress(address: string | null | undefined): string | null {
    if (!address) return null

    // Add 0x prefix if not present
    if (!address.startsWith('0x')) {
        return `0x${address}`
    }

    return address
}
