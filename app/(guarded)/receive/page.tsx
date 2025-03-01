"use client";

import { PayTab } from "@/components/pay-tab";
import { ReceiveTab } from "@/components/receive-tab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReceivePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("receive");

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{
        background: "linear-gradient(to bottom right, #252531, #13121E)",
      }}
    >
      {/* Navigation Header */}
      <div className="flex justify-between items-center p-4 pt-6 font-outfit">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium text-white text-center">RECEIVE</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4">
        {/* Tab Selector */}
        <div className="w-full h-[44px] p-1 bg-[#181723] rounded-[80px] border border-[#373a46] justify-start items-start gap-px inline-flex mb-8">
          <div
            onClick={() => setActiveTab("receive")}
            className={`grow shrink basis-0 h-[34px] py-3 rounded-[80px] flex-col justify-center items-center gap-2.5 inline-flex cursor-pointer ${
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
            className={`grow shrink basis-0 h-[33px] py-3 rounded-[80px] flex-col justify-center items-center gap-2.5 inline-flex cursor-pointer ${
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

        {/* Content based on active tab */}
        {activeTab === "receive" ? (
          <ReceiveTab />
        ) : (
          <PayTab onOpenChangeAction={() => {}} active={activeTab === "pay"} />
        )}
      </div>
    </main>
  );
}
