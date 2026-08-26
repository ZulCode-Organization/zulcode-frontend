"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, Sun, LogOut } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparCursosCache } from "@/hooks/use-cursos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";

export function AccountPanel() {
  const router = useRouter();
  const [pushMensagem, setPushMensagem] = useState<string | null>(null);
  const [ativandoPush, setAtivandoPush] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    // O cache do perfil e da trilha vive em memória e sobrevive ao
    // router.replace (não é reload de página) — sem limpar, a próxima conta
    // logada nesse navegador veria por um instante o perfil/trilha da conta
    // anterior.
    limparPerfilCache();
    limparTrilhaCache();
    limparCursosCache();
    router.replace("/welcome");
  };

  const ativarPush = async () => {
    setAtivandoPush(true);
    const resultado = await ativarNotificacoesNativas();
    setPushMensagem(resultado.mensagem);
    setAtivandoPush(false);
  };

  return (
    <div>
      <h3 className="mb-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
        Conta
      </h3>

      <div className="rounded-[20px] border border-border bg-card px-5 py-5">
        <div className="mb-3.5 flex items-center gap-2.5 text-[0.95rem] font-extrabold text-foreground">
          <Sun className="size-4.5" />
          Aparência
        </div>
        <ThemeToggle />

        <div className="mt-3.5 border-t border-border pt-3.5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <Bell className="size-4.5 text-primary" />
            Notificações
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Receba avisos e novidades do ZulCode neste aparelho.</p>
          <button type="button" disabled={ativandoPush} onClick={ativarPush} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-60">
            <BellRing className="size-4" />
            {ativandoPush ? "Ativando…" : "Ativar notificações"}
          </button>
          {pushMensagem && <p className="mt-2 text-xs font-semibold text-muted-foreground">{pushMensagem}</p>}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2.5 border-t border-border pt-4 text-sm font-extrabold text-destructive"
        >
          <LogOut className="size-4.5" />
          Sair
        </button>
      </div>
    </div>
  );
}
