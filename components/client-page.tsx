"use client";

import { Wallet } from "@/components/wallet";

export default function ClientPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background to-muted pb-20">
      <div className="container max-w-md p-4">
        <Wallet />
      </div>
    </main>
  );
} 