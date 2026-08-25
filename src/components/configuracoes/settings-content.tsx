"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, LogOut, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { usePerfil } from "@/hooks/use-perfil";

type TemaComprado = {
  id: string;
  name: string;
  description: string;
  owned: boolean;
  equipped?: boolean;
  value: { primary?: string; accent?: string };
};

export function SettingsContent() {
  const router = useRouter();
  const [pushMensagem, setPushMensagem] = useState<string | null>(null);
  const [ativandoPush, setAtivandoPush] = useState(false);
  const [temas, setTemas] = useState<TemaComprado[]>([]);
  const [aplicandoTema, setAplicandoTema] = useState<string | null>(null);
  const { perfil, retry } = usePerfil();
  const temasDisponiveis = perfil?.isPro ? [...temas, { id: "pro-theme", name: "Tema PRO", description: "Tema exclusivo dos assinantes PRO.", owned: true, value: { primary: "#a855f7", accent: "#f0abfc" } }] : temas;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((itens: (TemaComprado & { kind: string })[]) =>
        setTemas(itens.filter((item) => item.kind === "THEME" && item.owned))
      )
      .catch(() => setTemas([]));
  }, []);

  const usarTema = async (tema: TemaComprado) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setAplicandoTema(tema.id);
    try {
      const res = await fetchComTimeout(
        `${API_BASE_URL}/user/zulcoins/cosmetics/${tema.id}/equip`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      retry();
    } finally {
      setAplicandoTema(null);
    }
  };

  const pararDeUsarTema = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setAplicandoTema("reset");
    try {
      const res = await fetchComTimeout(
        `${API_BASE_URL}/user/zulcoins/cosmetics/theme/reset`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) retry();
    } finally {
      setAplicandoTema(null);
    }
  };

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
      <p className="text-sm font-black uppercase tracking-wider text-primary">
        Conta
      </p>
      <h1 className="mt-2 text-4xl font-black">Configurações</h1>
      <p className="mt-2 text-muted-foreground">
        Personalize a experiência e controle as permissões do seu aplicativo.
      </p>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <section className="rounded-[24px] border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-lg font-black text-foreground">
            <Sun className="size-5 text-primary" />
            Aparência
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha como o ZulCode aparece para você.
          </p>
          <div className="mt-5">
            <ThemeToggle />
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-black">Temas comprados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Troque a paleta completa da sua interface.
            </p>
            {temasDisponiveis.length ? (
              <>
                <div className="mt-3 grid gap-2">
                  {temasDisponiveis.map((tema) => {
                    const emUso =
                      perfil?.themeColor?.toLowerCase() ===
                      tema.value.primary?.toLowerCase();
                    return (
                      <button
                        key={tema.id}
                        type="button"
                        disabled={aplicandoTema !== null || emUso}
                        onClick={() => usarTema(tema)}
                        className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${emUso ? "border-primary bg-primary/15 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
                      >
                        <span className="flex size-10 overflow-hidden rounded-lg shadow-sm">
                          {[tema.value.primary, tema.value.accent].map(
                            (cor) => (
                              <i
                                key={cor}
                                className="flex-1"
                                style={{ background: cor }}
                              />
                            )
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-sm">{tema.name}</b>
                          <span className={`block text-xs ${emUso ? "font-bold text-primary" : "text-muted-foreground"}`}>
                            {emUso ? "Tema selecionado" : "Usar tema"}
                          </span>
                        </span>
                        {emUso && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[0.65rem] font-black text-primary-foreground"><Check className="size-3" />Em uso</span>}
                      </button>
                    );
                  })}
                </div>
                {perfil?.themeColor && (
                  <button
                    type="button"
                    disabled={aplicandoTema !== null}
                    onClick={pararDeUsarTema}
                    className="mt-3 text-xs font-black text-primary hover:underline"
                  >
                    Parar de usar tema
                  </button>
                )}
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Você ainda não possui temas. Compre um na Loja.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-lg font-black text-foreground">
            <Bell className="size-5 text-primary" />
            Notificações
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Receba avisos e novidades do ZulCode no seu APK ou IPA.
          </p>
          <button
            type="button"
            disabled={ativandoPush}
            onClick={ativarPush}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
          >
            <BellRing className="size-4" />
            {ativandoPush ? "Ativando…" : "Ativar notificações"}
          </button>
          {pushMensagem && (
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              {pushMensagem}
            </p>
          )}
        </section>

        <section className="rounded-[24px] border border-border bg-card p-6 md:col-span-2">
          <div className="flex items-center gap-3 text-lg font-black text-foreground">
            <LogOut className="size-5 text-destructive" />
            Sessão
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Encerre sua sessão neste aparelho.
          </p>
          <button
            type="button"
            onClick={sair}
            className="mt-5 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-black text-destructive transition-colors hover:bg-destructive/10"
          >
            Sair da conta
          </button>
        </section>
      </div>
    </div>
  );
}
