// contexts/auth-context.tsx
"use client";

import { useOkto } from "@okto_web3/react-sdk";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authStatus: string;
  handleAuthenticate: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authStatus: "",
  handleAuthenticate: async () => ({ result: false })
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Extract ID token from session
  const idToken = useMemo(() => {
    // @ts-expect-error - id_token is not defined on type Session
    return session ? session.id_token : null;
  }, [session]);

  // Check authentication status with Okto
  useEffect(() => {
    if (!oktoClient) return;
    
    const checkAuth = async () => {
      try {
        const authStatus = oktoClient.isLoggedIn();
        console.log("Okto auth status check:", authStatus);
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          setAuthStatus("Authenticated with Okto");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setError("Failed to verify authentication");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Periodically check auth status
    const interval = setInterval(checkAuth, 10000);
    return () => clearInterval(interval);
  }, [oktoClient]);

  // Handle authentication with Okto
  const handleAuthenticate = async (): Promise<unknown> => {
    if (!idToken || !oktoClient) {
      setError("Missing requirements for authentication");
      return { result: false, error: "Missing requirements for authentication" };
    }
    
    // Prevent multiple authentication attempts
    if (isAuthenticating) return { result: false, error: "Authentication already in progress" };
    
    try {
      setIsAuthenticating(true);
      setAuthStatus("Authenticating with Okto...");
      
      // Check if already logged in
      const isLoggedIn = oktoClient.isLoggedIn();
      if (isLoggedIn) {
        console.log("Already authenticated with Okto");
        setAuthStatus("Already authenticated");
        setIsAuthenticated(true);
        return { result: true };
      }
      
      console.log("Attempting OAuth login with token length:", idToken.length);
      
      // Use the callback to capture the session key
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: 'google',
      }, (sessionKey) => {
        console.log("Session key received, length:", sessionKey.sessionPubKey.length);
      });
      
      console.log("Authentication Success", user);
      setAuthStatus("Authentication successful");
      setIsAuthenticated(true);
      setError(null);
      return { result: true, user: JSON.stringify(user) };
    } catch (error) {
      console.error("Authentication attempt failed:", error);
      
      // Check if we're already authenticated despite the error
      try {
        const isLoggedIn = oktoClient.isLoggedIn();
        if (isLoggedIn) {
          console.log("Already authenticated despite error");
          setAuthStatus("Authentication successful");
          setIsAuthenticated(true);
          return { result: true };
        }
      } catch (e) {
        console.error("Failed to check login status:", e);
      }
      
      setAuthStatus("Authentication failed");
      setError(`Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { result: false, error: "Authentication failed" };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Attempt authentication when session and client are available
  useEffect(() => {
    if (idToken && oktoClient && !isAuthenticated && !isAuthenticating) {
      handleAuthenticate();
    }
  }, [idToken, oktoClient, isAuthenticated, isAuthenticating]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      error, 
      authStatus,
      handleAuthenticate 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);