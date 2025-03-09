import { auth } from '@/features/auth/config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export default auth(req => {
    // Do not apply authentication to static resources
    const isStaticResource =
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.includes('.svg') ||
        req.nextUrl.pathname.includes('.png') ||
        req.nextUrl.pathname.includes('.jpg') ||
        req.nextUrl.pathname.includes('.jpeg')

    if (isStaticResource) {
        return NextResponse.next()
    }

    // Allow access to the authentication page without being authenticated
    if (req.nextUrl.pathname === '/auth') {
        return NextResponse.next()
    }

    // Redirect to login if not authenticated and not a public route
    if (!req.auth && !req.nextUrl.pathname.startsWith('/api/auth')) {
        const newUrl = new URL('/auth', req.nextUrl.origin)
        return Response.redirect(newUrl)
    }

    // Configure CORS headers
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    )

    return response
})

export function middleware(request: NextRequest) {
    // Check if the OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.error(
            '⚠️ The OpenAI API key is not configured. Please configure OPENAI_API_KEY in your .env.local file',
        )

        // If the request is to the chat API, return an error
        if (request.nextUrl.pathname.startsWith('/api/chat')) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
