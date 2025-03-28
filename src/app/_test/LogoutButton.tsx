'use client'

import { signOutUser } from '@/features/auth/actions'
import { useOktoAuth } from '@/okto/hooks'

export function LogoutButton() {
    const { logout } = useOktoAuth()

    const handleLogout = async () => {
        // Logout from Okto
        logout()

        // Revoke Google credentials if FedCM is available
        if (window.google?.accounts?.id) {
            // Get user email from localStorage or state
            const sessionData = localStorage.getItem('okto_session')
            let userEmail = ''

            if (sessionData) {
                try {
                    const parsedData = JSON.parse(sessionData)
                    userEmail = parsedData.email || ''
                } catch (e) {
                    console.error('Error parsing session data:', e)
                }
            }

            if (userEmail) {
                window.google.accounts.id.revoke(userEmail, (response: object) => {
                    console.log('Google credentials revoked:', response)
                })
            }
        }

        // Logout from NextAuth
        try {
            await signOutUser()
        } catch (error) {
            console.error('Error during NextAuth logout:', error)
        }
    }

    return (
        <button
            onClick={handleLogout}
            className='rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100'>
            Logout
        </button>
    )
}
