"use client"

import { AIChatbox } from "@/components/ai-chatbox"
import { NFTGallery } from "@/components/nft-gallery"
import { OptionsDropdown } from "@/components/options-dropdown"
import { ReceiveModal } from "@/components/receive-modal"
import { SwapInterface } from "@/components/swap-interface"
import { TokenList } from "@/components/token-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOktoAccount } from "@/hooks/use-okto-account"
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio"
import { useWallet } from "@/hooks/use-wallet"
import { AnimatePresence } from "framer-motion"
import { ArrowDownUp, QrCode } from "lucide-react"
import { useState } from "react"
import { TransactionHistory } from "./transaction-history"

export function Wallet() {
  const { privacyMode } = useWallet();
  const { selectedAccount } = useOktoAccount();
  const { totalBalanceUsd, isLoading } = useOktoPortfolio();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false);

  const walletAddress = selectedAccount?.address || "";

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Wallet</h2>
            <p className="text-sm text-muted-foreground">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect wallet"}
            </p>
          </div>
          <OptionsDropdown />
        </div>

        <div className="flex flex-col space-y-1">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <h1 className="text-3xl font-bold">
            {isLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            ) : privacyMode ? (
              "••••••"
            ) : (
              `$${totalBalanceUsd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            )}
          </h1>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => setReceiveModalOpen(true)} className="flex-1" variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            Receive
          </Button>
          <Button onClick={() => setSwapInterfaceOpen(true)} className="flex-1" variant="outline">
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Swap
          </Button>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
          </TabsList>
          <TabsContent value="assets" className="space-y-4">
            <TokenList />
          </TabsContent>
          <TabsContent value="activity">
            <TransactionHistory />
          </TabsContent>
          <TabsContent value="nfts">
            <NFTGallery />
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {receiveModalOpen && <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />}
      </AnimatePresence>

      <AnimatePresence>
        {swapInterfaceOpen && <SwapInterface open={swapInterfaceOpen} onOpenChange={setSwapInterfaceOpen} />}
      </AnimatePresence>

      <AIChatbox />
    </div>
  )
}

