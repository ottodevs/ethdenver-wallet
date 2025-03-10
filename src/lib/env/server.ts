import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    server: {
        // Google OAuth configuration
        GOOGLE_CLIENT_ID: z.string().min(1).describe('Google OAuth client ID'),
        GOOGLE_CLIENT_SECRET: z.string().min(1).describe('Google OAuth client secret'),

        // NextAuth configuration
        AUTH_SECRET: z.string().min(1).describe('NextAuth secret key'),
        NEXTAUTH_URL: z.string().url().describe('NextAuth URL'),

        // OpenAI configuration
        OPENAI_API_KEY: z.string().min(1).describe('OpenAI API key'),

        // Editor configuration
        REACT_EDITOR: z.string().optional().describe('Editor to open code links'),
    },
    shared: {
        // Node environment
        NODE_ENV: z.enum(['development', 'production']).default('development').describe('Node environment'),

        // Vercel deployment URLs
        VERCEL_URL: z.string().optional(),
        VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    },
    experimental__runtimeEnv: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    },
})
