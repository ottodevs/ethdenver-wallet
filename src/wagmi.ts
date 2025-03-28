import { okto } from '@okto_web3/wagmi-adapter'
import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { arbitrum, base, baseSepolia, polygon } from 'wagmi/chains'
import { env } from './lib/env/client'

export function getConfig() {
    return createConfig({
        chains: [baseSepolia, baseSepolia, base, arbitrum, polygon],
        multiInjectedProviderDiscovery: false,
        connectors: [
            okto({
                environment: 'sandbox',
                clientPrivateKey: env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY as `0x${string}`,
                clientSWA: env.NEXT_PUBLIC_CLIENT_SWA as `0x${string}`,
                googleClientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
            }),
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [baseSepolia.id]: http(),
            [base.id]: http(),
            [arbitrum.id]: http(),
            [polygon.id]: http(),
        },
    })
}

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}
