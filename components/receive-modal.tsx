"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useOktoAccount } from "@/hooks/use-okto-account"
import { Chain, useChainService } from "@/services/chain-service"
import { Copy, Minus, Plus } from "lucide-react"
import Image from "next/image"
import QRCode from "qrcode"
import { useEffect, useState } from "react"
import useSWR from "swr"

// Token list URLs - using popular maintained lists
const TOKEN_LISTS = {
  default: "https://tokens.uniswap.org", // Updated URL
  extended: "https://tokens.coingecko.com/uniswap/all.json"
}

interface TokenInfo {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

interface TokenList {
  name: string
  timestamp: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: TokenInfo[]
}

// Fetch function for token lists with proper error handling
const fetchTokenList = async (url: string): Promise<TokenList> => {
  try {
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache'
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch token list from ${url}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching token list:", error)
    throw error
  }
}

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { selectedAccount } = useOktoAccount()
  const { chains } = useChainService()
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("")
  const [selectedChain, setSelectedChain] = useState("")
  const [availableTokens, setAvailableTokens] = useState<Array<{id: string, symbol: string, name: string, contractAddress?: string, decimals: number, logoURI?: string}>>([])
  
  // Fetch token list
  const { data: tokenList, error: tokenListError } = useSWR<TokenList>(
    TOKEN_LISTS.default,
    fetchTokenList,
    { revalidateOnFocus: false }
  )

  const walletAddress = selectedAccount?.address || ""
  const selectedTokenData = availableTokens.find(t => t.id === selectedToken)

  // Update available tokens when chain changes
  useEffect(() => {
    if (selectedChain && tokenList) {
      const chainData = chains.find(c => c.id === selectedChain)
      if (chainData) {
        // Convert chain ID to number for comparison with token list
        const chainIdNumber = parseInt(chainData.id)
        
        // Filter tokens by chain ID
        const tokensForChain = tokenList.tokens
          .filter(token => token.chainId === chainIdNumber)
          // Map to our format
          .map(token => ({
            id: `${token.symbol.toLowerCase()}-${chainData.name.toLowerCase()}`,
            symbol: token.symbol,
            name: token.name,
            contractAddress: token.address,
            decimals: token.decimals,
            logoURI: token.logoURI
          }))
          // Add native token if not present
          const nativeToken = getNativeToken(chainData)
          if (nativeToken.length > 0 && !tokensForChain.some(token => token.id === nativeToken[0].id)) {
            tokensForChain.push({
              ...nativeToken[0],
              contractAddress: '',
              logoURI: undefined
            })
          }
        
          setAvailableTokens(tokensForChain)
          // Reset selected token when chain changes
        setSelectedToken("")
      }
    } else {
      setAvailableTokens([])
      setSelectedToken("")
    }
  }, [selectedChain, chains, tokenList])

  // Helper function to get native token for a chain
  const getNativeToken = (chain: Chain) => {
    const chainName = chain.name.toLowerCase()
    
    // Map of chain names to their native tokens
    const nativeTokens: Record<string, {symbol: string, name: string, decimals: number}> = {
      "ethereum": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "polygon": { symbol: "MATIC", name: "Polygon", decimals: 18 },
      "arbitrum": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "optimism": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "base": { symbol: "ETH", name: "Ethereum", decimals: 18 },
      "avalanche": { symbol: "AVAX", name: "Avalanche", decimals: 18 },
    }
    
    const nativeToken = nativeTokens[chainName]
    if (!nativeToken) return []
    
    return [{
      id: nativeToken.symbol.toLowerCase() + (chainName !== "ethereum" ? `-${chainName}` : ""),
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      decimals: nativeToken.decimals,
      logoURI: undefined,
      contractAddress: undefined
    }]
  }

  // Generate QR code data URL when wallet address or parameters change
  useEffect(() => {
    if (!walletAddress) return

    let qrData = walletAddress
    
    if (showAdvancedOptions && selectedTokenData) {
      // Get decimals directly from the selected token data
      const decimals = selectedTokenData.decimals || 18
      
      // Different format based on token type
      if (selectedTokenData.contractAddress) {
        // For ERC20 tokens
        // Format that works with most wallets: ethereum:<tokenAddress>@<chainId>/transfer?address=<recipientAddress>&uint256=<amountInSmallestUnits>
        const chainData = chains.find(c => c.id === selectedChain)
        const chainId = chainData?.id || "1" // Default to Ethereum mainnet
        
        // Calculate amount in token's smallest units based on its decimals
        let amountInSmallestUnits = "0"
        if (amount) {
          // Convert to token's smallest units using the correct decimals
          const multiplier = Math.pow(10, decimals)
          const amountValue = parseFloat(amount) * multiplier
          amountInSmallestUnits = amountValue.toLocaleString('fullwide', {useGrouping: false})
        }
        
        // Build the URI for ERC20 token transfer
        qrData = `ethereum:${selectedTokenData.contractAddress}@${chainId}/transfer?address=${walletAddress}&uint256=${amountInSmallestUnits}`
      } else {
        // For native currency (ETH, MATIC, etc.)
        const chainData = chains.find(c => c.id === selectedChain)
        const chainId = chainData?.id || "1" // Default to Ethereum mainnet
        
        // Format: ethereum:<address>@<chainId>?value=<amountInWei>
        qrData = `ethereum:${walletAddress}@${chainId}`
        
        if (amount) {
          // Convert to smallest units (wei for ETH, etc.)
          const multiplier = Math.pow(10, decimals)
          const valueInSmallestUnits = parseFloat(amount) * multiplier
          qrData += `?value=${valueInSmallestUnits.toLocaleString('fullwide', {useGrouping: false})}`
        }
      }
    }

    console.log("Generated QR data:", qrData) // For debugging

    // Generate QR code with error correction level Q (25%)
    QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'Q',
      margin: 2,
      width: 250,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrCodeDataUrl(url)
      })
      .catch(err => {
        console.error("Error generating QR code:", err)
      })
  }, [walletAddress, showAdvancedOptions, amount, selectedToken, selectedChain, chains, selectedTokenData])

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions)
  }

  const receiveContent = (
    <div className="space-y-4">
      <div className="flex justify-center py-4">
        <div className="rounded-lg overflow-hidden bg-white p-2">
          {qrCodeDataUrl ? (
            <Image src={qrCodeDataUrl} alt="Wallet QR Code" width={250} height={250} />
          ) : (
            <div className="w-[250px] h-[250px] bg-muted flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Your Wallet Address</p>
        <div className="flex items-center space-x-2">
          <div className="bg-muted p-2 rounded-md text-sm flex-1 overflow-hidden">
            <p className="truncate">{walletAddress}</p>
          </div>
          <Button size="icon" variant="outline" onClick={handleCopy}>
            {copied ? (
              <span className="text-green-600 text-xs">Copied!</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={toggleAdvancedOptions}
      >
        {showAdvancedOptions ? (
          <>
            <Minus className="h-4 w-4" />
            Hide Options
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add Payment Details
          </>
        )}
      </Button>

      {showAdvancedOptions && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="chain">Chain</Label>
            <select
              id="chain"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
            >
              <option value="">Select a chain</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <select
              id="token"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              disabled={!selectedChain}
            >
              <option value="">Select a token</option>
              {availableTokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            {!selectedChain && (
              <p className="text-xs text-muted-foreground">
                Please select a chain first
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Receive"
      description="Share your QR code to receive funds"
      contentClassName="max-w-md"
    >
      {tokenListError && (
        <div className="text-sm text-red-500 mb-2">
          Failed to load token list. Using limited token selection.
        </div>
      )}
      {receiveContent}
    </ResponsiveDialog>
  )
}

