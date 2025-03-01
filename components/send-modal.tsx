"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/hooks/use-wallet"
import { ArrowUpRight, Loader2 } from "lucide-react"

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendModal({ open, onOpenChange }: SendModalProps) {
  const { tokens, sendTransaction } = useWallet()
  const [selectedToken, setSelectedToken] = useState("")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isSending, setIsSending] = useState(false)

  const selectedTokenData = tokens.find((t) => t.id === selectedToken)

  const handleSend = async () => {
    if (!selectedToken || !recipient || !amount) return

    setIsSending(true)
    try {
      await sendTransaction({
        type: "send",
        tokenId: selectedToken,
        recipient,
        amount: Number.parseFloat(amount),
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to send transaction:", error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Assets</DialogTitle>
          <DialogDescription>Send tokens to another wallet address.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="token">Select Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    <div className="flex items-center gap-2">
                      <span>{token.name}</span>
                      <span className="text-muted-foreground">
                        ({token.balance} {token.symbol})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              {selectedTokenData && (
                <span className="text-xs text-muted-foreground">
                  Available: {selectedTokenData.balance} {selectedTokenData.symbol}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => selectedTokenData && setAmount(selectedTokenData.balance.toString())}
              >
                Max
              </Button>
            </div>
            {selectedTokenData && amount && (
              <p className="text-xs text-muted-foreground">
                ≈ ${((Number.parseFloat(amount) * selectedTokenData.valueUsd) / selectedTokenData.balance).toFixed(2)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedToken || !recipient || !amount || isSending}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

