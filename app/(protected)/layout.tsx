import AppProvider from "@/components/providers"
import { AuthProvider } from "@/contexts/auth-context"
import { WalletProvider } from "@/hooks/use-wallet"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <AppProvider session={session}>
      <AuthProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </AuthProvider>
    </AppProvider>
  );
} 