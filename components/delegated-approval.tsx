"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useOkto } from "@okto_web3/react-sdk"
import { Check, Clock, Loader2, Lock, Shield, Zap } from "lucide-react"
import { useEffect, useState } from "react"

interface DelegatedApprovalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DelegatedApproval({ open, onOpenChange }: DelegatedApprovalProps) {
  const oktoClient = useOkto()
  const { checkAuthStatus } = useAuth()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isDelegationEnabled, setIsDelegationEnabled] = useState(false)
  
  // Verificar si la delegación ya está habilitada al abrir el diálogo
  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      const delegationEnabled = !!localStorage.getItem('okto_delegation_enabled')
      setIsDelegationEnabled(delegationEnabled)
    }
  }, [open])
  
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
      localStorage.removeItem('okto_delegation_banner_dismissed')
      
      // También almacenamos la clave de sesión si está disponible
      const sessionKey = localStorage.getItem('okto_session_key')
      if (!sessionKey) {
        console.warn("No session key found in localStorage")
      }
      
      setStatus("success")
      setIsDelegationEnabled(true)
    } catch (error) {
      console.error("Failed to enable delegation:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to enable automatic approvals")
    }
  }
  
  const handleDisable = async () => {
    if (!oktoClient) return
    
    setStatus("loading")
    
    try {
      // Simulamos una llamada a la API de Okto para desactivar la delegación
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Eliminamos el indicador de delegación
      localStorage.removeItem('okto_delegation_enabled')
      
      setStatus("idle")
      setIsDelegationEnabled(false)
    } catch (error) {
      console.error("Failed to disable delegation:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to disable automatic approvals")
    }
  }

  const handleClose = () => {
    if (status !== "loading") {
      onOpenChange(false)
      // Reseteamos el estado después de que la animación termine
      setTimeout(() => {
        if (status === "success" || status === "error") {
          setStatus("idle")
          setErrorMessage("")
        }
      }, 300)
    }
  }
  
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleClose}
      title="Automatic Approvals"
      description="Streamline your transaction experience"
    >
      <div className="py-4">
        {!isDelegationEnabled ? (
          <>
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Faster Transactions</h4>
                    <p className="text-xs text-muted-foreground">Skip manual approvals for each transaction, saving you time.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Seamless Experience</h4>
                    <p className="text-xs text-muted-foreground">Enjoy a smoother workflow without constant interruptions.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Secure Implementation</h4>
                    <p className="text-xs text-muted-foreground">Your private keys remain secure and are never exposed.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {status === "error" && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4">
                {errorMessage || "An error occurred while enabling automatic approvals."}
              </div>
            )}
            
            <Button
              onClick={handleApprove}
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Enable Automatic Approvals
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Automatic Approvals Enabled</h3>
                <p className="text-sm text-muted-foreground">
                  You can now send tokens and interact with dApps without signing each transaction.
                </p>
              </div>
              
              {status === "error" && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md w-full">
                  {errorMessage || "An error occurred while disabling automatic approvals."}
                </div>
              )}
              
              <div className="flex flex-col w-full space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleDisable}
                  disabled={status === "loading"}
                  className="w-full"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable Automatic Approvals"
                  )}
                </Button>
                
                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsiveDialog>
  )
} 