import { useAuth } from "@/contexts/auth-context";
import { useOkto } from "@okto_web3/react-sdk";
import { useEffect } from "react";

export function TokenSelector() {
  const oktoClient = useOkto();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    async function fetchTokens() {
      if (!oktoClient || !isAuthenticated) return;
      
      // El resto del código permanece igual
      // ...
    }

    fetchTokens();
  }, [oktoClient, isAuthenticated]);

  // Resto del código
} 