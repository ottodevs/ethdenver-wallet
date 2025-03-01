"use client"

import { Wallet } from "@/components/wallet";
import { useOkto } from "@okto_web3/react-sdk";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const [authStatus, setAuthStatus] = useState<string>("");

  //@ts-expect-error - id_token is not defined on type Session
  const idToken = useMemo(() => (session ? session.id_token : null), [session]);

  async function handleAuthenticate(): Promise<unknown> {
    if (!idToken) {
      return { result: false, error: "No google login" };
    }
    
    try {
      setAuthStatus("Authenticating with Okto...");
      
      // Use the callback to capture the session key
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: 'google',
      }, () => {
        console.log("Session key received");
        // You can store this key securely if needed for delegated actions
      });
      
      console.log("Authentication Success", user);
      setAuthStatus("Authentication successful");
      return JSON.stringify(user);
    } catch (error) {
      console.error("Authentication failed", error);
      setAuthStatus("Authentication failed");
      return { result: false, error: "Authentication failed" };
    }
  }

  useEffect(()=>{
    if(idToken){
      handleAuthenticate();
    }
  }, [idToken]) // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background to-muted pb-20">
      <div className="container max-w-md p-4 min-h-screen">
        {authStatus && <p className="text-sm text-muted-foreground mb-4">{authStatus}</p>}
        <Wallet />
      </div>
    </main>
  )
} 