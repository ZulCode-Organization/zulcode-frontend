"use client";

import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { useSignup } from "@/hooks/useSignup";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function SignupForm() {
  const {
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    error,
    loading,
    handleSubmit,
  } = useSignup();

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <h2 className="mb-8 text-2xl font-bold text-foreground">Criar nova conta</h2>

      <div className="flex flex-col gap-4">
        <Input
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          icon={<User className="size-4" />}
        />
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
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          icon={<Lock className="size-4" />}
        />

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <Button size="lg" onClick={handleSubmit} disabled={loading} className="mt-2">
          {loading ? "Criando conta..." : "Criar conta"}
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
