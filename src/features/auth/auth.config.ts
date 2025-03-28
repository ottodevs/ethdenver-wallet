import 'server-only'

import { GoogleAuthService } from '@/lib/auth/GoogleAuthService'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        // keep this empty, next-auth automatically configs the google provider
        Google({}),
        // Add credentials provider for Google One Tap
        CredentialsProvider({
            id: 'credentials',
            name: 'Google One Tap',
            credentials: {
                credential: { type: 'text' },
            },
            authorize: GoogleAuthService.authorizeGoogleOneTap,
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            console.log('👮 [auth.config] jwt callback called')

            if (typeof token.id_token === 'string') {
                console.log('--- 🈂️ [auth.config] token already has id_token, continuing')
                return token
            }

            // if user logs in with the button, the token will be on the account object
            if (account?.id_token) {
                console.log('--- 🈁 [auth.config] user logged in with google button, setting id_token')
                token.id_token = account.id_token
            }

            // if user logs in with one-tap, the token will be on the user object
            if (user && 'id_token' in user) {
                console.log('---🈷️ [auth.config] user logged in with google one-tap, setting id_token')
                token.id_token = user.id_token
            }

            return token
        },
        async session({ session, token }) {
            console.log('👮 [auth.config] session callback called')

            if (typeof token.id_token === 'string') {
                console.log('--- 🈴 [auth.config] token has id_token, setting in session')
                session.id_token = token.id_token
            }

            return session
        },
        authorized({ auth }) {
            return Boolean(auth)
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 20 * 60 * 60, // 20 hours
    },
    // debug: process.env.NODE_ENV === 'development',
})
