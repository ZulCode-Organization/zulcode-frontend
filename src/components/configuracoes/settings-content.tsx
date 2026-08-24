"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, LogOut, Sun } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";

export function SettingsContent() {
  const router = useRouter();
  const [pushMensagem, setPushMensagem] = useState<string | null>(null);
  const [ativandoPush, setAtivandoPush] = useState(false);

  const ativarPush = async () => {
    setAtivandoPush(true);
    const resultado = await ativarNotificacoesNativas();
    setPushMensagem(resultado.mensagem);
    setAtivandoPush(false);
  };

  const sair = () => {
    localStorage.removeItem("accessToken");
    limparPerfilCache();
    limparTrilhaCache();
    router.replace("/welcome");
  };

  return (
    <div className="max-w-4xl pt-6">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Conta</p>
      <h1 className="mt-2 text-4xl font-black">Configurações</h1>
      <p className="mt-2 text-muted-foreground">Personalize a experiência e controle as permissões do seu aplicativo.</p>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <section className="rounded-[24px] border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-lg font-black text-foreground"><Sun className="size-5 text-primary" />Aparência</div>
          <p className="mt-2 text-sm text-muted-foreground">Escolha como o ZulCode aparece para você.</p>
          <div className="mt-5"><ThemeToggle /></div>
        </section>

        <section className="rounded-[24px] border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-lg font-black text-foreground"><Bell className="size-5 text-primary" />Notificações</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Receba avisos e novidades do ZulCode no seu APK ou IPA.</p>
          <button type="button" disabled={ativandoPush} onClick={ativarPush} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"><BellRing className="size-4" />{ativandoPush ? "Ativando…" : "Ativar notificações"}</button>
          {pushMensagem && <p className="mt-3 text-xs font-semibold text-muted-foreground">{pushMensagem}</p>}
        </section>

        <section className="rounded-[24px] border border-border bg-card p-6 md:col-span-2">
          <div className="flex items-center gap-3 text-lg font-black text-foreground"><LogOut className="size-5 text-destructive" />Sessão</div>
          <p className="mt-2 text-sm text-muted-foreground">Encerre sua sessão neste aparelho.</p>
          <button type="button" onClick={sair} className="mt-5 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-black text-destructive transition-colors hover:bg-destructive/10">Sair da conta</button>
        </section>
      </div>
    </div>
  );
}
