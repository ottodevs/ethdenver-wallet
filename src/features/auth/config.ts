import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// NextAuth will automatically use the NEXTAUTH_URL from process.env
// which is now set by our next.config.ts

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            authorization: {
                params: {
                    scope: 'openid email profile',
                    // prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Persist the OAuth access_token and id_token to the token
            if (account) {
                token.id_token = account.id_token
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            if (token) {
                session.id_token = token.id_token as string
            }
            return session
        },
    },
    pages: {
        signIn: '/auth',
    },
})
