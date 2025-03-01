"use client"

import { AIChatbox } from "@/components/ai-chatbox"
// import { NFTGallery } from "@/components/nft-gallery"
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
import { LoginButton } from "./login-button"
import { TransactionHistory } from "./transaction-history"

export function Wallet() {
  const { privacyMode } = useWallet();
  const { selectedAccount, isLoading, error, isAuthenticated } = useOktoAccount();
  const { totalBalanceUsd } = useOktoPortfolio();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg mb-4">
        <h2 className="text-lg font-bold mb-2">Wallet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Please log in to access your wallet
        </p>
        <LoginButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg mb-4">
        <h2 className="text-lg font-bold mb-2">Wallet</h2>
        <p>Loading wallet information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg mb-4">
        <h2 className="text-lg font-bold mb-2">Wallet</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const walletAddress = selectedAccount?.address || "";
  
  // Format the balance properly, handling zero, undefined, or NaN values
  const formattedBalance = typeof totalBalanceUsd === 'number' && !isNaN(totalBalanceUsd) 
    ? `$${totalBalanceUsd.toFixed(2)}` 
    : '$0.00';

  return (
    <>
      <div className="p-4 border rounded-lg mb-4 bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Wallet</h2>
          <OptionsDropdown />
        </div>
        <div className="mb-2 text-sm text-muted-foreground">
          {privacyMode ? "••••••••••••••••" : walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)}
        </div>
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">Total Balance</div>
          <div className="text-3xl font-bold">
            {privacyMode ? "••••••" : formattedBalance}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => setReceiveModalOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Receive
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => setSwapInterfaceOpen(true)}
          >
            <ArrowDownUp className="h-4 w-4" />
            Swap
          </Button>
        </div>
        <Tabs defaultValue="assets">
          <TabsList className="w-full">
            <TabsTrigger value="assets" className="flex-1">
              Assets
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
            {/* <TabsTrigger value="nfts" className="flex-1">
              NFTs
            </TabsTrigger> */}
          </TabsList>
          <TabsContent value="assets" className="min-h-[300px]">
            <TokenList />
          </TabsContent>
          <TabsContent value="activity" className="min-h-[300px]">
            <TransactionHistory />
          </TabsContent>
          <TabsContent value="nfts" className="min-h-[300px]">
            {/* <NFTGallery /> */}
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {receiveModalOpen && (
          <ReceiveModal
            open={receiveModalOpen}
            onOpenChange={setReceiveModalOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swapInterfaceOpen && (
          <SwapInterface open={swapInterfaceOpen} onOpenChange={setSwapInterfaceOpen} />
        )}
      </AnimatePresence>

      <AIChatbox />
    </>
  );
}

