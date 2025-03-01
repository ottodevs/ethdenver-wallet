"use client";

import { ConsolidateConfirmationModal } from "@/components/consolidate-confirmation-modal";
import { TokenDetail } from "@/components/token-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton as TokenSkeleton } from "@/components/ui/skeleton";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useWallet } from "@/hooks/use-wallet";
import { useTokenConsolidationService } from "@/services/token-consolidation-service";
import { motion } from "framer-motion";
import { Coins, Eye, EyeOff, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TokenList({ animated = true }: { animated?: boolean }) {
  const { privacyMode, togglePrivacyMode } = useWallet()
  const { tokens, isLoading, hasInitialized, error, refetch } = useOktoPortfolio()
  const [showTokenDetail, setShowTokenDetail] = useState<string | null>(null)
  const { consolidateToEth } = useTokenConsolidationService()
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [showConsolidateModal, setShowConsolidateModal] = useState(false)
  const [showRefreshButton, setShowRefreshButton] = useState(false)

  const smallValueTokens = tokens.filter((token) => token.valueUsd < 10 && !token.isNative)
  const totalSmallTokensValue = smallValueTokens.reduce((sum, t) => sum + t.valueUsd, 0)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const handleOpenConsolidateModal = () => {
    setShowConsolidateModal(true)
  }

  const handleConsolidate = async () => {
    setIsConsolidating(true)
    try {
      const results = await consolidateToEth()
      
      if (results.length === 0) {
        toast.info("No tokens to consolidate", {
          description: "You don't have any tokens under $10 to consolidate"
        })
      } else {
        toast.success(`Consolidating ${results.length} tokens to ETH`, {
          description: "Your low-value tokens are being converted to ETH"
        })
        
        // Actualizar la UI después de un breve retraso para dar tiempo a que las transacciones se procesen
        setTimeout(async () => {
          await refetch()
        }, 3000)
      }
    } catch (error) {
      console.error("Consolidation failed:", error)
      toast.error("Failed to consolidate tokens", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsConsolidating(false)
      setShowConsolidateModal(false)
    }
  }

  // Show refresh button if there's an error or no tokens after initialization
  useEffect(() => {
    if ((error || (hasInitialized && tokens.length === 0)) && !isLoading) {
      setShowRefreshButton(true)
    } else {
      setShowRefreshButton(false)
    }
  }, [error, hasInitialized, tokens.length, isLoading])

  if (isLoading && !hasInitialized) {
    return (
      <div className="space-y-1">
        {Array(3).fill(0).map((_, i) => (
          <TokenSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        {showRefreshButton && (
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (tokens.length === 0 && hasInitialized) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <Coins className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No tokens found in your wallet
        </p>
        {showRefreshButton && (
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-3"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  const ListComponent = animated ? motion.div : "div";
  const TokenComponent = animated ? motion.div : "div";

  return (
    <>
      <ListComponent
        className="px-4"
        variants={animated ? container : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "show" : undefined}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Your Assets</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePrivacyMode} className="h-8 w-8">
              {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {tokens.map((token) => (
          <TokenComponent
            key={token.id}
            variants={animated ? item : undefined}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 pb-4 mb-4 border-b border-[#272A3B]"
            onClick={() => setShowTokenDetail(token.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                {token.symbol.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{token.name}</div>
                <div className="text-xs text-muted-foreground">
                  {privacyMode ? "••••••" : `${token.balance} ${token.symbol}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{privacyMode ? "••••••" : `$${token.valueUsd.toFixed(2)}`}</div>
              <div className="text-xs text-muted-foreground">
                {privacyMode ? "••••••" : `$${(token.valueUsd / token.balance).toFixed(2)}`}
              </div>
            </div>
          </TokenComponent>
        ))}

        {smallValueTokens.length > 0 && (
          <Card className="overflow-hidden cursor-pointer bg-muted/30 border-dashed mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      +{smallValueTokens.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      {smallValueTokens.length} tokens under $10
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Total: {privacyMode ? "••••••" : `$${totalSmallTokensValue.toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleOpenConsolidateModal}
                  disabled={isConsolidating}
                >
                  {isConsolidating ? "Consolidating..." : "Consolidate to ETH"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showTokenDetail && (
          <TokenDetail
            tokenId={showTokenDetail}
            onClose={() => setShowTokenDetail(null)}
          />
        )}
      </ListComponent>

      <ConsolidateConfirmationModal
        open={showConsolidateModal}
        onOpenChange={setShowConsolidateModal}
        tokensCount={smallValueTokens.length}
        totalValue={totalSmallTokensValue}
        onConfirm={handleConsolidate}
        isLoading={isConsolidating}
      />
    </>
  );
}
