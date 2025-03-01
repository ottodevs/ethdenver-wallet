"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function TransactionHistory() {
  const { transactions, isLoading } = useWallet()
  const [expandedTx, setExpandedTx] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
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
      {transactions.map((tx) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={cn("overflow-hidden cursor-pointer", expandedTx === tx.id ? "bg-muted/50" : "")}
            onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    tx.type === "send"
                      ? "bg-red-100 text-red-600"
                      : tx.type === "receive"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600",
                  )}
                >
                  {tx.type === "send" && <ArrowUpRight className="h-4 w-4" />}
                  {tx.type === "receive" && <ArrowDownLeft className="h-4 w-4" />}
                  {tx.type === "swap" && <RefreshCw className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium capitalize">{tx.type}</h3>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 8)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-normal",
                        tx.status === "completed"
                          ? "border-green-500 text-green-600"
                          : tx.status === "pending"
                            ? "border-yellow-500 text-yellow-600"
                            : "border-red-500 text-red-600",
                      )}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-medium",
                      tx.type === "send" ? "text-red-600" : tx.type === "receive" ? "text-green-600" : "",
                    )}
                  >
                    {tx.type === "send" ? "-" : tx.type === "receive" ? "+" : ""}
                    {tx.amount} {tx.token}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              {expandedTx === tx.id && tx.chainDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t px-3 py-2 bg-muted/30"
                >
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Chain Details</h4>
                    {tx.chainDetails.map((detail) => (
                      <div key={detail.chain} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {detail.chain}
                          </Badge>
                          <span>
                            {detail.amount} {tx.token}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Gas: {detail.gasFee}{" "}
                          {detail.chain === "ethereum" ? "ETH" : detail.chain === "polygon" ? "MATIC" : "Gas"}
                        </span>
                      </div>
                    ))}

                    {tx.type === "swap" && tx.swapDetails && (
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <div className="flex items-center justify-between text-sm">
                          <span>Rate</span>
                          <span>
                            1 {tx.swapDetails.fromToken} = {tx.swapDetails.rate} {tx.swapDetails.toToken}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Slippage</span>
                          <span>{tx.swapDetails.slippage}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

