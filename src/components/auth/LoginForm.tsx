"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { BotoesSociais } from "@/components/auth/botoes-sociais";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useLogin";

export function LoginForm() {
  const { email, setEmail, senha, setSenha, error, loading, handleSubmit } = useLogin();

  // Quando a entrada por provedor falha, quem traz o motivo e a URL: a falha
  // acontece fora daqui, do lado do Google ou do GitHub, e o backend devolve a
  // pessoa pra esta tela com a explicacao.
  const erroDaUrl = useSearchParams().get("erro");
  const aviso = error || erroDaUrl;

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <h2 className="mb-8 text-2xl font-bold text-foreground">Entrar na sua conta</h2>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          void handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
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

        <Link
          href="/esqueci-a-senha"
          className="-mt-1 self-end text-sm font-semibold text-primary hover:underline"
        >
          Esqueci minha senha
        </Link>

        {aviso && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {aviso}
          </p>
        )}

        <BotaoRelevo type="submit" disabled={loading} className="mt-2">
          {loading ? "Entrando…" : "Entrar"}
        </BotaoRelevo>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/welcome" className="font-semibold text-primary hover:underline">
          Voltar para a tela inicial
        </Link>
      </p>

      <div className="mt-7">
        <BotoesSociais />
      </div>
    </div>
  );
}
