"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/hooks/use-wallet"
import { ArrowDown, Settings } from "lucide-react"

interface SwapInterfaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SwapInterface({ open, onOpenChange }: SwapInterfaceProps) {
  const { tokens } = useWallet()
  const [fromToken, setFromToken] = useState("")
  const [toToken, setToToken] = useState("")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  const handleSwap = async () => {
    // Implement swap logic here
    console.log("Swap initiated", { fromToken, toToken, fromAmount, toAmount })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Swap Tokens</DialogTitle>
          <DialogDescription>Exchange your tokens at the best rates.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="from-token">From</Label>
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger id="from-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="from-amount"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setFromToken(toToken)
                setToToken(fromToken)
                setFromAmount(toAmount)
                setToAmount(fromAmount)
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to-token">To</Label>
            <Select value={toToken} onValueChange={setToToken}>
              <SelectTrigger id="to-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="to-amount" placeholder="0.0" value={toAmount} onChange={(e) => setToAmount(e.target.value)} />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Exchange Rate</span>
            <span>
              1 {fromToken} = X {toToken}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={handleSwap} disabled={!fromToken || !toToken || !fromAmount}>
            Swap
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

