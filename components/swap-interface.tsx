"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio"
// import { useChainService } from "@/services/chain-service"
import { motion } from "framer-motion"
import { ArrowDown, Check, Loader2 } from "lucide-react"
import { useState } from "react"

interface SwapInterfaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SwapInterface({  onOpenChange }: SwapInterfaceProps) {
  const { tokens } = useOktoPortfolio()
  // const { chains } = useChainService()
  
  const [fromToken, setFromToken] = useState("")
  const [toToken, setToToken] = useState("")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const fromTokenData = tokens.find(t => t.id === fromToken)
  const toTokenData = tokens.find(t => t.id === toToken)

  // This is a placeholder for swap functionality
  // In a real implementation, you would integrate with a DEX or swap service
  const handleSwap = async () => {
    if (!fromTokenData || !toTokenData || !amount) return
    
    setStatus("loading")
    setErrorMessage("")
    
    try {
      // Simulate a swap delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, we'll just simulate success
      // In a real implementation, you would call a swap service
      setStatus("success")
    } catch (error) {
      console.error("Swap failed:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Swap failed")
    }
  }

  const handleClose = () => {
    if (status !== "loading") {
      onOpenChange(false)
      // Reset form after animation completes
      setTimeout(() => {
        setFromToken("")
        setToToken("")
        setAmount("")
        setStatus("idle")
        setErrorMessage("")
      }, 300)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Swap</h2>
            <p className="text-sm text-muted-foreground">
              Swap tokens at the best rates
            </p>
          </div>

          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromToken">From</Label>
                <select
                  id="fromToken"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
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
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {fromTokenData && (
                  <p className="text-xs text-muted-foreground">
                    Available: {fromTokenData.balance.toFixed(4)} {fromTokenData.symbol}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <div className="bg-muted rounded-full p-2">
                  <ArrowDown className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toToken">To</Label>
                <select
                  id="toToken"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                >
                  <option value="">Select a token</option>
                  {tokens
                    .filter((t) => t.id !== fromToken)
                    .map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.symbol}
                      </option>
                    ))}
                </select>
              </div>

              {fromTokenData && toTokenData && amount && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    Estimated: {parseFloat(amount) * 0.98} {toTokenData.symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    1 {fromTokenData.symbol} ≈ {(fromTokenData.valueUsd / toTokenData.valueUsd).toFixed(6)} {toTokenData.symbol}
                  </p>
                </div>
              )}

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
                  onClick={handleSwap}
                  disabled={!fromToken || !toToken || !amount}
                >
                  Swap
                </Button>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center font-medium">
                Processing your swap...
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Please wait while we process your swap. This may take a moment.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center font-medium">Swap Successful!</p>
              <p className="text-center text-sm text-muted-foreground">
                Your swap has been successfully processed.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <p className="text-center font-medium">Swap Failed</p>
              <p className="text-center text-sm text-muted-foreground">
                {errorMessage || "There was an error processing your swap."}
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
      </motion.div>
    </motion.div>
  )
}

