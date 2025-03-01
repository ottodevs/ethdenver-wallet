"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

// Types
type TokenId = string
type ChainId = "ethereum" | "polygon" | "arbitrum" | "optimism" | "base"

interface Token {
  id: TokenId
  name: string
  symbol: string
  icon: string
  chain: ChainId
  balance: number
  valueUsd: number
}

interface Transaction {
  id: string
  type: "send" | "receive" | "swap"
  hash: string
  token: string
  amount: number
  timestamp: number
  status: "pending" | "completed" | "failed"
}

interface SendTransactionParams {
  type: "send"
  tokenId: TokenId
  recipient: string
  amount: number
}

interface WalletContextType {
  walletAddress: string
  totalBalanceUsd: number
  tokens: Token[]
  transactions: Transaction[]
  isLoading: boolean
  sendTransaction: (params: SendTransactionParams) => Promise<void>
  disconnect: () => void
}

// Mock data
const mockTokens: Token[] = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: "/placeholder.svg?height=40&width=40",
    chain: "ethereum",
    balance: 1.245,
    valueUsd: 3735,
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    icon: "/placeholder.svg?height=40&width=40",
    chain: "ethereum",
    balance: 2500,
    valueUsd: 2500,
  },
  {
    id: "matic",
    name: "Polygon",
    symbol: "MATIC",
    icon: "/placeholder.svg?height=40&width=40",
    chain: "polygon",
    balance: 1500,
    valueUsd: 1200,
  },
  {
    id: "arb",
    name: "Arbitrum",
    symbol: "ARB",
    icon: "/placeholder.svg?height=40&width=40",
    chain: "arbitrum",
    balance: 500,
    valueUsd: 350,
  },
  {
    id: "op",
    name: "Optimism",
    symbol: "OP",
    icon: "/placeholder.svg?height=40&width=40",
    chain: "optimism",
    balance: 200,
    valueUsd: 240,
  },
]

const mockTransactions: Transaction[] = [
  {
    id: "tx1",
    type: "receive",
    hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    token: "ETH",
    amount: 0.5,
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    status: "completed",
  },
  {
    id: "tx2",
    type: "send",
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    token: "USDC",
    amount: 100,
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    status: "completed",
  },
  {
    id: "tx3",
    type: "swap",
    hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
    token: "ETH → USDC",
    amount: 0.2,
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    status: "completed",
  },
  {
    id: "tx4",
    type: "send",
    hash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
    token: "MATIC",
    amount: 50,
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    status: "failed",
  },
]

// Context
const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [tokens, setTokens] = useState<Token[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [totalBalanceUsd, setTotalBalanceUsd] = useState(0)
  const walletAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"

  // Simulate loading data
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setTokens(mockTokens)
      setTransactions(mockTransactions)
      setTotalBalanceUsd(mockTokens.reduce((sum, token) => sum + token.valueUsd, 0))
      setIsLoading(false)
    }

    loadData()
  }, [])

  // Optimistic UI updates for transactions
  const sendTransaction = async (params: SendTransactionParams) => {
    const token = tokens.find((t) => t.id === params.tokenId)
    if (!token) throw new Error("Token not found")

    // Create optimistic transaction
    const optimisticTx: Transaction = {
      id: `pending-${Date.now()}`,
      type: "send",
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      token: token.symbol,
      amount: params.amount,
      timestamp: Date.now(),
      status: "pending",
    }

    // Update UI optimistically
    setPendingTransactions((prev) => [optimisticTx, ...prev])

    // Optimistically update token balance
    const updatedTokens = tokens.map((t) => {
      if (t.id === params.tokenId) {
        const newBalance = t.balance - params.amount
        return {
          ...t,
          balance: newBalance,
          valueUsd: (newBalance / t.balance) * t.valueUsd,
        }
      }
      return t
    })

    setTokens(updatedTokens)
    setTotalBalanceUsd(updatedTokens.reduce((sum, t) => sum + t.valueUsd, 0))

    // Simulate transaction processing
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Transaction succeeded
      const completedTx = {
        ...optimisticTx,
        status: "completed" as const,
      }

      setTransactions((prev) => [completedTx, ...prev])
      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== optimisticTx.id))
    } catch (error) {
      // Transaction failed - revert optimistic updates
      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== optimisticTx.id))
      setTokens(mockTokens)
      setTotalBalanceUsd(mockTokens.reduce((sum, token) => sum + token.valueUsd, 0))

      // Add failed transaction to history
      const failedTx = {
        ...optimisticTx,
        status: "failed" as const,
      }

      setTransactions((prev) => [failedTx, ...prev])
      throw error
    }
  }

  const disconnect = () => {
    // In a real app, this would clear authentication state
    console.log("Wallet disconnected")
  }

  // Combine pending and confirmed transactions for UI
  const allTransactions = [...pendingTransactions, ...transactions]

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        totalBalanceUsd,
        tokens,
        transactions: allTransactions,
        isLoading,
        sendTransaction,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

