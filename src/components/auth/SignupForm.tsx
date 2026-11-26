"use client";

import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { useSignup } from "@/hooks/useSignup";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { BotoesSociais } from "@/components/auth/botoes-sociais";
import { Input } from "../ui/input";
import type { CampoDaEntrada } from "./LoginForm";

/**
 * Criar conta: nome, e-mail e senha (o olho do campo mostra a senha, então não
 * há "confirmar senha"), ou direto com Google e GitHub. Os termos e a política
 * ficam ditos antes do botão, e quem já tem conta tem o atalho para entrar.
 */
export function SignupForm({ onTrocar, onCampo }: { onTrocar?: () => void; onCampo?: (campo: CampoDaEntrada) => void } = {}) {
  const { nome, setNome, email, setEmail, senha, setSenha, error, loading, handleSubmit } = useSignup();

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <h2 className="text-2xl font-bold text-foreground">Criar sua conta</h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground [@media(max-height:700px)]:mb-3">É grátis e leva menos de um minuto.</p>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          void handleSubmit();
        }}
        className="flex flex-col gap-3.5 [@media(max-height:700px)]:gap-2.5"
      >
        <Input
          label="Como quer ser chamado?"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onFocus={() => onCampo?.("nome")}
          onBlur={() => onCampo?.(null)}
          icon={<User className="size-4" />}
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => onCampo?.("email")}
          onBlur={() => onCampo?.(null)}
          icon={<Mail className="size-4" />}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Pelo menos 6 caracteres"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onFocus={() => onCampo?.("senha")}
          onBlur={() => onCampo?.(null)}
          icon={<Lock className="size-4" />}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Ao criar a conta, você concorda com os{" "}
          <Link href="/termos" className="font-semibold text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/politica-de-privacidade" className="font-semibold text-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <BotaoRelevo type="submit" disabled={loading}>
          {loading ? "Criando conta…" : "Criar conta"}
        </BotaoRelevo>
      </form>

      <div className="mt-5 [@media(max-height:700px)]:mt-3">
        <BotoesSociais />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground [@media(max-height:700px)]:mt-3">
        Já tem conta?{" "}
        {onTrocar ? (
          <button type="button" onClick={onTrocar} className="font-semibold text-primary hover:underline">
            Entrar
          </button>
        ) : (
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        )}
      </p>
    </div>
  );
}
