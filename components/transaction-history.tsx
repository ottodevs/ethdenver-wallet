"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOktoTransactions } from "@/hooks/use-okto-transactions"
import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"

export function TransactionHistory({ animated = true }: { animated?: boolean }) {
  const { transactions, isLoading } = useOktoTransactions()

  // Animation variants for Framer Motion
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  if (animated) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {transactions.map((tx) => (
          <motion.div
            key={tx.id}
            variants={item}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              tx.status === "pending" ? "border-primary" : ""
            } bg-card text-card-foreground`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === "receive"
                    ? "bg-green-100 text-green-600"
                    : tx.type === "send"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {tx.type === "receive" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : tx.type === "send" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium capitalize">{tx.type}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-medium ${
                  tx.type === "receive" ? "text-green-600" : ""
                }`}
              >
                {tx.type === "receive" ? "+" : ""}
                {tx.amount.toFixed(4)} {tx.token}
              </p>
              <p
                className={`text-xs ${
                  tx.status === "completed"
                    ? "text-green-600"
                    : tx.status === "pending"
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  } else {
    return (
      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.id} className={tx.status === "pending" ? "border-primary" : ""}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  tx.type === "receive" 
                    ? "bg-green-100 text-green-600" 
                    : tx.type === "send" 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-purple-100 text-purple-600"
                }`}>
                  {tx.type === "receive" ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : tx.type === "send" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.type === "receive" ? "text-green-600" : ""
                  }`}>
                    {tx.type === "receive" ? "+" : ""}{tx.amount.toFixed(4)} {tx.token}
                  </p>
                  <p className={`text-xs ${
                    tx.status === "completed" 
                      ? "text-green-600" 
                      : tx.status === "pending" 
                        ? "text-amber-600" 
                        : "text-red-600"
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}

