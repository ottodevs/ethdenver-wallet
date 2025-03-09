'use client'

import QrScannerLib from 'qr-scanner'
import { useEffect, useRef, useState } from 'react'

interface QrScannerProps {
    onDecodeAction: (result: string) => void
    onErrorAction: (error: Error | string) => void
    className?: string
    active?: boolean
    forceHttpsOverride?: boolean
}

export function QrScanner({ onDecodeAction, onErrorAction, className, active = true }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isStarted, setIsStarted] = useState(false)
    const [hasCamera, setHasCamera] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const scannerRef = useRef<QrScannerLib | null>(null)
    const mountedRef = useRef(true)
    const startAttemptRef = useRef(false)

    // Apply canvas context override for better performance
    useEffect(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext

        const customGetContext = function (
            this: HTMLCanvasElement,
            contextId: string,
            options?: CanvasRenderingContext2DSettings,
        ): RenderingContext | null {
            if (contextId === '2d') {
                options = options || {}
                options.willReadFrequently = true
            }
            return originalGetContext.call(this, contextId, options)
        }

        // @ts-expect-error - This is a temporary fix to enable willReadFrequently for 2d context
        HTMLCanvasElement.prototype.getContext = customGetContext

        return () => {
            HTMLCanvasElement.prototype.getContext = originalGetContext
        }
    }, [])

    // Track component mount state
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    // Check camera availability once
    useEffect(() => {
        QrScannerLib.hasCamera()
            .then(hasCamera => {
                if (mountedRef.current) {
                    setHasCamera(hasCamera)
                    if (!hasCamera) {
                        setError('No camera found on this device')
                        onErrorAction('No camera found on this device')
                    }
                }
            })
            .catch(err => {
                if (mountedRef.current) {
                    setHasCamera(false)
                    setError('Error checking camera: ' + String(err))
                    onErrorAction(err instanceof Error ? err : String(err))
                }
            })
    }, [onErrorAction])

    // Initialize scanner with debounce protection
    useEffect(() => {
        // Skip if not active, no video element, or no camera
        if (!active || !videoRef.current || !hasCamera || startAttemptRef.current) {
            return
        }

        // Mark that we've attempted to start to prevent duplicate starts
        startAttemptRef.current = true

        // Add a small delay to prevent rapid mount/unmount issues
        const startTimeout = setTimeout(() => {
            if (!mountedRef.current) return

            try {
                // Create scanner with simplified options
                const qrScanner = new QrScannerLib(
                    videoRef.current!,
                    result => {
                        if (mountedRef.current) {
                            onDecodeAction(result.data)
                        }
                    },
                    {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        preferredCamera: 'environment',
                        maxScansPerSecond: 5,
                        returnDetailedScanResult: true,
                    },
                )

                scannerRef.current = qrScanner

                // Silence the HTTPS warning
                const originalWarn = console.warn
                console.warn = function (message, ...args) {
                    if (
                        typeof message === 'string' &&
                        message.includes('camera stream is only accessible if the page is transferred via https')
                    ) {
                        // Ignore this specific warning
                        return
                    }
                    originalWarn.call(console, message, ...args)
                }

                // Start scanner
                qrScanner
                    .start()
                    .then(() => {
                        // Restore console.warn
                        console.warn = originalWarn

                        if (mountedRef.current) {
                            setIsStarted(true)
                            setError(null)
                        }
                    })
                    .catch(err => {
                        // Restore console.warn
                        console.warn = originalWarn

                        if (mountedRef.current) {
                            console.error('QR Scanner failed to start:', err)
                            setError(String(err))
                            // Only report non-abort errors to parent
                            if (!String(err).includes('AbortError')) {
                                onErrorAction(err instanceof Error ? err : String(err))
                            }
                        }
                    })
            } catch (err) {
                if (mountedRef.current) {
                    console.error('Error creating QR scanner:', err)
                    setError(String(err))
                    onErrorAction(err instanceof Error ? err : String(err))
                }
            }
        }, 300) // Small delay to avoid rapid mount/unmount issues

        // Cleanup function
        return () => {
            clearTimeout(startTimeout)
            startAttemptRef.current = false

            if (scannerRef.current) {
                try {
                    scannerRef.current.stop()
                    scannerRef.current.destroy()
                    scannerRef.current = null
                    if (mountedRef.current) {
                        setIsStarted(false)
                    }
                } catch (err) {
                    console.error('Error during scanner cleanup:', err)
                }
            }
        }
    }, [active, hasCamera, onDecodeAction, onErrorAction])

    return (
        <div className={`relative ${className}`}>
            {!hasCamera && (
                <div className='bg-background/80 absolute inset-0 z-10 flex items-center justify-center'>
                    <p className='text-sm text-red-500'>No camera found</p>
                </div>
            )}

            {error && !error.includes('AbortError') && (
                <div className='bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center'>
                    <p className='mb-2 text-center text-sm text-red-500'>Camera error</p>
                    <p className='text-muted-foreground px-4 text-center text-xs'>{error}</p>
                </div>
            )}

            <video ref={videoRef} className='h-full w-full rounded-lg object-cover' />

            {!isStarted && hasCamera && active && !error && (
                <div className='absolute inset-0 z-10 flex items-center justify-center'>
                    <p className='text-muted-foreground text-sm'>Starting camera...</p>
                </div>
            )}
        </div>
    )
}
