"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenList } from "@/components/token-list"
import { TransactionHistory } from "@/components/transaction-history"
import { SendModal } from "@/components/send-modal"
import { ReceiveModal } from "@/components/receive-modal"
import { OptionsDropdown } from "@/components/options-dropdown"
import { useWallet } from "@/hooks/use-wallet"
import { ArrowDownLeft, ArrowUpRight, BarChart3, WalletIcon } from "lucide-react"

export function Wallet() {
  const { totalBalanceUsd, isLoading } = useWallet()
  const [activeTab, setActiveTab] = useState("assets")
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 bg-primary/10">
            <WalletIcon className="h-5 w-5 text-primary" />
          </Avatar>
          <h1 className="text-xl font-bold">Multi-Chain Wallet</h1>
        </div>
        <OptionsDropdown />
      </div>

      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/80 to-primary shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1 text-primary-foreground">
            <span className="text-sm font-medium opacity-80">Total Balance</span>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-10 w-40 animate-pulse rounded-md bg-primary-foreground/20" />
              ) : (
                <motion.h2
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ${totalBalanceUsd.toLocaleString()}
                </motion.h2>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => setSendModalOpen(true)}>
          <ArrowUpRight className="h-5 w-5 text-primary" />
          <span>Send</span>
        </Button>
        <Button variant="outline" className="flex flex-col gap-1 h-auto py-3" onClick={() => setReceiveModalOpen(true)}>
          <ArrowDownLeft className="h-5 w-5 text-primary" />
          <span>Receive</span>
        </Button>
        <Button variant="outline" className="flex flex-col gap-1 h-auto py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>Swap</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="assets" className="mt-4">
          <TokenList />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <TransactionHistory />
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {sendModalOpen && <SendModal open={sendModalOpen} onOpenChange={setSendModalOpen} />}
      </AnimatePresence>

      <AnimatePresence>
        {receiveModalOpen && <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />}
      </AnimatePresence>
    </div>
  )
}

