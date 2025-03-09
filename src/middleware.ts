import { auth } from '@/features/auth/config'
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

    // Redirigir a login si no está autenticado
    if (!req.auth && req.nextUrl.pathname !== '/auth') {
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

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
