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

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { tokens, walletAddress } = useWallet()
  const [selectedChain, setSelectedChain] = useState("ethereum")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-lg">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`}
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
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only send {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} assets to this address.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

