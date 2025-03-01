"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTokenList } from "@/hooks/use-token-list";
import { X } from "lucide-react";
import { useState } from "react";
import { TokenSelectionSheet } from "./token-selection-sheet";

interface NetworkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openTokenSheet?: boolean; // Optional flag to control token sheet opening
}

export function NetworkSheet({
  open,
  onOpenChange,
  openTokenSheet = false, // Default to false to maintain backward compatibility
}: NetworkSheetProps) {
  const { chains, selectedChain, setSelectedChain } = useTokenList();
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);

  const handleNetworkSelect = (chainId: string) => {
    setSelectedChain(chainId);
    // Only close the sheet and open token selection if openTokenSheet is true
    if (openTokenSheet) {
      onOpenChange(false);
      setTokenSheetOpen(true);
    }
  };

  // Helper function to get network colors and short name
  const getNetworkInfo = (chainName: string) => {
    const networks: Record<string, { color: string; shortName: string }> = {
      ethereum: { color: "bg-purple-500", shortName: "ETH" },
      arbitrum: { color: "bg-blue-500", shortName: "ARB" },
      optimism: { color: "bg-red-500", shortName: "OP" },
      polygon: { color: "bg-purple-700", shortName: "POLY" },
      base: { color: "bg-green-500", shortName: "BASE" },
      avalanche: { color: "bg-red-600", shortName: "AVAX" },
      bnb: { color: "bg-yellow-500", shortName: "BNB" },
    };

    const lowerChainName = chainName.toLowerCase();
    return (
      networks[lowerChainName] || {
        color: "bg-gray-500",
        shortName: chainName.substring(0, 4).toUpperCase(),
      }
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        shouldScaleBackground
        snapPoints={[0.8]}
        // defaultSnapPoint="0.8"
      >
        <DrawerContent className="bg-gradient-to-br from-[#252531] to-[#13121E] border-t border-[#373747] max-h-[80vh]">
          <div className="absolute right-4 top-4 z-50">
            <DrawerClose asChild>
              <button className="rounded-full p-1.5 bg-[#373747] text-white hover:bg-[#444458] focus:outline-none">
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          <DrawerHeader className="cursor-grab active:cursor-grabbing">
            <DrawerTitle className="text-center text-white text-xl">
              Networks
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-6">
            <div className="bg-[#1B1A27]/50 border border-[#373747] rounded-2xl p-6">
              <p className="text-white text-center mb-4">
                Select a network to receive or pay on
              </p>

              <div className="space-y-4">
                {chains.map((chain) => {
                  const { color, shortName } = getNetworkInfo(chain.name);
                  const isSelected = chain.id === selectedChain;

                  return (
                    <div
                      key={chain.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors
                        ${
                          isSelected
                            ? "bg-[#25252F] border-[#373747]"
                            : "bg-[#25252F]/50 border-[#373747]/50 hover:bg-[#25252F]/80"
                        }`}
                      onClick={() => handleNetworkSelect(chain.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 ${color} rounded-full flex items-center justify-center text-xs text-white`}
                        >
                          {shortName}
                        </div>
                        <div>
                          <div
                            className={`${
                              isSelected ? "text-white" : "text-white/70"
                            }`}
                          >
                            {chain.name}
                          </div>
                          <div className="text-[#9493ac] text-xs">
                            {chain.caip2Id.includes("eip155:1")
                              ? "Mainnet"
                              : chain.caip2Id.includes("eip155:42161")
                              ? "Arbitrum"
                              : chain.caip2Id.includes("eip155:137")
                              ? "Polygon"
                              : chain.caip2Id.includes("eip155:8453")
                              ? "Base"
                              : "Testnet"}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          isSelected
                            ? "border-white flex items-center justify-center"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {openTokenSheet && (
        <TokenSelectionSheet
          open={tokenSheetOpen}
          onOpenChange={setTokenSheetOpen}
        />
      )}
    </>
  );
}
