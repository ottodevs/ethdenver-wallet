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
import Image from "next/image";
interface TokenSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenSelectionSheet({
  open,
  onOpenChange,
}: TokenSelectionSheetProps) {
  const { selectedChain, selectedToken, setSelectedToken, availableTokens } =
    useTokenList();

  const handleTokenSelect = (tokenId: string) => {
    setSelectedToken(tokenId);
    onOpenChange(false);
  };

  return (
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
            Tokens
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-6">
          <div className="bg-[#1B1A27]/50 border border-[#373747] rounded-2xl p-6">
            {!selectedChain ? (
              <p className="text-white text-center mb-4">
                Please select a network first
              </p>
            ) : availableTokens.length === 0 ? (
              <p className="text-white text-center mb-4">
                No tokens available for this network
              </p>
            ) : (
              <>
                <p className="text-white text-center mb-4">
                  Select a token to receive
                </p>

                <div className="space-y-4">
                  {availableTokens.map((token) => {
                    const isSelected = token.id === selectedToken;

                    return (
                      <div
                        key={token.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors
                          ${
                            isSelected
                              ? "bg-[#25252F] border-[#373747]"
                              : "bg-[#25252F]/50 border-[#373747]/50 hover:bg-[#25252F]/80"
                          }`}
                        onClick={() => handleTokenSelect(token.id)}
                      >
                        <div className="flex items-center gap-3">
                          {token.logoURI ? (
                            <Image
                              src={token.logoURI}
                              alt={token.symbol}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-500 rounded-full flex items-center justify-center text-xs text-white">
                              {token.symbol.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <div
                              className={`${
                                isSelected ? "text-white" : "text-white/70"
                              }`}
                            >
                              {token.symbol}
                            </div>
                            <div className="text-[#9493ac] text-xs">
                              {token.name}
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
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
