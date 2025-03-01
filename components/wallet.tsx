"use client";

import { AIChatbox } from "@/components/ai-chatbox";
import { OptionsDropdown } from "@/components/options-dropdown";
import { ReceiveModal } from "@/components/receive-modal";
import { SwapInterface } from "@/components/swap-interface";
import { TokenList } from "@/components/token-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useWallet } from "@/hooks/use-wallet";
import { AnimatePresence } from "framer-motion";
import { ArrowDownUp, QrCode } from "lucide-react";
import { useState } from "react";
import { LoginButton } from "./login-button";
import { TransactionHistory } from "./transaction-history";

export function Wallet() {
  const { privacyMode } = useWallet();
  const { selectedAccount, isLoading, error, isAuthenticated } =
    useOktoAccount();
  const { totalBalanceUsd } = useOktoPortfolio();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-sm text-gray-400 mb-4">
          Please log in to access your wallet
        </p>
        <LoginButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-gray-400">Loading wallet information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const walletAddress = selectedAccount?.address || "";

  // Format the balance properly, handling zero, undefined, or NaN values
  const formattedBalance =
    typeof totalBalanceUsd === "number" && !isNaN(totalBalanceUsd)
      ? `$${totalBalanceUsd.toFixed(2)}`
      : "$0.00";

  return (
    <>
      <div className="pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Wallet</h2>
          <OptionsDropdown />
        </div>
        <div className="mb-2 text-sm text-gray-400">
          {privacyMode
            ? "••••••••••••••••"
            : walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)}
        </div>
        <div className="mb-6">
          <div className="text-sm text-gray-400">Total Balance</div>
          <div className="text-3xl font-bold text-white">
            {privacyMode ? "••••••" : formattedBalance}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 bg-black/30 border-gray-700 text-white hover:bg-black/50 hover:text-white"
            onClick={() => setReceiveModalOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Receive
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 bg-black/30 border-gray-700 text-white hover:bg-black/50 hover:text-white"
            onClick={() => setSwapInterfaceOpen(true)}
          >
            <ArrowDownUp className="h-4 w-4" />
            Swap
          </Button>
        </div>
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="w-full mb-4 bg-black/30">
            <TabsTrigger
              value="assets"
              className="flex-1 text-white data-[state=active]:bg-black/50"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex-1 text-white data-[state=active]:bg-black/50"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="nfts"
              className="flex-1 text-white data-[state=active]:bg-black/50"
            >
              NFTs
            </TabsTrigger>
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
          <SwapInterface
            open={swapInterfaceOpen}
            onOpenChange={setSwapInterfaceOpen}
          />
        )}
      </AnimatePresence>

      <AIChatbox />
    </>
  );
}
