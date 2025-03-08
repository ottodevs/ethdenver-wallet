"use client";

import { PayTab } from "@/components/pay-tab";
import { ReceiveTab } from "@/components/receive-tab";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useState } from "react";

interface ReceivePayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceivePayModal({ open, onOpenChange }: ReceivePayModalProps) {
  const [activeTab, setActiveTab] = useState("receive");

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="RECEIVE"
      description=""
      contentClassName="max-w-md bg-gradient-to-br from-[#252531] to-[#13121E] rounded-t-2xl"
      hideCloseButton={true}
    >
      <div className="w-full px-4 pt-4 pb-16">
        <div className="w-full h-[42px] p-1 bg-[#181723] rounded-[80px] border border-[#373a46] justify-start items-start gap-px inline-flex mb-8">
          <div
            onClick={() => setActiveTab("receive")}
            className={`grow shrink basis-0 h-[34px] px-[41px] py-3 rounded-[80px] flex-col justify-center items-center gap-2.5 inline-flex cursor-pointer ${
              activeTab === "receive"
                ? "bg-gradient-to-br from-[#343445] to-[#2a2a3e] border border-[#373a46]"
                : ""
            }`}
          >
            <div className="justify-start items-center gap-4 inline-flex">
              <div className="text-white text-base font-medium font-['Outfit'] leading-tight">
                Receive
              </div>
            </div>
          </div>
          <div
            onClick={() => setActiveTab("pay")}
            className={`grow shrink basis-0 h-[33px] px-10 py-3 rounded-[80px] flex-col justify-center items-center gap-2.5 inline-flex cursor-pointer ${
              activeTab === "pay"
                ? "bg-gradient-to-br from-[#343445] to-[#2a2a3e] border border-[#373a46]"
                : ""
            }`}
          >
            <div className="justify-start items-center gap-4 inline-flex">
              <div className="text-white text-base font-medium font-['Outfit'] leading-tight">
                Pay
              </div>
            </div>
          </div>
        </div>

        {activeTab === "receive" ? (
          <ReceiveTab />
        ) : (
          <PayTab
            onOpenChangeAction={(open: boolean) => onOpenChange(open)}
            active={activeTab === "pay" && open}
          />
        )}
      </div>
    </ResponsiveDialog>
  );
}
