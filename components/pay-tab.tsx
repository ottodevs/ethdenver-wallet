"use client"

import { QrScanner } from "@/components/qr-scanner"
import { useRouter } from "next/navigation"
import { isAddress } from "viem"

interface PayTabProps {
  onOpenChange: (open: boolean) => void
  active: boolean
}

export function PayTab({ onOpenChange, active }: PayTabProps) {
  const router = useRouter()

  const handleQrCodeScan = (result: string) => {
    console.log("Scanned QR code:", result)
    // Check if the result is a valid Ethereum address
    if (isAddress(result)) {
      // Navigate to send page or open send modal with pre-filled recipient
      router.push(`/send?recipient=${result}`)
      onOpenChange(false)
    } else {
      // Handle invalid address or other QR code format
      console.error("Invalid address scanned")
      // You could show an error message here
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center h-[400px]">
        <QrScanner
          onDecode={handleQrCodeScan}
          onError={(error) => console.error("QR scan error:", error)}
          active={active}
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Scan a QR code to send funds to another wallet
      </p>
    </div>
  )
} 