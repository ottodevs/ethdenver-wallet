// Okto Authentication Types
export interface OktoAuthData {
    idToken: string
    provider: string
}

export interface OktoSessionData {
    nonce: string
    clientSWA: string
    sessionPk: string
    maxPriorityFeePerGas: string
    maxFeePerGas: string
    paymaster: string
    paymasterData: string
}

export interface OktoAuthParams {
    authData: OktoAuthData
    sessionData: OktoSessionData
    sessionPkClientSignature: string
    sessionDataUserSignature: string
}

export interface OktoAuthResponse {
    userAddress: string
    nonce: string
    vendorAddress: string
    sessionExpiry: number
    idToken?: string
}

export interface OktoAuthResult {
    jsonrpc: string
    id: string
    result: OktoAuthResponse
}

// Okto Wallet Types
/**
 * Represents a wallet in the Okto system
 */
export interface OktoWallet {
    id?: string
    caip_id: string
    network_name: string
    address: string
    network_id: string
    network_symbol: string
    [key: string]: unknown
}

export interface OktoWalletsResponse {
    status: string
    data: OktoWallet[]
}

// Okto Portfolio Types
export interface OktoToken {
    id: string
    name: string
    symbol: string
    short_name: string
    token_image: string
    token_address: string
    network_id: string
    precision: string
    network_name: string
    is_primary: boolean
    balance: string
    holdings_price_usdt: string
    holdings_price_inr: string
}

export interface OktoTokenGroup {
    id: string
    name: string
    symbol: string
    short_name: string
    token_image: string
    token_address: string
    network_id: string
    precision: string
    network_name: string
    is_primary: boolean
    balance: string
    holdings_price_usdt: string
    holdings_price_inr: string
    tokens?: OktoToken[]
}

export interface OktoPortfolioData {
    aggregated_data: {
        holdings_count: string
        holdings_price_inr: string
        holdings_price_usdt: string
        total_holding_price_inr: string
        total_holding_price_usdt: string
    }
    group_tokens: OktoTokenGroup[]
    lastUpdated?: number // Timestamp of the last update
}
