"use client";

import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DelegatedApproval } from "./delegated-approval";

export function DelegationBanner() {
  const [visible, setVisible] = useState(false);
  const [delegatedApprovalOpen, setDelegatedApprovalOpen] = useState(false);

  // Check if delegation is already enabled at initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDelegationEnabled = localStorage.getItem(
        "okto_delegation_enabled"
      );
      // Only show the banner if delegation is NOT enabled
      setVisible(!isDelegationEnabled);
    }
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-50 pointer-events-none animate-in fade-in slide-in-from-top-5 duration-300 px-4 max-w-md mx-auto">
        <div className="bg-[#1C1C2A] border border-[#2E2E3D] rounded-xl shadow-md p-4 pointer-events-auto">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-[#4364F9]" />
            <p className="text-base font-medium text-white flex-grow">
              Enable automatic approvals
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-[#373747]/50"
              onClick={() => setVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-[#9493ac] mb-4">
            Enhance your experience by allowing automatic transactions without
            signing each time
          </p>

          <Button
            className="w-full bg-[#4364F9] hover:bg-[#3a58da] text-white py-5 rounded-xl text-base"
            onClick={() => {
              setDelegatedApprovalOpen(true);
              setVisible(false);
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
  );
}
