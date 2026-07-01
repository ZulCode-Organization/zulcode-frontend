"use client";

import { useRedirectIfAuth } from "@/hooks/useAuthGuard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  useRedirectIfAuth();

  return (
    <div className="min-h-screen bg-zul-dark flex flex-col items-center justify-center">
      <AuthLogo />
      <SignupForm />
    </div>
  );
}