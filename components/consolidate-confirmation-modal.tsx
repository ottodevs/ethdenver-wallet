"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Loader2 } from "lucide-react"

interface ConsolidateConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokensCount: number
  totalValue: number
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function ConsolidateConfirmationModal({
  open,
  onOpenChange,
  tokensCount,
  totalValue,
  onConfirm,
  isLoading
}: ConsolidateConfirmationModalProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Consolidate Low-Value Tokens</h2>
        
        <p className="text-sm text-muted-foreground">
          You are about to consolidate {tokensCount} tokens with a total value of ${totalValue.toFixed(2)} to ETH.
        </p>
        
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Your low-value tokens will be swapped to ETH on their respective chains</li>
            <li>Each swap will be processed as a separate transaction</li>
            <li>This process may take a few minutes to complete</li>
          </ul>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Consolidation"
            )}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
} 