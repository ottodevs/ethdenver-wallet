"use client";
import { useSession, signIn } from "next-auth/react";
 
export function LoginButton() {
    const { data: session } = useSession(); // Get session data
 
    const handleLogin = () => {
        signIn("google");   // Trigger Google sign-in
    };
 
    return (
        <button
            className={`border border-transparent rounded px-4 py-2 transition-colors ${
                session
                ? "bg-blue-500 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-700 text-white"
            }`}
            onClick={handleLogin}
        >
            Authenticate
        </button>
    );
}