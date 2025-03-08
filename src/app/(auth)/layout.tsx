import { ThemeProvider } from "@/components/theme-provider";
// import { SessionProvider } from "next-auth/react";
// import { Inter } from "next/font/google";

// const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    // </SessionProvider>
  );
} 