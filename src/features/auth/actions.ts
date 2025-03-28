'use server'

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/features/auth/auth.config'

export async function signInWithGoogle() {
    return nextAuthSignIn('google')
}

export async function signOutUser() {
    return nextAuthSignOut({ redirectTo: '/login' })
}
