"use client"

import { PayTab } from "@/components/pay-tab"
import { ReceiveTab } from "@/components/receive-tab"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Scan } from "lucide-react"
import { useState } from "react"

interface ReceivePayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceivePayModal({ open, onOpenChange }: ReceivePayModalProps) {
  const [activeTab, setActiveTab] = useState("receive")

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Receive & Pay"
      description="Receive funds or scan to pay"
      contentClassName="max-w-md"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="receive" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Receive
          </TabsTrigger>
          <TabsTrigger value="pay" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Pay
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="receive" className="m-0">
            <ReceiveTab />
          </TabsContent>
          
          <TabsContent value="pay" className="m-0">
            <PayTab onOpenChange={onOpenChange} active={activeTab === "pay" && open} />
          </TabsContent>
        </div>
      </Tabs>
    </ResponsiveDialog>
  )
} 