import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    env: {
        NEXTAUTH_URL: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXTAUTH_URL || 'http://localhost:3000',
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
}

export default nextConfig
