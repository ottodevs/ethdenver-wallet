"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio"
import { useChainService } from "@/services/chain-service"
import { useTokenTransferService } from "@/services/token-transfer-service"
import { Check, Loader2 } from "lucide-react"
import { useState } from "react"

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendModal({ open, onOpenChange }: SendModalProps) {
  const { tokens } = useOktoPortfolio()
  const { sendToken } = useTokenTransferService()
  const { chains } = useChainService()
  
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [txHash, setTxHash] = useState("")

  const selectedTokenData = tokens.find(t => t.id === selectedToken)
  
  const handleSend = async () => {
    if (!selectedTokenData || !recipient || !amount) return
    
    setStatus("loading")
    setErrorMessage("")
    
    try {
      // Find the chain for the selected token
      const tokenChain = selectedTokenData.chain
      const chainData = chains.find(c => c.name.toLowerCase() === tokenChain)
      
      if (!chainData) {
        throw new Error("Chain not found for selected token")
      }
      
      const result = await sendToken({
        tokenId: selectedTokenData.id,
        symbol: selectedTokenData.symbol,
        recipient,
        amount: parseFloat(amount),
        caip2Id: chainData.caip2Id
      })
      
      setTxHash(result)
      setStatus("success")
    } catch (error) {
      console.error("Send transaction failed:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  const handleClose = () => {
    if (status !== "loading") {
      onOpenChange(false)
      // Reset form after animation completes
      setTimeout(() => {
        setRecipient("")
        setAmount("")
        setSelectedToken("")
        setStatus("idle")
        setErrorMessage("")
        setTxHash("")
      }, 300)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Send"
      description="Send tokens to another wallet address"
      contentClassName="max-w-md bg-gradient-to-br from-[#252531] to-[#13121E]"
    >
      <div className="space-y-4 pb-6">
        {status === "idle" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <select
                id="token"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="">Select a token</option>
                {tokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.symbol} - {token.balance.toFixed(4)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
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
              {selectedTokenData && (
                <p className="text-xs text-muted-foreground">
                  Available: {selectedTokenData.balance.toFixed(4)} {selectedTokenData.symbol}
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSend}
                disabled={!selectedToken || !recipient || !amount}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center font-medium">
              Processing your transaction...
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Please wait while we process your transaction. This may take a moment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-center font-medium">Transaction Successful!</p>
            <p className="text-center text-sm text-muted-foreground">
              Your transaction has been successfully processed.
            </p>
            {txHash && (
              <p className="text-xs text-center break-all">
                Transaction Hash: {txHash}
              </p>
            )}
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <p className="text-center font-medium">Transaction Failed</p>
            <p className="text-center text-sm text-muted-foreground">
              {errorMessage || "There was an error processing your transaction."}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setStatus("idle")}>Try Again</Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  )
}

