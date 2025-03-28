import { NextResponse } from 'next/server'

// Extended token list that includes additional tokens for each chain
const extendedTokenList = {
    name: 'Okto Extended Token List',
    timestamp: new Date().toISOString(),
    version: {
        major: 1,
        minor: 0,
        patch: 0,
    },
    tokens: [
        // Ethereum - Basic tokens
        {
            chainId: 1,
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: '/token-icons/usdc.png',
        },
        {
            chainId: 1,
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logoURI: '/token-icons/usdt.png',
        },
        {
            chainId: 1,
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logoURI: '/token-icons/dai.png',
        },
        {
            chainId: 1,
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: '/token-icons/weth.png',
        },

        // Ethereum - Additional tokens
        {
            chainId: 1,
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            name: 'Wrapped Bitcoin',
            symbol: 'WBTC',
            decimals: 8,
            logoURI: '/token-icons/wbtc.png',
        },
        {
            chainId: 1,
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            name: 'Chainlink',
            symbol: 'LINK',
            decimals: 18,
            logoURI: '/token-icons/link.png',
        },
        {
            chainId: 1,
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            name: 'Uniswap',
            symbol: 'UNI',
            decimals: 18,
            logoURI: '/token-icons/uni.png',
        },
        {
            chainId: 1,
            address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            name: 'Aave',
            symbol: 'AAVE',
            decimals: 18,
            logoURI: '/token-icons/aave.png',
        },

        // Polygon - Basic tokens
        {
            chainId: 137,
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: '/token-icons/usdc.png',
        },
        {
            chainId: 137,
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logoURI: '/token-icons/usdt.png',
        },
        {
            chainId: 137,
            address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logoURI: '/token-icons/dai.png',
        },
        {
            chainId: 137,
            address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: '/token-icons/weth.png',
        },

        // Polygon - Additional tokens
        {
            chainId: 137,
            address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
            name: 'Wrapped Bitcoin',
            symbol: 'WBTC',
            decimals: 8,
            logoURI: '/token-icons/wbtc.png',
        },
        {
            chainId: 137,
            address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
            name: 'Chainlink',
            symbol: 'LINK',
            decimals: 18,
            logoURI: '/token-icons/link.png',
        },
        {
            chainId: 137,
            address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f',
            name: 'Uniswap',
            symbol: 'UNI',
            decimals: 18,
            logoURI: '/token-icons/uni.png',
        },
        {
            chainId: 137,
            address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B',
            name: 'Aave',
            symbol: 'AAVE',
            decimals: 18,
            logoURI: '/token-icons/aave.png',
        },

        // Arbitrum - Basic tokens
        {
            chainId: 42161,
            address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: '/token-icons/usdc.png',
        },
        {
            chainId: 42161,
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logoURI: '/token-icons/usdt.png',
        },
        {
            chainId: 42161,
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logoURI: '/token-icons/dai.png',
        },
        {
            chainId: 42161,
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: '/token-icons/weth.png',
        },

        // Arbitrum - Additional tokens
        {
            chainId: 42161,
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            name: 'Wrapped Bitcoin',
            symbol: 'WBTC',
            decimals: 8,
            logoURI: '/token-icons/wbtc.png',
        },
        {
            chainId: 42161,
            address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
            name: 'Chainlink',
            symbol: 'LINK',
            decimals: 18,
            logoURI: '/token-icons/link.png',
        },
        {
            chainId: 42161,
            address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
            name: 'Uniswap',
            symbol: 'UNI',
            decimals: 18,
            logoURI: '/token-icons/uni.png',
        },

        // Optimism - Basic tokens
        {
            chainId: 10,
            address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: '/token-icons/usdc.png',
        },
        {
            chainId: 10,
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logoURI: '/token-icons/usdt.png',
        },
        {
            chainId: 10,
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logoURI: '/token-icons/dai.png',
        },
        {
            chainId: 10,
            address: '0x4200000000000000000000000000000000000006',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: '/token-icons/weth.png',
        },

        // Optimism - Additional tokens
        {
            chainId: 10,
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            name: 'Wrapped Bitcoin',
            symbol: 'WBTC',
            decimals: 8,
            logoURI: '/token-icons/wbtc.png',
        },
        {
            chainId: 10,
            address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6',
            name: 'Chainlink',
            symbol: 'LINK',
            decimals: 18,
            logoURI: '/token-icons/link.png',
        },

        // Base - Basic tokens
        {
            chainId: 8453,
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: '/token-icons/usdc.png',
        },
        {
            chainId: 8453,
            address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logoURI: '/token-icons/dai.png',
        },
        {
            chainId: 8453,
            address: '0x4200000000000000000000000000000000000006',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: '/token-icons/weth.png',
        },

        // Base - Additional tokens
        {
            chainId: 8453,
            address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
            name: 'Chainlink',
            symbol: 'LINK',
            decimals: 18,
            logoURI: '/token-icons/link.png',
        },
    ],
}

export async function GET() {
    // Add cache headers to improve performance
    return NextResponse.json(extendedTokenList, {
        headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    })
}
