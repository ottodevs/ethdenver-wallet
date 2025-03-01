"use client"

import GetButton from "@/components/get-button";
import { LoginButton } from "@/components/login-button"
import { Wallet } from "@/components/wallet"
import { getAccount, useOkto } from "@okto_web3/react-sdk";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";

export default function Home() {
  const { data: session } = useSession();
  const oktoClient = useOkto();

  //@ts-expect-error - id_token is not defined on type Session
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);

  async function handleAuthenticate(): Promise<unknown> {
    if (!idToken) {
        return { result: false, error: "No google login" };
    }
    const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: 'google',
    });
    console.log("Authentication Success", user);
    return JSON.stringify(user);
}

async function handleLogout() {
    try {
        signOut();
        return { result: "logout success" };
    } catch (error: unknown) {
      console.error("Logout failed", error);
        return { result: "logout failed" };
    }
}

useEffect(()=>{
    if(idToken){
        handleAuthenticate();
    }
}, [idToken]) // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background to-muted pb-20">
      <div className="container max-w-md p-4">
        <Wallet />
        <LoginButton />
        <GetButton title="Okto Log out" apiFn={handleLogout} />
                <GetButton title="getAccount" apiFn={getAccount} />
      </div>
    </main>
  )
}

