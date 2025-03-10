import type { Hash, Hex } from '@okto_web3/react-sdk'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    client: {
        // Okto configuration
        NEXT_PUBLIC_CLIENT_PRIVATE_KEY: z
            .string()
            .min(1)
            .describe('Okto client private key')
            .transform((val): Hash => val as Hash),
        NEXT_PUBLIC_CLIENT_SWA: z
            .string()
            .min(1)
            .describe('Okto client SWA')
            .transform((val): Hex => val as Hex),
        NEXT_PUBLIC_ENVIRONMENT: z.enum(['sandbox', 'staging']).describe('Okto environment'),
        NEXT_PUBLIC_SERVER_URL: z.string().url().describe('Server URL'),
    },
    runtimeEnv: {
        NEXT_PUBLIC_CLIENT_PRIVATE_KEY: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY,
        NEXT_PUBLIC_CLIENT_SWA: process.env.NEXT_PUBLIC_CLIENT_SWA,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
        NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    },
})
