import { env } from '@/lib/env/client'
import { secp256k1 } from '@noble/curves/secp256k1'
import { v4 as uuidv4 } from 'uuid'
import { encodeAbiParameters, encodePacked, fromHex, keccak256, parseAbiParameters, toHex } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import type { OktoAuthData, OktoAuthParams, OktoAuthResponse, OktoAuthResult, OktoSessionData } from './types'

// ======== Constants ========
export const OKTO_GATEWAY_URL = 'https://sandbox-okto-gateway.oktostage.com/rpc'
export const OKTO_API_URL = 'https://sandbox-api.okto.tech/api/oc/v1'
export const AUTH_METHOD = 'authenticate'
export const JSON_RPC_VERSION = '2.0'
export const STORAGE_KEY_SESSION_PRIVATE = 'okto_session_private_key'
export const STORAGE_KEY_SESSION_ADDRESS = 'okto_session_address'
export const DEFAULT_GAS_PRICE = '0xBA43B7400'
export const HOURS_IN_MS = 60 * 60 * 1000

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
    console.log('🧪 [okto-client] entering generateSessionData')

    // Use environment variables for client configuration
    const clientId = env.NEXT_PUBLIC_CLIENT_SWA
    const clientSecret = env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY
    const paymasterAddress = '0x5408fAa7F005c46B85d82060c532b820F534437c'

    if (!clientId || !clientSecret) {
        throw new Error('❌ [okto-client] missing okto client configuration')
    }

    // Generate a cryptographically secure nonce
    const nonce = uuidv4()
    console.log('🧪 [okto-client] generated nonce:', nonce)

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

    // Store the session private key for later use
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SESSION_PRIVATE, sessionPrivateKey)
        localStorage.setItem(STORAGE_KEY_SESSION_ADDRESS, sessionAddress)
        console.log(
            '🧪 [okto-client] stored session private key in localStorage:',
            sessionPrivateKey.slice(0, 10) + '...',
        )
    }

    return authParams
}

/**
 * Authenticates with Okto using Google OAuth credentials
 */
export async function authenticate(params: OktoAuthParams): Promise<OktoAuthResponse> {
    console.log('🚔 [okto-client] entering authenticate')

    const requestId = uuidv4()
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
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
            // console.log('Raw request payload:', requestBody)

            // Check if nonce is properly formatted in the payload
            // console.log('Nonce in request:', params.sessionData.nonce)
            // console.log('Nonce length:', params.sessionData.nonce.length)
            // console.log('Session public key:', params.sessionData.sessionPk)

            console.log(`🚔 [okto-client] Attempting authentication (attempt ${retryCount + 1}/${maxRetries})`)

            const response = await fetch(OKTO_GATEWAY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000), // 10 second timeout
            })

            const responseData = await response.json()

            if (!response.ok) {
                console.error('❌ [okto-client] authentication error response:', responseData)
                throw new Error(`❌ [okto-client] authentication failed: ${JSON.stringify(responseData)}`)
            }

            console.log('✅ [okto-client] authentication successful')

            const data = responseData as OktoAuthResult
            return data.result
        } catch (error) {
            retryCount++

            // Check if it's a network error
            const isNetworkError =
                error instanceof TypeError &&
                (error.message.includes('Failed to fetch') ||
                    error.message.includes('NetworkError') ||
                    error.message.includes('Network request failed'))

            // Check if it's a timeout error
            const isTimeoutError = error instanceof DOMException && error.name === 'AbortError'

            if ((isNetworkError || isTimeoutError) && retryCount < maxRetries) {
                // Exponential backoff: wait longer between each retry
                const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000)
                console.warn(
                    `⚠️ [okto-client] Network error during authentication, retrying in ${backoffTime / 1000}s (attempt ${retryCount}/${maxRetries})`,
                    error,
                )

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, backoffTime))
                continue
            }

            // If we've exhausted retries or it's not a network error, throw
            console.error('❌ [okto-client] authentication request failed:', error)

            // Provide more descriptive error message
            if (isNetworkError) {
                throw new Error(
                    '❌ [okto-client] Network error: Unable to connect to authentication server. Please check your internet connection and try again.',
                )
            } else if (isTimeoutError) {
                throw new Error(
                    '❌ [okto-client] Request timeout: The authentication server took too long to respond. Please try again later.',
                )
            } else if (error instanceof Error) {
                throw error
            } else {
                throw new Error('❌ [okto-client] unknown authentication error')
            }
        }
    }

    // This should never be reached due to the throw in the catch block
    throw new Error('❌ [okto-client] Failed to authenticate after multiple attempts')
}

/**
 * Logs out the current user by clearing session data
 */
export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_SESSION_PRIVATE)
        localStorage.removeItem(STORAGE_KEY_SESSION_ADDRESS)
        localStorage.removeItem('okto_session')
    }
}

/**
 * Generates an authorization token for Okto API
 * Based on Okto SDK implementation
 */
export async function generateAuthorizationToken(sessionPrivateKey: string): Promise<string> {
    if (!sessionPrivateKey) {
        throw new Error('❌ [okto-client] session private key is required')
    }

    try {
        // Get the uncompressed public key
        const sessionPublicKey = getUncompressedPublicKey(sessionPrivateKey)

        // Create the data object with expiration (90 minutes from now)
        const data = {
            expire_at: Math.round(Date.now() / 1000) + 60 * 90,
            session_pub_key: sessionPublicKey,
        }

        // Sign the data with the session private key
        const account = privateKeyToAccount(sessionPrivateKey as `0x${string}`)
        const dataSignature = await account.signMessage({
            message: JSON.stringify(data),
        })

        // Create the payload object
        const payload = {
            type: 'ecdsa_uncompressed',
            data: data,
            data_signature: dataSignature,
        }

        // Base64 encode the payload
        return btoa(JSON.stringify(payload))
    } catch (error) {
        console.error('❌ [okto-client] error generating authorization token:', error)
        throw error
    }
}
