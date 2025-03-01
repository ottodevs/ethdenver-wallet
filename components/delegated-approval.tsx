"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useOkto } from "@okto_web3/react-sdk"
import { Check, Loader2, Shield, X } from "lucide-react"
import { useState } from "react"

interface DelegatedApprovalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DelegatedApproval({ open, onOpenChange }: DelegatedApprovalProps) {
  const oktoClient = useOkto()
  const { isAuthenticated, checkAuthStatus } = useAuth()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  
  const handleApprove = async () => {
    if (!oktoClient) return
    
    // Verificar autenticación antes de continuar
    const isAuth = await checkAuthStatus()
    if (!isAuth) {
      setStatus("error")
      setErrorMessage("Authentication required")
      return
    }
    
    setStatus("loading")
    setErrorMessage("")
    
    try {
      // Simulamos una llamada a la API de Okto para activar la delegación
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Almacenamos el indicador de que la delegación está activa
      localStorage.setItem('okto_delegation_enabled', 'true')
      
      // También almacenamos la clave de sesión si está disponible
      const sessionKey = localStorage.getItem('okto_session_key')
      if (!sessionKey) {
        console.warn("No session key found in localStorage")
      }
      
      setStatus("success")
    } catch (error) {
      console.error("Failed to enable delegation:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to enable automatic approvals")
    }
  }

  const handleClose = () => {
    if (status !== "loading") {
      onOpenChange(false)
      // Reseteamos el estado después de que la animación termine
      setTimeout(() => {
        setStatus("idle")
        setErrorMessage("")
      }, 300)
    }
  }
  
  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <div className="p-6">
        {status === "idle" && (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Enable Automatic Approvals</h3>
              <p className="text-sm text-muted-foreground">
                This will allow transactions to be processed automatically without requiring your signature each time.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={handleApprove}>Enable</Button>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}
        
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-center font-medium">Enabling automatic approvals...</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-center font-medium">Automatic Approvals Enabled!</p>
            <p className="text-center text-sm text-muted-foreground">
              You can now send tokens without signing each transaction.
            </p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-center font-medium">Something went wrong</p>
            <p className="text-center text-sm text-red-500">
              {errorMessage || "Failed to enable automatic approvals"}
            </p>
            <Button onClick={handleClose} variant="outline" className="mt-2">Close</Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  )
} 