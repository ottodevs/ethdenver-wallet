"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOktoAccount } from "@/hooks/use-okto-account"
import { useTokenList } from "@/hooks/use-token-list"
import { Copy, Minus, Plus } from "lucide-react"
import Image from "next/image"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

export function ReceiveTab() {
  const { selectedAccount } = useOktoAccount()
  const { 
    chains, 
    selectedChain, 
    setSelectedChain, 
    selectedToken, 
    setSelectedToken, 
    availableTokens, 
    selectedTokenData,
    tokenListError 
  } = useTokenList()
  
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [amount, setAmount] = useState("")

  const walletAddress = selectedAccount?.address || ""

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

  return (
    <div className="space-y-4">
      {tokenListError && (
        <div className="text-sm text-red-500 mb-2">
          Failed to load token list. Using limited token selection.
        </div>
      )}
      
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
} 