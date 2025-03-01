"use client";

import { Skeleton as TransactionSkeleton } from "@/components/ui/skeleton";
import { useOktoTransactions } from "@/hooks/use-okto-transactions";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function TransactionHistory({ animated = true }: { animated?: boolean }) {
  const { transactions, isLoading, hasInitialized, error, refetch } = useOktoTransactions()
  const [showRefreshButton, setShowRefreshButton] = useState(false)

  // Show refresh button if there's an error or no transactions after initialization
  useEffect(() => {
    if ((error || (hasInitialized && (!transactions || transactions.length === 0))) && !isLoading) {
      setShowRefreshButton(true)
    } else {
      setShowRefreshButton(false)
    }
  }, [error, hasInitialized, transactions, isLoading])

  // Animation variants for Framer Motion
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  // Show skeletons during initial loading
  if (isLoading && !hasInitialized) {
    return (
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <TransactionSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <p className="text-sm text-red-500 mb-3">{error}</p>
        {showRefreshButton && (
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-4 py-2 bg-primary/80 text-primary-foreground rounded-md hover:bg-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Show empty state after loading is complete
  if ((!transactions || transactions.length === 0) && hasInitialized) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No transactions found</p>
        {showRefreshButton && (
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-4 py-2 bg-primary/80 text-primary-foreground rounded-md hover:bg-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>
    );
  }

  // Helper function to format small numbers in a readable way
  const formatSmallAmount = (amount: number): string => {
    // For very small numbers, use significant digits instead of fixed decimals
    if (amount === 0) return "0";

    if (Math.abs(amount) < 0.000001) {
      // Use scientific notation for extremely small numbers
      return amount.toExponential(2);
    }

    if (Math.abs(amount) < 0.0001) {
      return amount.toFixed(8);
    }

    if (Math.abs(amount) < 0.01) {
      return amount.toFixed(6);
    }

    if (Math.abs(amount) < 1) {
      return amount.toFixed(4);
    }

    if (Math.abs(amount) < 100) {
      return amount.toFixed(2);
    }

    // For larger numbers, no decimals needed
    return Math.round(amount).toString();
  };

  // Helper function to safely format transaction amounts
  const formatAmount = (amount: string | number): string => {
    if (amount === undefined || amount === null) return "0";

    let num: number;
    if (typeof amount === "number") {
      num = amount;
    } else if (typeof amount === "string") {
      num = parseFloat(amount);
      if (isNaN(num)) return "0";
    } else {
      return "0";
    }

    return formatSmallAmount(num);
  };

  // Helper function to format USD value
  const formatUsdValue = (
    value: string | number | null,
    symbol: string = ""
  ): string => {
    // If value is null/undefined, try to find matching transaction by symbol
    if (value === null || value === undefined) {
      if (symbol) {
        const matchingTx = transactions.find((tx) => tx.symbol === symbol);
        if (
          matchingTx &&
          matchingTx.valueUsd &&
          typeof matchingTx.valueUsd === "number"
        ) {
          return `$${matchingTx.valueUsd.toFixed(2)}`;
        }
      }
      return ""; // Return empty string instead of "$0.00" to match HEAD behavior
    }

    let numValue: number;
    if (typeof value === "string") {
      numValue = parseFloat(value);
      if (isNaN(numValue)) return "";
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      return "";
    }

    // Don't show USD value if it's zero or very small
    if (numValue === 0 || Math.abs(numValue) < 0.01) return "";

    return `$${numValue.toFixed(2)}`;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    try {
      // Validate timestamp is reasonable (not in the future, not too far in the past)
      const now = Date.now();
      if (timestamp > now) {
        timestamp = now; // Cap at current time if in future
      }

      // Check if timestamp is unreasonably old (before 2020)
      const year2020 = new Date("2020-01-01").getTime();
      if (timestamp < year2020) {
        return "Recently"; // Default for suspicious timestamps
      }

      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Recently"; // Fallback for any errors
    }
  };

  // Helper function to get transaction type text
  const getTypeText = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType === "send" || lowerType === "sent") return "Sent";
    if (lowerType === "receive" || lowerType === "received") return "Received";
    if (lowerType === "swap") return "Swapped";
    if (lowerType === "deposit") return "Received";
    if (lowerType === "withdraw") return "Withdrew";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to get status class
  const getStatusClass = (status: string): string => {
    if (!status) return "text-muted-foreground";

    const lowerStatus = status.toLowerCase();
    if (
      lowerStatus === "completed" ||
      lowerStatus === "success" ||
      lowerStatus === "true"
    )
      return "text-green-500";
    if (lowerStatus === "pending") return "text-yellow-500";
    if (
      lowerStatus === "failed" ||
      lowerStatus === "error" ||
      lowerStatus === "false"
    )
      return "text-red-500";
    return "text-muted-foreground";
  };

  // Format status text properly
  const formatStatus = (status: string): string => {
    if (!status) return "";

    if (status.toLowerCase() === "true") return "Completed";
    if (status.toLowerCase() === "false") return "Failed";

    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Use motion.div for animations or regular div if animations are disabled
  const ListComponent = animated ? motion.div : "div";
  const TransactionComponent = animated ? motion.div : "div";

  return (
    <ListComponent
      className="px-4"
      variants={animated ? container : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "show" : undefined}
    >
      {transactions.map((tx) => {
        // Format USD value if available - try multiple properties
        const usdValue = formatUsdValue(tx.valueUsd || 0, tx.symbol || "");
        const formattedAmount = formatAmount(tx.amount);
        const isOutgoing =
          (tx.type || "").toLowerCase() === "send" ||
          (tx.type || "").toLowerCase() === "sent";

        return (
          <TransactionComponent
            key={tx.id || `tx-${Date.now()}-${Math.random()}`}
            variants={animated ? item : undefined}
            className="flex p-2 rounded-md hover:bg-muted/50 pb-4 mb-4 border-b border-[#272A3B]"
          >
            <div className="mr-3">
              <div
                className={`p-2 rounded-full ${
                  isOutgoing ? "bg-red-100" : "bg-green-100"
                }`}
              >
                {isOutgoing ? (
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {getTypeText(tx.type || "")} {tx.symbol || ""}
                {tx.networkName && (
                  <span className="text-xs text-muted-foreground ml-1">
                    on {tx.networkName}
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {formatTimestamp(tx.timestamp)}
                {tx.status && (
                  <span className={`ml-2 ${getStatusClass(tx.status)}`}>
                    • {formatStatus(tx.status)}
                  </span>
                )}
              </div>

              <div className="flex items-baseline">
                <span
                  className={`font-medium ${
                    isOutgoing ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isOutgoing ? "-" : "+"}
                  {formattedAmount} {tx.symbol || ""}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {usdValue}
                </span>
              </div>
            </div>
          </TransactionComponent>
        );
      })}
      
      {/* Show loading indicator for subsequent loads */}
      {isLoading && hasInitialized && (
        <div className="p-2 text-center">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
        </div>
      )}
    </ListComponent>
  );
}
