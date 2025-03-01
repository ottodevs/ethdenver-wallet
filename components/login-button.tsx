"use client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export function LoginButton() {
    const { data: session } = useSession(); // Get session data

    const handleLogin = () => {
        signIn("google");   // Trigger Google sign-in
    };

    return (
        <Button 
            className="w-full mt-4"
            onClick={handleLogin}
            disabled={!!session}
        >
            <LogIn className="mr-2 h-4 w-4" />
            {session ? "Authenticated" : "Sign in with Google"}
        </Button>
    );
}