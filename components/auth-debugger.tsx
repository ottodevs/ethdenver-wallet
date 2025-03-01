"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOkto } from "@okto_web3/react-sdk";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "./ui/button";

export function AuthDebugger() {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const { isAuthenticated, isLoading, error, checkAuthStatus, login, logout } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const checkAuth = async () => {
    const status = await checkAuthStatus();
    setDebugInfo(prev => ({
      ...prev,
      authStatus: status,
      timestamp: new Date().toISOString()
    }));
  };
  
  const getOktoToken = () => {
    try {
      const token = oktoClient?.getAuthToken();
      setDebugInfo(prev => ({
        ...prev,
        token: token ? token.substring(0, 20) + "..." : "No token",
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        tokenError: String(err),
        timestamp: new Date().toISOString()
      }));
    }
  };
  
  const testApiCall = async () => {
    try {
      setDebugInfo(prev => ({
        ...prev,
        apiCallStatus: "loading",
        timestamp: new Date().toISOString()
      }));
      
      const wallets = await oktoClient?.getWallets();
      
      setDebugInfo(prev => ({
        ...prev,
        apiCallStatus: "success",
        wallets: wallets,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        apiCallStatus: "error",
        apiError: String(err),
        timestamp: new Date().toISOString()
      }));
    }
  };
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white text-sm">
      <h3 className="text-lg font-bold mb-2">Auth Debugger</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>Session:</div>
        <div>{session ? "✅" : "❌"}</div>
        
        <div>Okto Client:</div>
        <div>{oktoClient ? "✅" : "❌"}</div>
        
        <div>Authenticated:</div>
        <div>{isAuthenticated ? "✅" : "❌"}</div>
        
        <div>Loading:</div>
        <div>{isLoading ? "⏳" : "✅"}</div>
        
        <div>Error:</div>
        <div>{error || "None"}</div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={checkAuth}>
          Check Auth
        </Button>
        <Button size="sm" variant="outline" onClick={getOktoToken}>
          Get Token
        </Button>
        <Button size="sm" variant="outline" onClick={testApiCall}>
          Test API
        </Button>
        <Button size="sm" variant="outline" onClick={login}>
          Force Login
        </Button>
        <Button size="sm" variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold mb-1">Debug Info:</h4>
        <pre className="bg-gray-900 p-2 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
} 