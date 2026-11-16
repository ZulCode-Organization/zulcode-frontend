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

      {/* Cabe numa tela só, sem rolagem: o espaço em volta encolhe em telas
          baixas, e no celular o topo deixa lugar só para o logo. */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4 pt-16 lg:py-8">
        <SignupForm />
      </div>
    </div>
  );
}
