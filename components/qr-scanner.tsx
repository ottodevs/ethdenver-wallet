"use client";

import QrScannerLib from "qr-scanner";
import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onDecodeAction: (result: string) => void;
  onErrorAction: (error: Error | string) => void;
  className?: string;
  active?: boolean;
  forceHttpsOverride?: boolean;
}

export function QrScanner({
  onDecodeAction,
  onErrorAction,
  className,
  active = true,
  forceHttpsOverride = false,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [httpsError, setHttpsError] = useState(false);
  const scannerRef = useRef<QrScannerLib | null>(null);
  const errorAttemptsRef = useRef(0);
  const firstAttemptTimeRef = useRef<number | null>(null);
  const maxAttemptDurationMs = 5000; // Stop trying after 5 seconds of first attempt
  const [gaveUp, setGaveUp] = useState(false);
  const hasInitializedRef = useRef(false); // Track if we've already tried to initialize
  const isCleaningUpRef = useRef(false); // Track if we're currently cleaning up
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Debug helper
  const logWithTimestamp = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    if (data) {
      console.log(`[QRScanner ${timestamp}] ${message}`, data);
    } else {
      console.log(`[QRScanner ${timestamp}] ${message}`);
    }
  };

  // Check if environment supports camera on mount only (once)
  useEffect(() => {
    // First, check if we're on HTTPS or localhost
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isHttps = protocol === "https:";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    logWithTimestamp("Initial environment check:", {
      protocol,
      hostname,
      isHttps,
      isLocalhost,
      forceHttpsOverride,
    });

    // Immediately set HTTPS error if not on HTTPS and not on localhost and not forcing override
    if (!isHttps && !isLocalhost && !forceHttpsOverride) {
      logWithTimestamp("HTTPS required but not available - camera disabled");
      setHttpsError(true);
      onErrorAction(
        "Camera access requires HTTPS. Please use a secure connection."
      );
      return; // Don't even check for camera
    }

    // Only check camera availability if we're on HTTPS or localhost
    logWithTimestamp("Checking camera availability");
    QrScannerLib.hasCamera()
      .then((hasCamera) => {
        logWithTimestamp("Camera availability result:", hasCamera);
        setHasCamera(hasCamera);
        if (!hasCamera) {
          onErrorAction("No camera found on this device");
        }
      })
      .catch((error) => {
        logWithTimestamp("Camera check error:", error);
        setHasCamera(false);
        onErrorAction(error instanceof Error ? error : String(error));
      });
  }, [onErrorAction, forceHttpsOverride]);

  // Helper function to detect HTTPS errors from error messages
  const isHttpsError = (error: unknown): boolean => {
    // Get error as string to check
    const errorString = error?.toString() || "";
    const errorMessage = error instanceof Error ? error.message : errorString;

    // Look for HTTPS-related terms in the error message
    return (
      errorString.toLowerCase().includes("https") ||
      errorMessage.toLowerCase().includes("https") ||
      errorString.toLowerCase().includes("secure context") ||
      errorMessage.toLowerCase().includes("secure context") ||
      errorString.toLowerCase().includes("ssl") ||
      errorMessage.toLowerCase().includes("ssl") ||
      errorString.toLowerCase().includes("camera stream") ||
      errorMessage.toLowerCase().includes("camera stream")
    );
  };

  // Scanner initialization effect with stronger barriers against loops
  useEffect(() => {
    // Skip initialization entirely if:
    // 1. Already gave up
    // 2. HTTPS error (but not if we're forcing HTTPS override)
    // 3. No camera
    // 4. Not active
    // 5. No video element
    // 6. Already initialized in this render cycle
    if (
      gaveUp ||
      (httpsError && !forceHttpsOverride) ||
      !hasCamera ||
      !active ||
      !videoRef.current ||
      hasInitializedRef.current ||
      isCleaningUpRef.current
    ) {
      logWithTimestamp("Skipping scanner initialization due to conditions", {
        gaveUp,
        httpsError,
        forceHttpsOverride,
        hasCamera,
        active,
        hasVideoRef: !!videoRef.current,
        hasInitialized: hasInitializedRef.current,
        isCleaningUp: isCleaningUpRef.current,
      });
      return;
    }

    // Mark that we've attempted initialization in this render cycle
    hasInitializedRef.current = true;

    // Record first attempt time if not set
    if (firstAttemptTimeRef.current === null) {
      firstAttemptTimeRef.current = Date.now();
      logWithTimestamp("Recording first attempt time");
    }

    // Check if we should give up based on time
    const elapsedTime = firstAttemptTimeRef.current
      ? Date.now() - firstAttemptTimeRef.current
      : 0;
    if (elapsedTime > maxAttemptDurationMs) {
      logWithTimestamp(`Giving up after ${elapsedTime}ms of attempts`);
      setGaveUp(true);
      return;
    }

    logWithTimestamp("Initializing QR scanner - attempt starting");

    let aborted = false;
    
    try {
      // Create scanner instance
      const qrScanner = new QrScannerLib(
        videoRef.current,
        (result) => {
          logWithTimestamp("QR code detected:", result.data);
          onDecodeAction(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );

      scannerRef.current = qrScanner;

      // Store the initialization promise to be able to handle cleanup properly
      initializationPromiseRef.current = qrScanner
        .start()
        .then(() => {
          if (aborted) {
            logWithTimestamp("QR Scanner started but component was unmounted");
            qrScanner.stop();
            qrScanner.destroy();
            return;
          }
          
          logWithTimestamp("QR Scanner started successfully");
          setIsStarted(true);
          errorAttemptsRef.current = 0; // Reset error counter on success
        })
        .catch((err) => {
          if (aborted) {
            logWithTimestamp("QR Scanner error after component unmounted - ignoring");
            return;
          }
          
          logWithTimestamp("QR Scanner failed to start:", err);

          // Increment error attempt counter
          errorAttemptsRef.current += 1;

          // Check if this is an HTTPS-related error
          if (isHttpsError(err) && !forceHttpsOverride) {
            logWithTimestamp("HTTPS error detected from QR scanner library");
            setHttpsError(true);
            onErrorAction("Camera access requires HTTPS");
            return;
          }

          // Check if we've had too many errors
          if (errorAttemptsRef.current >= 3) {
            logWithTimestamp("Too many consecutive errors - giving up");
            setGaveUp(true);
            onErrorAction(
              "Camera initialization failed after multiple attempts"
            );
            return;
          }

          // Report the error
          onErrorAction(err instanceof Error ? err : String(err));
        });
    } catch (err) {
      logWithTimestamp("Error creating QR scanner instance:", err);

      // Check if this is an HTTPS-related error
      if (isHttpsError(err)) {
        setHttpsError(true);
        onErrorAction("Camera access requires HTTPS");
      } else {
        setGaveUp(true);
        onErrorAction(err instanceof Error ? err : String(err));
      }
    }

    // Cleanup function
    return () => {
      aborted = true;
      
      if (scannerRef.current && !isCleaningUpRef.current) {
        isCleaningUpRef.current = true;
        logWithTimestamp("Cleaning up QR Scanner");

        try {
          // Wait for any pending initialization to complete before destroying
          if (initializationPromiseRef.current) {
            initializationPromiseRef.current
              .catch(() => {}) // Ignore any pending errors
              .finally(() => {
                if (scannerRef.current) {
                  try {
                    scannerRef.current.stop();
                    scannerRef.current.destroy();
                    scannerRef.current = null;
                  } catch (cleanupErr) {
                    logWithTimestamp("Error during scanner cleanup:", cleanupErr);
                  }
                }
              });
          } else {
            // No pending initialization, clean up immediately
            scannerRef.current.stop();
            scannerRef.current.destroy();
            scannerRef.current = null;
          }
          
          setIsStarted(false);
          logWithTimestamp("QR Scanner cleanup initiated");
        } catch (err) {
          logWithTimestamp("Error during scanner cleanup:", err);
        }

        // Reset initialization flags for next render cycle
        hasInitializedRef.current = false;
        isCleaningUpRef.current = false;
      }
    };
  }, [active, httpsError, hasCamera, gaveUp, onDecodeAction, onErrorAction, forceHttpsOverride]);

  return (
    <div className={`relative ${className}`}>
      {!hasCamera && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-red-500">No camera found</p>
        </div>
      )}

      {httpsError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-red-500 text-center mb-2">
            Camera access requires HTTPS
          </p>
          <p className="text-xs text-muted-foreground text-center px-4">
            For security reasons, camera access is only available on secure
            connections. Please access this app via HTTPS.
          </p>
        </div>
      )}

      {gaveUp && !httpsError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-red-500 text-center mb-2">
            Camera initialization failed
          </p>
          <p className="text-xs text-muted-foreground text-center px-4">
            Unable to access camera after multiple attempts. Please try again
            later.
          </p>
        </div>
      )}

      <video ref={videoRef} className="w-full h-full rounded-lg" />

      {!isStarted && hasCamera && active && !httpsError && !gaveUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-muted-foreground">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
