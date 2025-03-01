import "@/app/globals.css";
import AppProvider from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastContextProvider } from "@/components/ui/toast-context";
import type { Metadata } from "next";
import { getServerSession, Session } from "next-auth";
import { Inter, Outfit } from "next/font/google";
import type React from "react";
import { authOptions } from "./api/auth/[...nextauth]/options";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blockchain Wallet",
  description:
    "A modern blockchain wallet with optimistic UI and chain abstraction",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${outfit.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastContextProvider>
            <AppProvider session={session as Session}>
              {children}
            </AppProvider>
          </ToastContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
