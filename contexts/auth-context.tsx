// contexts/auth-context.tsx
"use client";

import { useOkto } from "@okto_web3/react-sdk";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

// Constante para el intervalo de verificación (5 minutos en ms)
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authStatus: string;
  handleAuthenticate: () => Promise<unknown>;
  checkAuthStatus: () => Promise<boolean>; // Método para verificar bajo demanda
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authStatus: "",
  handleAuthenticate: async () => ({ result: false }),
  checkAuthStatus: async () => false
});

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

  // Función para verificar el estado de autenticación
  const checkAuthStatus = async (): Promise<boolean> => {
    if (!oktoClient) return false;
    
    try {
      const now = Date.now();
      // Solo verificar si han pasado más de 30 segundos desde la última verificación
      if (now - lastChecked < 30000) {
        return isAuthenticated;
      }
      
      setLastChecked(now);
      const authStatus = oktoClient.isLoggedIn();
      console.log("Okto auth status check:", authStatus);
      
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
  };

  // Verificación inicial y periódica con intervalo más largo
  useEffect(() => {
    if (!oktoClient) return;
    
    // Verificación inicial
    checkAuthStatus();
    
    // Verificación periódica con intervalo más largo (5 minutos)
    const interval = setInterval(() => {
      checkAuthStatus();
    }, AUTH_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [oktoClient]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setLastChecked(Date.now()); // Actualizar timestamp de última verificación
        return { result: true };
      }
      
      console.log("Attempting OAuth login with token length:", idToken.length);
      
      // Store the session key in secure storage
      const user = await oktoClient.loginUsingOAuth({
        idToken: idToken,
        provider: 'google',
      }, (sessionKey) => {
        console.log("Session key received, length:", sessionKey.sessionPubKey.length);
        
        // Store the session private key securely
        // For development, we'll use localStorage, but in production
        // consider more secure options like secure HTTP-only cookies
        localStorage.setItem('okto_session_key', sessionKey.sessionPrivKey);
      });
      
      console.log("Authentication Success", user);
      setAuthStatus("Authentication successful");
      setIsAuthenticated(true);
      setError(null);
      setLastChecked(Date.now()); // Actualizar timestamp de última verificación
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
      handleAuthenticate,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);