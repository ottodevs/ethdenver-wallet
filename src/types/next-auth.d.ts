import 'next-auth'

declare module 'next-auth' {
    interface Session {
        id_token?: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id_token?: string
    }
}
