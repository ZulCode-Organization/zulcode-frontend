"use client";

import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useLogin";

export function LoginForm() {
  const { email, setEmail, senha, setSenha, error, loading, handleSubmit } = useLogin();

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <h2 className="mb-8 text-2xl font-bold text-foreground">Entrar na sua conta</h2>

      <div className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="size-4" />}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          icon={<Lock className="size-4" />}
        />

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <Button variant="default" size="lg" onClick={handleSubmit} disabled={loading} className="mt-2">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/welcome" className="font-semibold text-primary hover:underline">
          Voltar para a tela inicial
        </Link>
      </p>
    </div>
  );
}
