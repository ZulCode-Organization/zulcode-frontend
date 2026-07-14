"use client";

import { useRedirectIfAuth } from "@/hooks/useAuthGuard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  useRedirectIfAuth();

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:flex-row">
      <AuthLogo />

      <div className="hidden items-center justify-center bg-secondary/40 px-16 lg:flex lg:w-1/2">
        <AuthShowcase />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <SignupForm />
      </div>
    </div>
  );
}
