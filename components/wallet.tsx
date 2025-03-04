"use client";

import { BuyModal } from "@/components/buy-modal";
import { DelegationBanner } from "@/components/delegation-banner";
import { OptionsDropdown } from "@/components/options-dropdown";
import { SendModal } from "@/components/send-modal";
import { SwapInterface } from "@/components/swap-interface";
import { TokenList } from "@/components/token-list";
import { Button } from "@/components/ui/button";
import { useOktoAccount } from "@/hooks/use-okto-account";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useOktoTransactions } from "@/hooks/use-okto-transactions";
import { useWallet } from "@/hooks/use-wallet";
import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff, QrCode } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NFTGallery } from "./nft-gallery";
import { TransactionHistory } from "./transaction-history";

export function Wallet() {
  const router = useRouter();
  const { privacyMode, togglePrivacyMode } = useWallet();
  const { isLoading: accountLoading, error: accountError, isAuthenticated } = useOktoAccount();
  const { 
    totalBalanceUsd, 
    isLoading: isLoadingPortfolio, 
    hasInitialized, 
    error: portfolioError,
    refetch 
  } = useOktoPortfolio();
  const { pendingTransactions } = useOktoTransactions();
  const [swapInterfaceOpen, setSwapInterfaceOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  // Improved for debugging
  useEffect(() => {
    console.log("Wallet component state:", { 
      accountLoading,
      accountError,
      isAuthenticated,
      totalBalanceUsd, 
      isLoadingPortfolio,
      hasInitialized,
      portfolioError
    });
  }, [
    accountLoading, 
    accountError, 
    isAuthenticated, 
    totalBalanceUsd, 
    isLoadingPortfolio, 
    hasInitialized,
    portfolioError
  ]);

  // Detect if the load takes too long
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (accountLoading || (isAuthenticated && isLoadingPortfolio && !hasInitialized)) {
      timer = setTimeout(() => {
        console.log("Loading timeout reached - UI might be stuck");
        setLoadingTimeout(true);
      }, 2_000); // 2 seconds timeout
    } else {
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [accountLoading, isAuthenticated, isLoadingPortfolio, hasInitialized]);

  useEffect(() => {
    let authTimer: NodeJS.Timeout;
    
    if (accountLoading && !isAuthenticated) {
      authTimer = setTimeout(() => {
        console.log("Authentication timeout reached - redirecting to login");
        setAuthTimeout(true);
        router.push("/auth/signin");
      }, 1_500); // 1.5 seconds timeout for authentication
    }
    
    return () => {
      if (authTimer) clearTimeout(authTimer);
    };
  }, [accountLoading, isAuthenticated, router]);

  // Improved retry mechanism
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (isAuthenticated && isLoadingPortfolio && !hasInitialized) {
      // If we are authenticated but still loading after 5 seconds, try to refresh
      retryTimer = setTimeout(() => {
        console.log("Portfolio still loading after timeout, forcing refresh");
        refetch(true);
      }, 1_500); // 1.5 seconds timeout for refresh
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isAuthenticated, isLoadingPortfolio, hasInitialized, refetch]);

  const hasPendingTransactions = pendingTransactions.length > 0;

  // Format the balance properly, handling zero, undefined, or NaN values
  const formattedBalance =
    typeof totalBalanceUsd === "number" && !isNaN(totalBalanceUsd)
      ? totalBalanceUsd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  // Add a retry button if there is a timeout
  const handleRetry = () => {
    console.log("Manual retry triggered");
    window.location.reload();
  };

  // Show loading screen while authenticating or loading the portfolio
  if (accountLoading || (isAuthenticated && isLoadingPortfolio && !hasInitialized)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
          <div className="relative w-24 h-24 mb-6">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            
            {/* Middle pulsing ring */}
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-blue-500/60 animate-pulse"></div>
            
            {/* Inner spinning ring (opposite direction) */}
            <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-blue-500/40 animate-spin animate-reverse"></div>
            
            {/* Center wallet icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-bounce">💼</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-white animate-pulse">
            {accountLoading && !isAuthenticated 
              ? "Verifying authentication..." 
              : "Loading Your Wallet"}
          </h2>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-300 font-outfit animate-fade-in-1">
              {accountLoading && !isAuthenticated 
                ? "Connecting with your account..." 
                : "Connecting to the blockchain..."}
            </p>
            <p className="text-gray-400 font-outfit animate-fade-in-2">
              {accountLoading && !isAuthenticated 
                ? "Verifying credentials..." 
                : "Fetching your latest assets..."}
            </p>
            <p className="text-gray-500 font-outfit animate-fade-in-3">
              {accountLoading && !isAuthenticated 
                ? "Preparing your wallet..." 
                : "Retrieving transaction history..."}
            </p>
          </div>
          
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          
          {/* Show retry button if the load takes too long */}
          {loadingTimeout && (
            <div className="mt-6">
              <p className="text-yellow-400 mb-2">
                The load is taking longer than expected.
              </p>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Show login button if authentication takes too long */}
          {authTimeout && (
            <div className="mt-6">
              <p className="text-yellow-400 mb-2">
                Authentication verification failed.
              </p>
              <button 
                onClick={() => router.push("/auth/signin")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show account or portfolio errors
  if (accountError || portfolioError) {
    const errorMessage = accountError || portfolioError;
    return (
      <div className="pt-6 pb-4">
        <h2 className="text-xl font-bold mb-2 text-white">Wallet</h2>
        <p className="text-red-500 font-outfit mb-4">{errorMessage}</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // If not authenticated, don't show anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="pt-3 pb-4 font-outfit">
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

          {/* Delegation banner immediately after the top bar */}
        <DelegationBanner />

        {/* Centered Total Balance Section */}
        <div className="flex flex-col items-center mb-10 mt-14">
          <div className="flex items-center gap-2">
            <div className="text-[16px] text-gray-400 font-outfit">
              TOTAL BALANCE
            </div>
            <button 
              onClick={togglePrivacyMode} 
              className="flex items-center justify-center h-5 w-5"
            >
              {privacyMode ? 
                <EyeOff className="h-4 w-4 text-white/60" /> : 
                <Eye className="h-4 w-4 text-white/60" />
              }
            </button>
          </div>
          <div className="text-[42px] font-medium text-white mt-2">
            {privacyMode ? (
              "••••••"
            ) : isLoadingPortfolio ? (
              <span className="animate-pulse">Loading...</span>
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
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setBuyModalOpen(true)}
            >
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/buy.svg" alt="Buy" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">BUY</span>
            </div>
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setSwapInterfaceOpen(true)}
            >
              <div className="w-[48px] h-[48px] bg-[#4364F9] rounded-full flex items-center justify-center">
                <Image src="/swap.svg" alt="Swap" width={48} height={48} />
              </div>
              <span className="text-[14px] text-gray-400 mt-2">SWAP</span>
            </div>
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setSendModalOpen(true)}
            >
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
        <div className="flex justify-center mb-4">
          <div className="flex bg-[#1A1A24] rounded-full p-1 w-full max-w-[400px]">
            <button
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === "assets"
                  ? "bg-[#4364F9] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("assets")}
            >
              Assets
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "bg-[#4364F9] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("activity")}
            >
              Activity
              {hasPendingTransactions && (
                <span className="inline-flex items-center justify-center w-2 h-2 ml-2 bg-yellow-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === "nfts"
                  ? "bg-[#4364F9] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("nfts")}
            >
              NFTs
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="w-full mx-auto rounded-t-2xl bg-gradient-to-br from-[#252531] to-[#13121E] min-h-[calc(100vh-300px)]">
          {/* Content based on active tab */}
          <div
            className={
              activeTab === "assets" && isLoadingPortfolio
                ? "min-h-[200px] flex items-center justify-center py-4 w-full"
                : "py-4"
            }
          >
            {activeTab === "assets" ? (
              <TokenList />
            ) : activeTab === "activity" ? (
              <TransactionHistory />
            ) : activeTab === "nfts" ? (
              <NFTGallery />
            ) : null}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {swapInterfaceOpen && (
          <SwapInterface
            open={swapInterfaceOpen}
            onOpenChange={setSwapInterfaceOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sendModalOpen && (
          <SendModal
            open={sendModalOpen}
            onOpenChange={setSendModalOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {buyModalOpen && (
          <BuyModal
            open={buyModalOpen}
            onOpenChange={setBuyModalOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
}
