// contexts/auth-context.tsx
"use client";

import { useOkto } from "@okto_web3/react-sdk";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Constante para el intervalo de verificación (5 minutos en ms)
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;
// Minimum time between manual auth checks (30 seconds)
const MIN_CHECK_INTERVAL = 30 * 1000;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authStatus: string;
  handleAuthenticate: () => Promise<unknown>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authStatus: "",
  handleAuthenticate: async () => ({ result: false }),
  checkAuthStatus: async () => false
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const oktoClient = useOkto();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastChecked, setLastChecked] = useState(0);

  // Extract ID token from session
  const idToken = useMemo(() => {
    // @ts-expect-error - id_token is not defined on type Session
    return session ? session.id_token : null;
  }, [session]);

  // Memoize checkAuthStatus to prevent recreation on each render
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!oktoClient) return false;
    
    try {
      const now = Date.now();
      // Only check if more than MIN_CHECK_INTERVAL has passed since last check
      if (now - lastChecked < MIN_CHECK_INTERVAL) {
        return isAuthenticated;
      }
      
      setLastChecked(now);
      const authStatus = oktoClient.isLoggedIn();
      
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          setAuthStatus("Authenticated with Okto");
        }
      }
      
      return authStatus;
    } catch (err) {
      console.error("Auth check failed:", err);
      setError("Failed to verify authentication");
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [oktoClient, lastChecked, isAuthenticated]);

  // Handle authentication with Okto
  const handleAuthenticate = useCallback(async (): Promise<unknown> => {
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
        setLastChecked(Date.now());
        return { result: true };
      }
      
      // Store the session key in secure storage
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: 'google',
      }, (sessionKey) => {
        // Store the session private key securely
        localStorage.setItem('okto_session_key', sessionKey.sessionPrivKey);
      });
      
      setAuthStatus("Authentication successful");
      setIsAuthenticated(true);
      setError(null);
      setLastChecked(Date.now());
      return { result: true, user: JSON.stringify(user) };
    } catch (error) {
      console.error("Authentication attempt failed:", error);
      
      // Check if we're already authenticated despite the error
      try {
        const isLoggedIn = oktoClient.isLoggedIn();
        if (isLoggedIn) {
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
  }, [idToken, oktoClient, isAuthenticating]);

  // Initial auth check when client and session are available
  useEffect(() => {
    if (oktoClient) {
      checkAuthStatus();
      
      // Periodic check with longer interval
      const interval = setInterval(() => {
        checkAuthStatus();
      }, AUTH_CHECK_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [oktoClient, checkAuthStatus]);

  // Attempt authentication when session and client are available
  useEffect(() => {
    if (idToken && oktoClient && !isAuthenticated && !isAuthenticating) {
      handleAuthenticate();
    }
  }, [idToken, oktoClient, isAuthenticated, isAuthenticating, handleAuthenticate]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    isLoading,
    error,
    authStatus,
    handleAuthenticate,
    checkAuthStatus
  }), [isAuthenticated, isLoading, error, authStatus, handleAuthenticate, checkAuthStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}