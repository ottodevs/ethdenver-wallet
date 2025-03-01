"use client"

import { Button } from "@/components/ui/button"
import { Shield, X } from "lucide-react"
import { useEffect, useState } from "react"
import { DelegatedApproval } from "./delegated-approval"

export function DelegationBanner() {
  const [visible, setVisible] = useState(false)
  const [delegatedApprovalOpen, setDelegatedApprovalOpen] = useState(false)
  
  // Verificamos si la delegación ya está habilitada al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDelegationEnabled = localStorage.getItem('okto_delegation_enabled')
      // Solo mostramos el banner si la delegación NO está habilitada
      setVisible(!isDelegationEnabled)
    }
  }, [])
  
  if (!visible) return null
  
  return (
    <>
      <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl shadow-sm p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Enable automatic approvals</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enhance your experience by allowing automatic transactions without signing each time
          </p>
          
          <Button 
            size="sm"
            className="w-full"
            onClick={() => {
              setDelegatedApprovalOpen(true)
              setVisible(false)
            }}
          >
            Enable Now
          </Button>
        </div>
      </div>
      
      <DelegatedApproval 
        open={delegatedApprovalOpen} 
        onOpenChange={setDelegatedApprovalOpen} 
      />
    </>
  )
} 