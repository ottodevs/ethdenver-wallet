'use client'

import { authenticateWithIdToken } from '@/okto/authenticate'
import { debugOktoAuth } from '@/okto/debug'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface DebugInfo {
    hasStoredAuth?: boolean
    hasSessionPrivateKey?: boolean
    hasSessionAddress?: boolean
    hasIdToken?: boolean
    sessionStatus?: string
    manualAuthResult?: string
    error?: string
    isExpired?: boolean
}

export function AuthDebugPanel() {
    const { data: session } = useSession()
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
    const [manualAuthAttempted, setManualAuthAttempted] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Collect debug information
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check localStorage
            const storedAuth = localStorage.getItem('okto_auth_state')
            const sessionPrivateKey = localStorage.getItem('okto_session_private_key')
            const sessionAddress = localStorage.getItem('okto_session_address')

            // Check if auth is expired
            let isExpired = false
            if (storedAuth) {
                try {
                    const parsedAuth = JSON.parse(storedAuth)
                    if (parsedAuth.sessionExpiry && parsedAuth.sessionExpiry < Date.now()) {
                        isExpired = true
                    }
                } catch (e) {
                    console.error('Error parsing stored auth:', e)
                }
            }

            setDebugInfo({
                hasStoredAuth: !!storedAuth,
                hasSessionPrivateKey: !!sessionPrivateKey,
                hasSessionAddress: !!sessionAddress,
                hasIdToken: !!session?.id_token,
                sessionStatus: session ? 'Active' : 'None',
                isExpired,
            })

            // Run debug function
            debugOktoAuth()
        }
    }, [session, isRefreshing])

    // Try manual authentication if we have an ID token but no stored auth
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            session?.id_token &&
            (!localStorage.getItem('okto_auth_state') || debugInfo.isExpired) &&
            !manualAuthAttempted &&
            !isRefreshing
        ) {
            console.log('🔧 [AuthDebugPanel] Attempting manual authentication with ID token')
            setManualAuthAttempted(true)
            setIsRefreshing(true)

            authenticateWithIdToken(session.id_token as string)
                .then(() => {
                    console.log('🔧 [AuthDebugPanel] Manual authentication successful')
                    // Force refresh debug info
                    setTimeout(() => {
                        debugOktoAuth()
                        setDebugInfo(prev => ({ ...prev, manualAuthResult: 'Success' }))
                        setIsRefreshing(false)
                    }, 1000)
                })
                .catch(error => {
                    console.error('🔧 [AuthDebugPanel] Manual authentication failed:', error)
                    setDebugInfo(prev => ({ ...prev, manualAuthResult: 'Failed', error: String(error) }))
                    setIsRefreshing(false)
                })
        }
    }, [session, manualAuthAttempted, debugInfo.isExpired, isRefreshing])

    // If no issues, don't show the panel
    if (debugInfo.hasStoredAuth && debugInfo.hasSessionPrivateKey && !debugInfo.isExpired) {
        return null
    }

    return (
        <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm'>
            <h3 className='font-medium text-amber-800'>Auth Diagnostics</h3>
            <div className='mt-2 space-y-1 text-amber-700'>
                <p>Session: {debugInfo.sessionStatus}</p>
                <p>Stored Auth: {debugInfo.hasStoredAuth ? (debugInfo.isExpired ? 'Expired' : 'Yes') : 'No'}</p>
                <p>Session Key: {debugInfo.hasSessionPrivateKey ? 'Yes' : 'No'}</p>
                <p>ID Token: {debugInfo.hasIdToken ? 'Available' : 'Missing'}</p>
                {debugInfo.manualAuthResult && <p>Manual Auth: {debugInfo.manualAuthResult}</p>}
                {debugInfo.error && <p className='text-red-600'>Error: {debugInfo.error}</p>}
                <button
                    onClick={() => {
                        if (session?.id_token) {
                            setIsRefreshing(true)
                            authenticateWithIdToken(session.id_token as string)
                                .then(() => {
                                    debugOktoAuth()
                                    setManualAuthAttempted(true)
                                    setDebugInfo(prev => ({ ...prev, manualAuthResult: 'Success' }))
                                    setIsRefreshing(false)
                                })
                                .catch(error => {
                                    console.error('🔧 [AuthDebugPanel] Retry authentication failed:', error)
                                    setDebugInfo(prev => ({
                                        ...prev,
                                        manualAuthResult: 'Failed',
                                        error: String(error),
                                    }))
                                    setIsRefreshing(false)
                                })
                        }
                    }}
                    disabled={!session?.id_token || isRefreshing}
                    className='mt-2 rounded bg-amber-200 px-2 py-1 text-amber-800 disabled:opacity-50'>
                    {isRefreshing ? 'Refreshing...' : 'Retry Auth'}
                </button>
            </div>
        </div>
    )
}
