"use client";

import { NetworkSheet } from "@/components/network-sheet";
import { QrScanner } from "@/components/qr-scanner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PayTabProps {
  onOpenChangeAction: (open: boolean) => void;
  active: boolean;
}

export function PayTab({ onOpenChangeAction, active }: PayTabProps) {
  const router = useRouter();
  const [networkSheetOpen, setNetworkSheetOpen] = useState(false);

  const handleQrCodeScan = (result: string) => {
    console.log("Scanned QR code:", result);
    // Check if the result is a valid Ethereum address
    if (result && result.startsWith("0x") && result.length === 42) {
      // Navigate to send page or open send modal with pre-filled recipient
      router.push(`/send?recipient=${result}`);
      onOpenChangeAction(false);
    } else {
      // Handle invalid address or other QR code format
      console.error("Invalid address scanned");
      // You could show an error message here
    }
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Network Selector */}
      <div
        className="flex justify-between items-center pb-4 border-b border-[#373747] cursor-pointer"
        onClick={() => setNetworkSheetOpen(true)}
      >
        <span className="text-[#9493ac]">Network:</span>
        <div className="flex items-center gap-2 text-white">
          <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs">
            OP
          </div>
          <span>Optimism</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-1"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Network Sheet */}
      <NetworkSheet
        open={networkSheetOpen}
        onOpenChange={setNetworkSheetOpen}
      />

      <div className="flex flex-col items-center rounded-2xl border border-[#373747] p-6 bg-[#1B1A27]/50">
        <div className="flex flex-col items-center justify-center h-[400px]">
          <QrScanner
            onDecodeAction={handleQrCodeScan}
            onErrorAction={(error) => console.error("QR scan error:", error)}
            active={active}
          />
        </div>
        <p className="text-center text-sm text-[#9493ac] mt-4">
          Scan a QR code to send funds to another wallet
        </p>
      </div>
    </div>
  );
}
