"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/hooks/use-wallet"
import { Check, Copy } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { tokens, walletAddress } = useWallet()
  const [selectedChain, setSelectedChain] = useState("ethereum")
  const [selectedToken, setSelectedToken] = useState("")
  const [amount, setAmount] = useState("")
  const [showAmountOptions, setShowAmountOptions] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getQrData = () => {
    let data = walletAddress

    if (showAmountOptions && selectedToken && amount) {
      data = `${selectedChain}:${walletAddress}?amount=${amount}&token=${selectedToken}`
    }

    return data
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Assets</DialogTitle>
          <DialogDescription>Share your address to receive tokens.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Select Network</Label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
                <SelectItem value="optimism">Optimism</SelectItem>
                <SelectItem value="base">Base</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Specify Amount</h4>
            <Switch checked={showAmountOptions} onCheckedChange={setShowAmountOptions} />
          </div>

          {showAmountOptions && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens
                      .filter((token) => token.chain === selectedChain)
                      .map((token) => (
                        <SelectItem key={token.id} value={token.symbol}>
                          {token.name} ({token.symbol})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-lg">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getQrData())}`}
                alt="QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Wallet Address</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={walletAddress} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="relative">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied && (
                  <span className="absolute -top-8 right-0 bg-background border rounded-md px-2 py-1 text-xs whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only send {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} assets to this address.
              {showAmountOptions && selectedToken && amount && (
                <span className="block mt-1 font-medium">
                  Requesting: {amount} {selectedToken}
                </span>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

