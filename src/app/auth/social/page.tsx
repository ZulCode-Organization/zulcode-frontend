"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * A volta do Google ou do GitHub.
 *
 * O backend termina a conversa com o provedor e manda a pessoa pra cá com o
 * token do ZulCode na URL. Aqui ele sai do endereço e vai pro armazenamento —
 * deixá-lo na barra seria deixá-lo no histórico do navegador, e qualquer um
 * que abrisse o histórico depois entraria na conta.
 *
 * O destino segue a mesma regra do login normal: quem ainda não foi nivelado
 * cai no onboarding, e não na Jornada.
 */
function Recebendo() {
  const router = useRouter();
  const parametros = useSearchParams();

  useEffect(() => {
    const token = parametros.get("token");
    if (!token) {
      router.replace("/login?erro=" + encodeURIComponent("A entrada não foi concluída."));
      return;
    }

    localStorage.setItem("accessToken", token);
    // `replace`, e não `push`: voltar pra esta tela depois tentaria entrar de
    // novo com um token que já foi usado.
    router.replace(parametros.get("nivelado") === "true" ? "/home" : "/onboarding/introduction");
  }, [parametros, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Loader2 className="size-7 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Entrando na sua conta…</p>
    </div>
  );
}

export default function AuthSocialPage() {
  // useSearchParams exige Suspense por cima na renderização estática do Next.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      }
    >
      <Recebendo />
    </Suspense>
  );
}
