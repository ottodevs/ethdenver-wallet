"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"
import { TokenDetail } from "@/components/token-detail"
import { Share2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TokenList() {
  const { tokens, isLoading, privacyMode, togglePrivacyMode } = useWallet()
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  const [showTokenDetail, setShowTokenDetail] = useState<string | null>(null)

  const smallValueTokens = tokens.filter((token) => token.valueUsd < 10)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto mt-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          layout
        >
          <Card
            className={cn(
              "overflow-hidden cursor-pointer transition-all duration-300",
              expandedToken === token.id ? "bg-muted/50" : "",
            )}
            onClick={() => setExpandedToken(expandedToken === token.id ? null : token.id)}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image src={token.icon || "/placeholder.svg"} alt={token.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{token.name}</h3>
                    <Badge variant="outline" className="text-xs font-normal">
                      {token.chain}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{token.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${privacyMode ? "*****" : token.valueUsd.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {privacyMode ? "*****" : token.balance.toLocaleString()} {token.symbol}
                  </p>
                </div>
              </div>

              {expandedToken === token.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t px-3 py-2 bg-muted/30"
                >
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <button className="rounded-md py-2 hover:bg-muted transition-colors">Send</button>
                    <button className="rounded-md py-2 hover:bg-muted transition-colors">Receive</button>
                    <button className="rounded-md py-2 hover:bg-muted transition-colors">Swap</button>
                    <button
                      className="rounded-md py-2 hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTokenDetail(token.id)
                      }}
                    >
                      Details
                    </button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
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
    </div>
  )
}

