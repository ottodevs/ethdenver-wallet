"use client"

import { TokenDetail } from "@/components/token-detail"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio"
import { useWallet } from "@/hooks/use-wallet"
import { motion } from "framer-motion"
import { Eye, EyeOff, Share2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
export function TokenList() {
  const { privacyMode, togglePrivacyMode } = useWallet()
  const { tokens, isLoading } = useOktoPortfolio()
  const [showTokenDetail, setShowTokenDetail] = useState<string | null>(null)

  const smallValueTokens = tokens.filter((token) => token.valueUsd < 10)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
              <div className="h-3 w-12 bg-muted animate-pulse rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tokens found in your wallet</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Your Assets</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={togglePrivacyMode} className="h-8 w-8">
            {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tokens.map((token) => (
        <motion.div
          key={token.id}
          variants={item}
          className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
              <Image
                src={token.icon}
                alt={token.symbol}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                }}
              />
            </div>
            <div>
              <p className="font-medium">{token.symbol}</p>
              <p className="text-xs text-muted-foreground">{token.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {privacyMode ? "••••" : token.balance.toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground">
              {privacyMode ? "••••" : `$${token.valueUsd.toFixed(2)}`}
            </p>
          </div>
        </motion.div>
      ))}

      {smallValueTokens.length > 0 && (
        <Card className="overflow-hidden cursor-pointer bg-muted/30 border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">+{smallValueTokens.length}</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">{smallValueTokens.length} tokens under $10</h3>
                  <p className="text-xs text-muted-foreground">
                    Total: ${smallValueTokens.reduce((sum, t) => sum + t.valueUsd, 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Consolidate to ETH
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showTokenDetail && <TokenDetail tokenId={showTokenDetail} onClose={() => setShowTokenDetail(null)} />}
    </motion.div>
  )
}

