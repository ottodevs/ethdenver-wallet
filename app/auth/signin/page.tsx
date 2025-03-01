"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Blockchain Wallet</CardTitle>
          <CardDescription>
            Sign in to access your wallet and manage your assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error === "OAuthSignin" && "Error starting the sign in process. Please try again."}
              {error === "OAuthCallback" && "Error during the sign in callback. Please try again."}
              {error === "OAuthAccountNotLinked" && "This account is already linked to another user."}
              {error === "Callback" && "Error during the callback process. Please try again."}
              {error === "Default" && "An unexpected error occurred. Please try again."}
              {!["OAuthSignin", "OAuthCallback", "OAuthAccountNotLinked", "Callback", "Default"].includes(error) && 
                "An error occurred during sign in. Please try again."}
            </div>
          )}
          
          <Button 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleGoogleSignIn}
          >
            <Image 
              src="/google-logo.svg" 
              alt="Google" 
              width={20} 
              height={20} 
              className="h-5 w-5"
            />
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p>
            This wallet uses secure authentication to protect your assets.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 