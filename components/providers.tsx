"use client";
import { SessionProvider } from "next-auth/react";
import { Hex, Hash, OktoProvider } from "@okto_web3/react-sdk";
import React from "react";
import { Session } from "next-auth";
 
function AppProvider({ children, session }: { children: React.ReactNode, session: Session }) {
    return (
        <SessionProvider session={session}>
        <OktoProvider
            config={{
                environment: "sandbox",
                clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY as Hash,
                clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA as Hex,
            }}
        >
            {children}
        </OktoProvider>
        </SessionProvider>
    );
}
export default AppProvider;