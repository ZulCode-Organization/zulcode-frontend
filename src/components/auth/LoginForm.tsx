"use client";

import Link from "next/link";
import { Mail, Lock, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useLogin";

export function LoginForm() {
  const { email, setEmail, senha, setSenha, error, loading, aguardandoAparelho, handleSubmit } = useLogin();

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

        <Link
          href="/esqueci-a-senha"
          className="-mt-1 self-end text-sm font-semibold text-primary hover:underline"
        >
          Esqueci minha senha
        </Link>

        {/* Conta aberta em outro aparelho: o acesso só vem quando alguém
            confirmar lá. Enquanto isso, a tela explica a espera em vez de
            parecer travada. */}
        {aguardandoAparelho && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-3 py-3 text-sm text-amber-600 dark:text-amber-400">
            <MonitorSmartphone className="mt-0.5 size-4 shrink-0" />
            <span>
              <b className="block">Confirme no outro aparelho</b>
              Sua conta está aberta em outro dispositivo. Abrimos um pedido lá — aceite para
              continuar por aqui.
            </span>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          variant="default"
          size="lg"
          onClick={handleSubmit}
          disabled={loading || aguardandoAparelho}
          className="mt-2"
        >
          {aguardandoAparelho ? "Aguardando confirmação..." : loading ? "Entrando..." : "Entrar"}
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
