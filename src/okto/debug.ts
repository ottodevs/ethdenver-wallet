/**
 * Debug utility to check Okto authentication state
 */
export function debugOktoAuth() {
    if (typeof window === 'undefined') {
        console.log('🔍 [okto-debug] Running on server, no localStorage available')
        return
    }

    console.log('🔍 [okto-debug] Checking Okto auth state')

    try {
        // Check localStorage directly
        const storedAuth = localStorage.getItem('okto_auth_state')
        const sessionPrivateKey = localStorage.getItem('okto_session_private_key')
        const sessionAddress = localStorage.getItem('okto_session_address')

        console.log('🔍 [okto-debug] Raw localStorage data:', {
            authState: storedAuth ? 'Found' : 'Not found',
            sessionPrivateKey: sessionPrivateKey ? 'Found' : 'Not found',
            sessionAddress: sessionAddress ? 'Found' : 'Not found',
        })

        if (storedAuth) {
            try {
                const parsedAuth = JSON.parse(storedAuth)
                const now = Date.now()
                const sessionExpiry = parsedAuth?.sessionExpiry
                const isExpired = sessionExpiry && sessionExpiry < now
                const timeLeft = sessionExpiry ? new Date(sessionExpiry - now).toISOString().substr(11, 8) : 'Unknown'

                console.log('🔍 [okto-debug] Parsed auth data:', {
                    userAddress: parsedAuth?.userSWA || 'Not found',
                    clientAddress: parsedAuth?.clientSWA || 'Not found',
                    sessionExpiry: sessionExpiry ? new Date(sessionExpiry).toISOString() : 'Not found',
                    hasIdToken: !!parsedAuth?.idToken,
                    isExpired: isExpired ? 'YES - EXPIRED' : 'No',
                    timeLeft: isExpired ? 'EXPIRED' : timeLeft,
                })

                // Check expiry
                if (sessionExpiry) {
                    console.log(
                        '🔍 [okto-debug] Session status:',
                        isExpired ? 'EXPIRED' : 'VALID',
                        isExpired
                            ? `(Expired: ${new Date(sessionExpiry).toISOString()})`
                            : `(Expires: ${new Date(sessionExpiry).toISOString()}, Time left: ${timeLeft})`,
                    )
                }
            } catch (e) {
                console.error('🔍 [okto-debug] Error parsing stored auth:', e)
            }
        }
    } catch (error) {
        console.error('🔍 [okto-debug] Error accessing localStorage:', error)
    }
}
