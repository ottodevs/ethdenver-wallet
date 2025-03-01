"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useOktoAccount } from "@/hooks/use-okto-account"
import { useChainService } from "@/services/chain-service"
import { Copy, Minus, Plus } from "lucide-react"
import Image from "next/image"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

// Popular tokens by chain
const POPULAR_TOKENS: Record<string, Array<{id: string, symbol: string, name: string, contractAddress?: string}>> = {
  "ethereum": [
    { id: "eth", symbol: "ETH", name: "Ethereum" },
    { id: "usdc-ethereum", symbol: "USDC", name: "USD Coin", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { id: "usdt-ethereum", symbol: "USDT", name: "Tether", contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { id: "dai-ethereum", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    { id: "wbtc-ethereum", symbol: "WBTC", name: "Wrapped Bitcoin", contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
  ],
  "polygon": [
    { id: "matic", symbol: "MATIC", name: "Polygon" },
    { id: "usdc-polygon", symbol: "USDC", name: "USD Coin", contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    { id: "usdt-polygon", symbol: "USDT", name: "Tether", contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    { id: "dai-polygon", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },
  ],
  "arbitrum": [
    { id: "eth-arbitrum", symbol: "ETH", name: "Ethereum" },
    { id: "usdc-arbitrum", symbol: "USDC", name: "USD Coin", contractAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" },
    { id: "usdt-arbitrum", symbol: "USDT", name: "Tether", contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
    { id: "dai-arbitrum", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
  ],
  "optimism": [
    { id: "eth-optimism", symbol: "ETH", name: "Ethereum" },
    { id: "usdc-optimism", symbol: "USDC", name: "USD Coin", contractAddress: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
    { id: "dai-optimism", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
  ],
  "base": [
    { id: "eth-base", symbol: "ETH", name: "Ethereum" },
    { id: "usdc-base", symbol: "USDC", name: "USD Coin", contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    { id: "dai-base", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
  ],
  "avalanche": [
    { id: "avax", symbol: "AVAX", name: "Avalanche" },
    { id: "usdc-avalanche", symbol: "USDC", name: "USD Coin", contractAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
    { id: "usdt-avalanche", symbol: "USDT", name: "Tether", contractAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
    { id: "dai-avalanche", symbol: "DAI", name: "Dai Stablecoin", contractAddress: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70" },
  ]
}

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  // Ethereum tokens
  "eth": 18,
  "usdc-ethereum": 6,
  "usdt-ethereum": 6,
  "dai-ethereum": 18,
  "wbtc-ethereum": 8,
  
  // Polygon tokens
  "matic": 18,
  "usdc-polygon": 6,
  "usdt-polygon": 6,
  "dai-polygon": 18,
  
  // Arbitrum tokens
  "eth-arbitrum": 18,
  "usdc-arbitrum": 6,
  "usdt-arbitrum": 6,
  "dai-arbitrum": 18,
  
  // Optimism tokens
  "eth-optimism": 18,
  "usdc-optimism": 6,
  "dai-optimism": 18,
  
  // Base tokens
  "eth-base": 18,
  "usdc-base": 6,
  "dai-base": 18,
  
  // Avalanche tokens
  "avax": 18,
  "usdc-avalanche": 6,
  "usdt-avalanche": 6,
  "dai-avalanche": 18
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
  const [availableTokens, setAvailableTokens] = useState<Array<{id: string, symbol: string, name: string, contractAddress?: string}>>([])

  const walletAddress = selectedAccount?.address || ""
  const selectedTokenData = availableTokens.find(t => t.id === selectedToken)

  // Update available tokens when chain changes
  useEffect(() => {
    if (selectedChain) {
      const chainData = chains.find(c => c.id === selectedChain)
      if (chainData) {
        const chainName = chainData.name.toLowerCase()
        const tokensForChain = POPULAR_TOKENS[chainName] || []
        setAvailableTokens(tokensForChain)
        
        // Reset selected token when chain changes
        setSelectedToken("")
      }
    } else {
      setAvailableTokens([])
      setSelectedToken("")
    }
  }, [selectedChain, chains])

  // Generate QR code data URL when wallet address or parameters change
  useEffect(() => {
    if (!walletAddress) return

    // For basic address sharing (no parameters)
    let qrData = walletAddress
    
    if (showAdvancedOptions && selectedTokenData) {
      // Get the correct decimals for the selected token
      const decimals = TOKEN_DECIMALS[selectedTokenData.id] || 18
      
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
      {receiveContent}
    </ResponsiveDialog>
  )
}

