"use client"

import QrScannerLib from "qr-scanner"
import { useEffect, useRef, useState } from "react"

interface QrScannerProps {
  onDecode: (result: string) => void
  onError: (error: Error | string) => void
  className?: string
  active?: boolean
}

export function QrScanner({ onDecode, onError, className, active = true }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const scannerRef = useRef<QrScannerLib | null>(null)

  // Check camera availability once
  useEffect(() => {
    QrScannerLib.hasCamera()
      .then(setHasCamera)
      .catch(error => {
        console.error("Camera check error:", error)
        setHasCamera(false)
        onError(error)
      })
  }, [onError])

  // Handle scanner initialization and cleanup
  useEffect(() => {
    // Only initialize if active and video element exists
    if (!videoRef.current || !active) {
      if (scannerRef.current) {
        console.log("Stopping scanner because not active")
        scannerRef.current.stop()
        setIsStarted(false)
      }
      return
    }

    console.log("Initializing QR scanner")
    
    // Create scanner instance if it doesn't exist
    if (!scannerRef.current) {
      try {
        const qrScanner = new QrScannerLib(
          videoRef.current,
          result => {
            console.log("QR code detected:", result.data)
            onDecode(result.data)
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
          }
        )
        
        scannerRef.current = qrScanner
        
        // Start scanning
        qrScanner.start()
          .then(() => {
            console.log("QR Scanner started successfully")
            setIsStarted(true)
          })
          .catch(err => {
            console.error("QR Scanner failed to start:", err)
            onError(err)
            setIsStarted(false)
          })
      } catch (err) {
        console.error("Error creating QR scanner:", err)
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    } else if (!isStarted) {
      // If scanner exists but not started, start it
      scannerRef.current.start()
        .then(() => {
          console.log("QR Scanner restarted")
          setIsStarted(true)
        })
        .catch(err => {
          console.error("QR Scanner failed to restart:", err)
          onError(err)
        })
    }

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        console.log("Cleaning up QR Scanner")
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
        setIsStarted(false)
      }
    }
  }, [active, onDecode, onError, isStarted])

  return (
    <div className={`relative ${className}`}>
      {!hasCamera && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-red-500">No camera found</p>
        </div>
      )}
      <video ref={videoRef} className="w-full h-full rounded-lg" />
      {!isStarted && hasCamera && active && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-muted-foreground">Starting camera...</p>
        </div>
      )}
    </div>
  )
}