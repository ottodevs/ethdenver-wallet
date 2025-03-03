import ProtectedClientLayout from "@/components/protected-client-layout";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/options";

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
    <div className="max-w-full overflow-x-hidden">
      <ProtectedClientLayout session={session}>{children}</ProtectedClientLayout>
    </div>
  );
} 