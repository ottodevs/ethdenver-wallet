"use client";

import { TokenDetail } from "@/components/token-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOktoPortfolio } from "@/hooks/use-okto-portfolio";
import { useWallet } from "@/hooks/use-wallet";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useState } from "react";

export function TokenList({ animated = true }: { animated?: boolean }) {
  const { privacyMode, togglePrivacyMode } = useWallet();
  const { tokens, isLoading, error } = useOktoPortfolio();
  const [showTokenDetail, setShowTokenDetail] = useState<string | null>(null);

  const smallValueTokens = tokens.filter((token) => token.valueUsd < 10);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-muted-foreground">Loading tokens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <Coins className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No tokens found in your wallet
        </p>
      </div>
    );
  }

  const ListComponent = animated ? motion.div : "div";
  const TokenComponent = animated ? motion.div : "div";

  return (
    <ListComponent
      className="px-4"
      variants={animated ? container : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "show" : undefined}
    >
      {tokens.map((token) => (
        <TokenComponent
          key={token.id}
          variants={animated ? item : undefined}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 pb-4 mb-4 border-b border-[#272A3B]"
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
            <div className="font-medium">
              {privacyMode ? "••••••" : `$${token.valueUsd.toFixed(2)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {privacyMode
                ? "••••••"
                : `$${(token.valueUsd / token.balance).toFixed(2)}`}
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
                    Total:{" "}
                    {privacyMode
                      ? "••••••"
                      : `$${smallValueTokens
                          .reduce((sum, t) => sum + t.valueUsd, 0)
                          .toFixed(2)}`}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Consolidate to ETH
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
  );
}
