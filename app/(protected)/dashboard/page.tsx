"use client";

import { Wallet } from "@/components/wallet";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { authStatus, error: authError } = useAuth();
  
  return (
    <main
      className="flex min-h-screen flex-col items-center"
      style={{ background: "#11101C" }}
    >
      <div className="container max-w-md p-4 min-h-screen">
      {authStatus && <p className="text-sm text-muted-foreground mb-4">{authStatus}</p>}
        {authError && <p className="text-sm text-red-500 mb-4">{authError}</p>}
        <Wallet />
      </div>
    </main>
  );
} 
