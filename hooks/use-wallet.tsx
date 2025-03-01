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
  privacyMode: boolean
  togglePrivacyMode: () => void
  sendTransaction: (params: SendTransactionParams) => Promise<void>
  disconnect: () => void
  getTokenDistribution: (tokenId: string) => { chain: ChainId; amount: number }[]
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

// Add this at the beginning of the file, after imports
const PRIVACY_MODE_KEY = 'wallet_privacy_mode';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [tokens, setTokens] = useState<Token[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [totalBalanceUsd, setTotalBalanceUsd] = useState(0)
  const [walletAddress/*, setWalletAddress*/] = useState<string>("")
  
  // Initialize privacy mode from localStorage if available
  const [privacyMode, setPrivacyMode] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(PRIVACY_MODE_KEY);
      return savedMode === 'true';
    }
    return false;
  })

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

  // Toggle privacy mode and save to localStorage
  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const newValue = !prev;
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(PRIVACY_MODE_KEY, String(newValue));
      }
      return newValue;
    })
  }

  // Get token distribution across chains
  const getTokenDistribution = (tokenId: string) => {
    const token = tokens.find((t) => t.id === tokenId)
    if (!token) return []

    // Mock distribution data - in a real app this would come from the blockchain
    const chains: ChainId[] = ["ethereum", "polygon", "arbitrum", "optimism", "base"]
    const distribution: { chain: ChainId; amount: number }[] = []

    // Generate random distribution that adds up to the total balance
    let remainingBalance = token.balance

    // Assign random amounts to each chain except the last one
    for (let i = 0; i < chains.length - 1; i++) {
      // Skip the chain if it's not the token's primary chain and random chance
      if (chains[i] !== token.chain && Math.random() > 0.6) continue

      // Assign a random portion of the remaining balance
      const portion = Math.random() * 0.7
      const amount = Number((remainingBalance * portion).toFixed(6))

      if (amount > 0) {
        distribution.push({
          chain: chains[i],
          amount,
        })
        remainingBalance -= amount
      }
    }

    // Assign the remaining balance to the token's primary chain
    if (remainingBalance > 0) {
      const existingChainIndex = distribution.findIndex((d) => d.chain === token.chain)

      if (existingChainIndex >= 0) {
        distribution[existingChainIndex].amount += remainingBalance
      } else {
        distribution.push({
          chain: token.chain,
          amount: remainingBalance,
        })
      }
    }

    return distribution
  }

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
        privacyMode,
        togglePrivacyMode,
        sendTransaction,
        disconnect,
        getTokenDistribution,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  // const { isAuthenticated } = useAuth();
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

