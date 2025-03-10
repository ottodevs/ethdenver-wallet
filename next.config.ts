import type { NextConfig } from 'next'

import './src/lib/env/client'
import './src/lib/env/server'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_SERVER_URL

const NEXTAUTH_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL

console.log('NEXT_PUBLIC_SERVER_URL', NEXT_PUBLIC_SERVER_URL)

const nextConfig: NextConfig = {
    env: {
        NEXTAUTH_URL,
        NEXT_PUBLIC_SERVER_URL,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 's2.coinmarketcap.com',
                pathname: '**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'same-site',
                    },
                ],
            },
        ]
    },
    // reactStrictMode: true,
}

export default nextConfig
