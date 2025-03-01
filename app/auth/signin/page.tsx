"use client";

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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between bg-[#141419]">
      {/* Background SVG */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/onboarding.svg"
          alt="Aeris Onboarding"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive max-w-md w-full">
          {error === "OAuthSignin" &&
            "Error starting the sign in process. Please try again."}
          {error === "OAuthCallback" &&
            "Error during the sign in callback. Please try again."}
          {error === "OAuthAccountNotLinked" &&
            "This account is already linked to another user."}
          {error === "Callback" &&
            "Error during the callback process. Please try again."}
          {error === "Default" &&
            "An unexpected error occurred. Please try again."}
          {![
            "OAuthSignin",
            "OAuthCallback",
            "OAuthAccountNotLinked",
            "Callback",
            "Default",
          ].includes(error) &&
            "An error occurred during sign in. Please try again."}
        </div>
      )}

      {/* Sign in button positioned 24px from bottom */}
      <div className="fixed bottom-6 left-0 right-0 z-10 w-full px-4 sm:px-6 md:px-8 max-w-md mx-auto">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 px-4 text-black font-medium shadow-md transition-colors hover:bg-gray-100"
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
        </button>
      </div>
    </div>
  );
}
