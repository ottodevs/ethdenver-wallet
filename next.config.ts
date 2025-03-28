import type { NextConfig } from 'next'

import './src/lib/env/client'
import './src/lib/env/server'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_SERVER_URL

const NEXTAUTH_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL

const contentSecurityPolicy = `
    default-src 'self';
    connect-src 'self' https://accounts.google.com https://*.okto.tech https://*.oktostage.com;
    frame-src 'self' https://accounts.google.com;
    frame-ancestors 'self';
    script-src 'self' https://accounts.google.com 'unsafe-inline' 'unsafe-eval';
    script-src-elem 'self' https://accounts.google.com 'unsafe-inline';
    worker-src 'self' blob:;
    style-src 'self' https://accounts.google.com 'unsafe-inline';
    img-src 'self' https://lh3.googleusercontent.com https://s2.coinmarketcap.com data: blob:;
    object-src 'self' data: blob:;
`
    .replace(/\s{2,}/g, ' ')
    .trim()

const nextConfig: NextConfig = {
    devIndicators: false,
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
                    {
                        key: 'Permissions-Policy',
                        value: 'identity-credentials-get=*',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: contentSecurityPolicy,
                    },
                ],
            },
        ]
    },
    reactStrictMode: true,
}

export default nextConfig
