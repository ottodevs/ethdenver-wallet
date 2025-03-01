"use client"

import { Wallet } from "@/components/wallet";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { authStatus } = useAuth();
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background to-muted pb-20">
      <div className="container max-w-md p-4 min-h-screen">
        {authStatus && <p className="text-sm text-muted-foreground mb-4">{authStatus}</p>}
        <Wallet />
      </div>
    </main>
  );
} 