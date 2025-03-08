"use client"

import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { createContext, useContext, useState } from "react"

type ToastType = {
  id: string
  title?: string
  description: string
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success"
}

type ToastContextType = {
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const addToast = (toast: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    console.log("Adding toast:", { id, ...toast })
    setToasts((prev) => [...prev, { id, ...toast }])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      console.log("Removing toast:", id)
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastProvider>
        {children}
        {toasts.map(({ id, title, description, action, variant }) => (
          <Toast key={id} variant={variant}>
            {title && <ToastTitle>{title}</ToastTitle>}
            <ToastDescription>{description}</ToastDescription>
            {action && <ToastAction altText="Action">{action}</ToastAction>}
            <ToastClose onClick={() => removeToast(id)} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastContextProvider")
  }
  return context
} 