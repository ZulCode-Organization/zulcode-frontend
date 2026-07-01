"use client";

import { useRedirectIfAuth } from "@/hooks/useAuthGuard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  useRedirectIfAuth();

  return (
    <div className="min-h-screen bg-zul-dark flex flex-col items-center justify-center">
      <AuthLogo />
      <LoginForm />
    </div>
  );
}