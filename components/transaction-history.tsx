"use client"

import { useOktoTransactions } from "@/hooks/use-okto-transactions"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"

export function TransactionHistory({ animated = true }: { animated?: boolean }) {
  const { transactions, isLoading, error } = useOktoTransactions()

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
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  // Helper function to safely format transaction amounts
  const formatAmount = (amount: string): string => {
    if (typeof amount === 'number') {
      return parseFloat(amount).toFixed(4);
    }
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      return isNaN(num) ? '0.0000' : num.toFixed(4);
    }
    return '0.0000';
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  };

  // Helper function to get type text
  const getTypeText = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType === 'send' || lowerType === 'sent') return 'Sent';
    if (lowerType === 'receive' || lowerType === 'received') return 'Received';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to get status class
  const getStatusClass = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'completed' || lowerStatus === 'success') return 'text-green-500';
    if (lowerStatus === 'failed' || lowerStatus === 'error') return 'text-red-500';
    if (lowerStatus === 'pending') return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const ListComponent = animated ? motion.div : "div"
  const TransactionComponent = animated ? motion.div : "div"

  return (
    <ListComponent
      className="space-y-2"
      variants={animated ? container : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "show" : undefined}
    >
      {transactions.map((tx) => (
        <TransactionComponent
          key={tx.id || `tx-${Date.now()}-${Math.random()}`}
          variants={animated ? item : undefined}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                (tx.type || '').toLowerCase() === 'send' || (tx.type || '').toLowerCase() === 'sent'
                  ? "bg-red-100" 
                  : "bg-green-100"
              }`}
            >
              {(tx.type || '').toLowerCase() === 'send' || (tx.type || '').toLowerCase() === 'sent' ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div>
              <div className="font-medium">
                {getTypeText(tx.type || '')} {tx.symbol || ''}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTimestamp(tx.timestamp)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {(tx.type || '').toLowerCase() === 'send' || (tx.type || '').toLowerCase() === 'sent' ? "-" : "+"}
              {formatAmount(tx.amount)} {tx.symbol || ''}
            </div>
            <div className={`text-xs ${getStatusClass(tx.status || '')}`}>
              {tx.status ? (tx.status.charAt(0).toUpperCase() + tx.status.slice(1)) : 'Unknown'}
            </div>
          </div>
        </TransactionComponent>
      ))}
    </ListComponent>
  )
}

