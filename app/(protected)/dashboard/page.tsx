"use client";

import { Wallet } from "@/components/wallet";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { error: authError } = useAuth();

  return (
    <main
      className="flex min-h-screen flex-col items-center"
      style={{ background: "#11101C" }}
    >
      <div className="container max-w-md px-4 min-h-screen">
        {authError && <p className="text-sm text-red-500 mb-4">{authError}</p>}
        <Wallet />
      </div>
    </main>
  );
}
