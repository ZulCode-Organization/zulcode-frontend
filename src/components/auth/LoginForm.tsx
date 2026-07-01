"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useLogin";
import { EmailIcon } from "./EmailIcon";
import { LockIcon } from "./LockIcon";

export function LoginForm() {
  const { email, setEmail, senha, setSenha, error, loading, handleSubmit } = useLogin();

  return (
    <div className="w-full max-w-sm bg-zul-surface border border-zul-border rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold mb-6 text-center">Entrar na sua conta</h2>

      <div className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<EmailIcon />}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          icon={<LockIcon />}
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button
          variant="default"
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 uppercase tracking-wider"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        <Link href="/welcome" className="text-zul-blue font-bold hover:underline">
          Voltar para a tela inicial
        </Link>
      </p>
    </div>
  );
}