export type ExplorerType = 'address' | 'transaction' | 'token' | 'block'

interface ChainExplorer {
  name: string
  url: string
  icon: string
  multichain?: boolean
}

// Map of chain IDs to explorer URLs
const EXPLORERS: Record<string, ChainExplorer> = {
  ethereum: {
    name: 'Etherscan',
    url: 'https://etherscan.io',
    icon: '/chain-icons/ethereum.svg',
    multichain: true
  },
  polygon: {
    name: 'Polygonscan',
    url: 'https://polygonscan.com',
    icon: '/chain-icons/polygon.svg',
    multichain: false
  },
  arbitrum: {
    name: 'Arbiscan',
    url: 'https://arbiscan.io',
    icon: '/chain-icons/arbitrum.svg',
    multichain: false
  },
  optimism: {
    name: 'Optimism Explorer',
    url: 'https://optimistic.etherscan.io',
    icon: '/chain-icons/optimism.svg',
    multichain: false
  },
  base: {
    name: 'Base Explorer',
    url: 'https://basescan.org',
    icon: '/chain-icons/base.svg',
    multichain: false
  }
}

export function getExplorerUrl(
  chainId: string = 'ethereum',
  type: ExplorerType = 'address',
  value: string,
  useMultichain: boolean = true
): string {
  const explorer = EXPLORERS[chainId.toLowerCase()] || EXPLORERS.ethereum
  
  // If multichain is requested and supported, use it
  if (useMultichain && explorer.multichain && type === 'address') {
    return `${explorer.url}/${type}/${value}#multichain-portfolio`
  }
  
  // Otherwise use standard explorer URL
  return `${explorer.url}/${type}/${value}`
}

export function openExplorer(
  chainId: string = 'ethereum',
  type: ExplorerType = 'address',
  value: string,
  useMultichain: boolean = true
): void {
  const url = getExplorerUrl(chainId, type, value, useMultichain)
  window.open(url, '_blank', 'noopener,noreferrer')
} 