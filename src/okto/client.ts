import { env } from '@/lib/env/client'
import { secp256k1 } from '@noble/curves/secp256k1'
import { v4 as uuidv4 } from 'uuid'
import { encodeAbiParameters, encodePacked, fromHex, keccak256, parseAbiParameters, toHex } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import type { OktoAuthData, OktoAuthParams, OktoAuthResponse, OktoAuthResult, OktoSessionData } from './types'

// ======== Constants ========
const OKTO_GATEWAY_URL = 'https://sandbox-okto-gateway.oktostage.com/rpc'
const AUTH_METHOD = 'authenticate'
const JSON_RPC_VERSION = '2.0'
const HOURS_IN_MS = 60 * 60 * 1000
const DEFAULT_GAS_PRICE = '0xBA43B7400' // From Okto SDK

// Storage keys
const STORAGE_KEY_SESSION_PRIVATE = 'okto_session_private_key'
const STORAGE_KEY_SESSION_ADDRESS = 'okto_session_address'

/**
 * Converts a UUID string to a bytes32 hex value
 * @param nonce UUID string
 * @returns bytes32 hex representation
 */
function nonceToBigInt(nonce: string): bigint {
    // Remove hyphens and convert to BigInt
    const nonceWithoutHyphens = nonce.replace(/-/g, '')
    return BigInt(`0x${nonceWithoutHyphens}`)
}

/**
 * Generates an uncompressed public key from a private key
 * Ensures the key starts with 0x04 as required by Okto
 */
function getUncompressedPublicKey(privateKey: string): string {
    try {
        // Remove 0x prefix if present
        const privKeyHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey

        // Generate uncompressed public key (false = uncompressed format)
        const pubKey = secp256k1.getPublicKey(privKeyHex, false)

        // Convert to hex string with 0x prefix
        return `0x${Buffer.from(pubKey).toString('hex')}`
    } catch (error) {
        console.error('Error generating uncompressed public key:', error)
        throw error
    }
}

/**
 * Generates paymaster data for Okto authentication
 * Following Okto SDK implementation
 */
async function generatePaymasterData(
    address: string,
    privateKey: string,
    nonce: string,
    validUntil: Date,
    validAfter: number = 0,
): Promise<string> {
    // Convert date to timestamp
    const validUntilTimestamp = Math.floor(validUntil.getTime() / 1000)

    // Convert nonce to bytes32 format
    const nonceBytes32 = toHex(nonceToBigInt(nonce), { size: 32 })

    // Generate hash exactly as in Okto SDK
    const paymasterDataHash = keccak256(
        encodePacked(
            ['bytes32', 'address', 'uint48', 'uint48'],
            [nonceBytes32, address as `0x${string}`, validUntilTimestamp, validAfter],
        ),
    )

    // Sign the hash with the private key
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const signature = await account.signMessage({
        message: { raw: fromHex(paymasterDataHash, 'bytes') },
    })

    // Encode parameters exactly as in Okto SDK
    const paymasterData = encodeAbiParameters(parseAbiParameters('address, uint48, uint48, bytes'), [
        address as `0x${string}`,
        validUntilTimestamp,
        validAfter,
        signature,
    ])

    return paymasterData
}

/**
 * Generates the session data for Okto authentication
 */
export async function generateSessionData(idToken: string): Promise<OktoAuthParams> {
    // Use environment variables for client configuration
    const clientId = env.NEXT_PUBLIC_CLIENT_SWA
    const clientSecret = env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY
    const paymasterAddress = '0x5408fAa7F005c46B85d82060c532b820F534437c'

    if (!clientId || !clientSecret) {
        throw new Error('Missing Okto client configuration')
    }

    // Generate a cryptographically secure nonce
    const nonce = uuidv4()
    console.log('Generated nonce:', nonce)

    // Generate session key (client wallet)
    const sessionPrivateKey = generatePrivateKey()
    const sessionAccount = privateKeyToAccount(sessionPrivateKey)
    const sessionAddress = sessionAccount.address

    // Get the uncompressed public key (starting with 0x04)
    const sessionPublicKey = getUncompressedPublicKey(sessionPrivateKey)

    // Set expiration date (6 hours from now, matching Okto SDK)
    const expirationDate = new Date(Date.now() + 6 * HOURS_IN_MS)

    // Create the auth data object
    const authData: OktoAuthData = {
        idToken,
        provider: 'google',
    }

    // Generate paymaster data
    const paymasterData = await generatePaymasterData(paymasterAddress, clientSecret, nonce, expirationDate)

    // Create the session data object
    const sessionData: OktoSessionData = {
        nonce,
        clientSWA: clientId,
        sessionPk: sessionPublicKey,
        maxPriorityFeePerGas: DEFAULT_GAS_PRICE,
        maxFeePerGas: DEFAULT_GAS_PRICE,
        paymaster: paymasterAddress,
        paymasterData,
    }

    // Generate message hash for signatures
    const message = keccak256(encodeAbiParameters(parseAbiParameters('address'), [sessionAddress as `0x${string}`]))

    // Sign with client key
    const clientAccount = privateKeyToAccount(clientSecret as `0x${string}`)
    const sessionPkClientSignature = await clientAccount.signMessage({
        message: { raw: fromHex(message, 'bytes') },
    })

    // Sign with session key
    const sessionDataUserSignature = await sessionAccount.signMessage({
        message: { raw: fromHex(message, 'bytes') },
    })

    // Create the auth params object
    const authParams: OktoAuthParams = {
        authData,
        sessionData,
        sessionPkClientSignature,
        sessionDataUserSignature,
    }

    console.log('Auth params:', JSON.stringify(authParams, null, 2))

    return authParams
}

/**
 * Authenticates with Okto using Google OAuth credentials
 */
export async function authenticate(params: OktoAuthParams): Promise<OktoAuthResponse> {
    const requestId = uuidv4()

    try {
        // Create the request payload
        const requestPayload = {
            method: AUTH_METHOD,
            jsonrpc: JSON_RPC_VERSION,
            id: requestId,
            params: [params],
        }

        // Log the exact JSON string being sent
        const requestBody = JSON.stringify(requestPayload)
        console.log('Raw request payload:', requestBody)

        // Check if nonce is properly formatted in the payload
        console.log('Nonce in request:', params.sessionData.nonce)
        console.log('Nonce length:', params.sessionData.nonce.length)
        console.log('Session public key:', params.sessionData.sessionPk)

        const response = await fetch(OKTO_GATEWAY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestBody,
        })

        const responseData = await response.json()

        if (!response.ok) {
            console.error('Authentication error response:', responseData)
            throw new Error(`Authentication failed: ${JSON.stringify(responseData)}`)
        }

        const data = responseData as OktoAuthResult
        return data.result
    } catch (error) {
        console.error('Okto authentication request failed:', error)
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Unknown authentication error')
    }
}

/**
 * Logs out the current user by clearing session data
 */
export function logout(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY_SESSION_PRIVATE)
        sessionStorage.removeItem(STORAGE_KEY_SESSION_ADDRESS)
    }
}
