import { jwtDecode } from 'jwt-decode'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Create a client OAuth2 to verify the token
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json()

        if (!credential) {
            return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
        }

        // Verify the token with Google's API
        const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential)

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.error_description || 'Invalid token' }, { status: 400 })
        }

        // Token is valid, decode it to get user information
        const decoded = jwtDecode<{
            email: string
            name: string
            picture: string
            sub: string
        }>(credential)

        // Return success with user information
        return NextResponse.json({
            success: true,
            user: {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                image: decoded.picture,
            },
        })
    } catch (error) {
        console.error('Error processing Google One Tap authentication:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Authentication failed' },
            { status: 500 },
        )
    }
}
