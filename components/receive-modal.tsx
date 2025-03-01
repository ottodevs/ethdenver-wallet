"use client"

import { Button } from "@/components/ui/button"
import { useOktoAccount } from "@/hooks/use-okto-account"
import { motion } from "framer-motion"
import { Copy } from "lucide-react"
import QrScanner from "qr-scanner"
import { useEffect, useRef, useState } from "react"

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { selectedAccount } = useOktoAccount()
  const [copied, setCopied] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [/*isScanning*/, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const walletAddress = selectedAccount?.address || ""

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  useEffect(() => {
    const startScanner = async () => {
      if (!videoRef.current || scannerRef.current) return

      try {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            setScannedResult(result.data)
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        )

        await scanner.start()
        scannerRef.current = scanner
        setIsScanning(true)
      } catch (error) {
        console.error('Error starting scanner:', error)
      }
    }

    if (open) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
        setIsScanning(false)
      }
    }
  }, [open])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Scan QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Scan a QR code to receive funds
            </p>
          </div>

          <div className="flex justify-center py-4">
            <div className="rounded-lg overflow-hidden relative" style={{ width: 250, height: 250 }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%' }}></video>
            </div>
          </div>

          {scannedResult && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Scanned Result</p>
              <div className="bg-muted p-2 rounded-md text-sm">
                <p className="break-all">{scannedResult}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Your Wallet Address</p>
            <div className="flex items-center space-x-2">
              <div className="bg-muted p-2 rounded-md text-sm flex-1 overflow-hidden">
                <p className="truncate">{walletAddress}</p>
              </div>
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <span className="text-green-600 text-xs">Copied!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

