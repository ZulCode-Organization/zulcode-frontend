"use client";

import Link from "next/link";
import { useSignup } from "@/hooks/useSignup";
import { UserIcon } from "./UserIcon";
import { EmailIcon } from "./EmailIcon";
import { LockIcon } from "./LockIcon";
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
    <div className="w-full max-w-sm bg-zul-surface border border-zul-border rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold mb-6 text-center">Criar nova conta</h2>

      <div className="flex flex-col gap-4">
        <Input
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          icon={<UserIcon />}
        />
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
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          icon={<LockIcon />}
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 uppercase tracking-wider"
        >
          {loading ? "Criando conta..." : "Criar conta"}
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