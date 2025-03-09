import { auth } from '@/features/auth/config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export default auth(req => {
    // No aplicar autenticación a recursos estáticos
    const isStaticResource =
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.includes('.svg') ||
        req.nextUrl.pathname.includes('.png') ||
        req.nextUrl.pathname.includes('.jpg') ||
        req.nextUrl.pathname.includes('.jpeg')

    if (isStaticResource) {
        return NextResponse.next()
    }

    // Permitir acceso a la página de autenticación sin estar autenticado
    if (req.nextUrl.pathname === '/auth') {
        return NextResponse.next()
    }

    // Redirigir a login si no está autenticado y no es una ruta pública
    if (!req.auth && !req.nextUrl.pathname.startsWith('/api/auth')) {
        const newUrl = new URL('/auth', req.nextUrl.origin)
        return Response.redirect(newUrl)
    }

    // Configurar headers CORS
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
    // Verificar si la clave API de OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
        console.error(
            '⚠️ La clave API de OpenAI no está configurada. Por favor, configura OPENAI_API_KEY en tu archivo .env.local',
        )

        // Si la solicitud es a la API de chat, devolver un error
        if (request.nextUrl.pathname.startsWith('/api/chat')) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
