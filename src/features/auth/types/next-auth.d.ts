import 'next-auth'

declare module 'next-auth' {
    interface Session {
        id_token?: string
        expires: string
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}
