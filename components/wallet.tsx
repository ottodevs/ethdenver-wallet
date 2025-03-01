"use client";

import { DelegationBanner } from "@/components/delegation-banner";
import { OptionsDropdown } from "@/components/options-dropdown";
import { SwapInterface } from "@/components/swap-interface";
import { TokenList } from "@/components/token-list";
import { Button } from "@/components/ui/button";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useOktoTransactions } from "@/hooks/use-okto-transactions";
import { useWallet } from "@/hooks/use-wallet";
import { AnimatePresence } from "framer-motion";
import { QrCode } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginButton } from "./login-button";
import { TransactionHistory } from "./transaction-history";

export function Wallet() {
  const router = useRouter();
  const { privacyMode } = useWallet();
  const { isLoading, error, isAuthenticated, selectedAccount } =
    useOktoAccount();
  const { totalBalanceUsd, isLoading: isLoadingPortfolio } = useOktoPortfolio();
  const { pendingTransactions } = useOktoTransactions();
  const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");

  const hasPendingTransactions = pendingTransactions.length > 0;

  if (!isAuthenticated) {
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-sm text-gray-400 mb-4 font-outfit">
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
        <p className="text-gray-400 font-outfit">
          Loading wallet information...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-red-500 font-outfit">{error}</p>
      </div>
    );
  }

  // Format the balance properly, handling zero, undefined, or NaN values
  const formattedBalance =
    typeof totalBalanceUsd === "number" && !isNaN(totalBalanceUsd)
      ? totalBalanceUsd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  return (
    <>
      <div className="pt-0 pb-4 font-outfit">
        <div className="flex justify-between items-center mb-4">
          <OptionsDropdown />
          <div className="w-8"></div> {/* Empty space to maintain layout */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={() => router.push("/receive")}
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </div>

        {/* Banner de delegación justo después de la barra superior */}
        <DelegationBanner />

        {/* Centered Total Balance Section */}
        <div className="flex flex-col items-center mb-10 mt-16">
          <div className="flex items-center gap-2">
            <div className="text-[16px] text-gray-400 font-outfit">
              TOTAL BALANCE
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5C8.24261 5 5.43602 7.4404 3.76737 9.43934C2.51055 10.9394 2.51055 13.0606 3.76737 14.5607C5.43602 16.5596 8.24261 19 12 19C15.7574 19 18.564 16.5596 20.2326 14.5607C21.4894 13.0606 21.4894 10.9394 20.2326 9.43934C18.564 7.4404 15.7574 5 12 5Z"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-[42px] font-medium text-white mt-2">
            {privacyMode ? (
              "••••••"
            ) : (
              <>
                <span className="mr-2">$</span>
                {formattedBalance}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex justify-around w-full max-w-[400px]">
            <div className="flex flex-col items-center">
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/buy.svg" alt="Buy" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">BUY</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/swap.svg" alt="Swap" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">SWAP</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/send.svg" alt="Send" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">SEND</span>
            </div>
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => router.push("/ask")}
            >
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/ask.svg" alt="Ask" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">ASK</span>
            </div>
          </div>
        </div>

        {/* Updated Tab Navigation */}
        <div className="mx-auto max-w-md">
          <div className="w-full h-[44px] p-1 bg-[#11101C] rounded-[24px] border border-[#373747] flex mb-6">
            <div
              onClick={() => setActiveTab("assets")}
              className={`flex-1 h-full rounded-[20px] flex justify-center items-center cursor-pointer ${
                activeTab === "assets"
                  ? "bg-[#343445] border border-[#373747] shadow-sm"
                  : ""
              }`}
            >
              <div className="text-white text-base font-medium">Assets</div>
            </div>
            <div
              onClick={() => setActiveTab("activity")}
              className={`flex-1 h-full rounded-[20px] flex justify-center items-center cursor-pointer ${
                activeTab === "activity"
                  ? "bg-[#343445] border border-[#373747] shadow-sm"
                  : ""
              }`}
            >
              <div className="text-white text-base font-medium relative">
                Activity
                {hasPendingTransactions && (
                  <span className="absolute -top-1 -right-3 h-2 w-2 bg-primary rounded-full inline-block" />
                )}
              </div>
            </div>
            <div
              onClick={() => setActiveTab("nfts")}
              className={`flex-1 h-full rounded-[20px] flex justify-center items-center cursor-pointer ${
                activeTab === "nfts"
                  ? "bg-[#343445] border border-[#373747] shadow-sm"
                  : ""
              }`}
            >
              <div className="text-white text-base font-medium">NFTs</div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div
          className={
            activeTab === "assets" && isLoadingPortfolio
              ? "min-h-[200px] flex items-center justify-center"
              : ""
          }
        >
          {activeTab === "assets" && isAuthenticated && selectedAccount ? (
            <TokenList />
          ) : activeTab === "activity" ? (
            <TransactionHistory />
          ) : activeTab === "nfts" ? (
            <div className="text-center text-gray-400 py-8">
              NFTs coming soon
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No account selected
            </div>
          )}
        </div>
      </div>

      <SwapInterface
        open={swapInterfaceOpen}
        onOpenChange={setSwapInterfaceOpen}
      />

      <AnimatePresence>
        {/* AI Chatbox can be added here if needed */}
      </AnimatePresence>
    </>
  );
}
