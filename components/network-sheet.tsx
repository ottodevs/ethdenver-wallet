"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

interface NetworkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NetworkSheet({ open, onOpenChange }: NetworkSheetProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground
      snapPoints={[0.8]}
      defaultSnapPoint="0.8"
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
              <div className="flex items-center justify-between p-4 bg-[#25252F] rounded-lg border border-[#373747]">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    OP
                  </div>
                  <div>
                    <div className="text-white">Optimism</div>
                    <div className="text-[#9493ac] text-xs">
                      Layer 2 • Fast & Low Fees
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#25252F]/50 rounded-lg border border-[#373747]/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                    ARB
                  </div>
                  <div>
                    <div className="text-white/70">Arbitrum</div>
                    <div className="text-[#9493ac] text-xs">
                      Layer 2 • Fast & Low Fees
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white/30"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#25252F]/50 rounded-lg border border-[#373747]/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                    ETH
                  </div>
                  <div>
                    <div className="text-white/70">Ethereum</div>
                    <div className="text-[#9493ac] text-xs">
                      Mainnet • High Security
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white/30"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#25252F]/50 rounded-lg border border-[#373747]/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
                    BASE
                  </div>
                  <div>
                    <div className="text-white/70">Base</div>
                    <div className="text-[#9493ac] text-xs">
                      Layer 2 • Fast & Low Fees
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white/30"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#25252F]/50 rounded-lg border border-[#373747]/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-700 rounded-full flex items-center justify-center text-xs text-white">
                    POLY
                  </div>
                  <div>
                    <div className="text-white/70">Polygon</div>
                    <div className="text-[#9493ac] text-xs">
                      Layer 2 • Fast & Low Fees
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white/30"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#25252F]/50 rounded-lg border border-[#373747]/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white">
                    BNB
                  </div>
                  <div>
                    <div className="text-white/70">BNB Chain</div>
                    <div className="text-[#9493ac] text-xs">
                      Mainnet • EVM Compatible
                    </div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border-2 border-white/30"></div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
