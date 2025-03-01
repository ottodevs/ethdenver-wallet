"use client";

import { QrScanner } from "@/components/qr-scanner";
import { useRouter } from "next/navigation";

interface PayTabProps {
  onOpenChangeAction: (open: boolean) => void;
  active: boolean;
}

export function PayTab({ onOpenChangeAction, active }: PayTabProps) {
  const router = useRouter();

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
      <div className="flex flex-col items-center rounded-2xl border border-[#373747] p-6 bg-[#1B1A27]/50">
        <div className="flex flex-col items-center justify-center h-[400px]">
          <QrScanner
            onDecodeAction={handleQrCodeScan}
            onErrorAction={(error) => console.error("QR scan error:", error)}
            active={active}
            forceHttpsOverride={true}
          />
        </div>
        <p className="text-center text-sm text-[#9493ac] mt-4">
          Scan a QR code to send funds to another wallet
        </p>
      </div>
    </div>
  );
}
