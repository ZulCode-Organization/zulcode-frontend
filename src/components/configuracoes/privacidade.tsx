"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparSeguidos } from "@/hooks/use-seguir";
import { limparCursosCache } from "@/hooks/use-cursos";
import { limparWidgetDaOfensiva } from "@/lib/widget-ofensiva";
import { limparAvisos } from "@/lib/avisos";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { Grupo, Linha } from "./linhas";
import { TelaDeConfig } from "./tela";

/**
 * Privacidade: baixar tudo que o ZulCode guarda (LGPD) e excluir a conta
 * dentro do app — o Google Play exige que dê para excluir sem sair do app.
 */
export function PrivacidadeContent() {
  const t = useTranslations("configuracoes.privacidade");
  const tConfig = useTranslations("configuracoes");
  const router = useRouter();
  const { perfil } = usePerfil();
  const [baixando, setBaixando] = useState(false);
  const [erroDados, setErroDados] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [email, setEmail] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const baixar = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || baixando) return;
    setBaixando(true);
    setErroDados(false);
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/dados`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const arquivo = new Blob([JSON.stringify(await res.json(), null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(arquivo);
      link.download = `zulcode-meus-dados-${perfil?.publicCode ?? "conta"}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setErroDados(true);
    } finally {
      setBaixando(false);
    }
  };

  const excluir = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || excluindo) return;
    setExcluindo(true);
    setErroExcluir(null);
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/excluir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacao: email }),
      });
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        setErroExcluir(res.status === 403 ? t("adminNao") : typeof corpo?.message === "string" ? corpo.message : t("erroExcluir"));
        return;
      }
      // A conta não existe mais: limpa tudo deste aparelho e volta para o começo.
      localStorage.removeItem("accessToken");
      void limparWidgetDaOfensiva();
      void limparAvisos();
      limparPerfilCache();
      limparTrilhaCache();
      limparSeguidos();
      limparCursosCache();
      router.replace("/welcome");
    } catch {
      setErroExcluir(t("erroExcluir"));
    } finally {
      setExcluindo(false);
    }
  };

  const confere = !!perfil?.email && email.trim().toLowerCase() === perfil.email.toLowerCase();

  return (
    <TelaDeConfig titulo={tConfig("linhas.privacidade")} voltar>
      <Grupo>
        <Linha
          titulo={t("dados")}
          descricao={erroDados ? <span className="font-bold text-destructive">{t("erroDados")}</span> : baixando ? t("baixando") : t("dadosDescricao")}
          onClick={() => void baixar()}
          acessorio={baixando ? <Loader2 className="size-5 shrink-0 animate-spin text-primary" /> : undefined}
        />
        <Linha titulo={t("excluir")} descricao={t("excluirDescricao")} destaque onClick={() => setConfirmando(true)} />
      </Grupo>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="titulo-excluir">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <h2 id="titulo-excluir" className="text-xl font-black text-foreground">{t("confirmarTitulo")}</h2>
            <p className="mt-2 text-[0.9rem] font-semibold leading-relaxed text-muted-foreground">{t("confirmarTexto", { email: perfil?.email ?? "" })}</p>
            <label className="mt-4 block text-[0.75rem] font-black uppercase tracking-[0.06em] text-muted-foreground" htmlFor="confirmar-email">{t("confirmarCampo")}</label>
            <input
              id="confirmar-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              className="mt-1.5 w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-[0.95rem] font-bold text-foreground outline-none focus:border-destructive"
            />
            {erroExcluir && <p className="mt-2 text-[0.82rem] font-bold text-destructive">{erroExcluir}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => { setConfirmando(false); setEmail(""); setErroExcluir(null); }} className="h-12 flex-1 rounded-2xl border-2 border-border text-[0.85rem] font-black uppercase tracking-[0.05em] text-muted-foreground">
                {t("cancelar")}
              </button>
              <button
                type="button"
                disabled={!confere || excluindo}
                onClick={() => void excluir()}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive text-[0.85rem] font-black uppercase tracking-[0.05em] text-white disabled:opacity-40"
              >
                {excluindo && <Loader2 className="size-4 animate-spin" />}
                {excluindo ? t("excluindo") : t("confirmarBotao")}
              </button>
            </div>
          </div>
        </div>
      )}
    </TelaDeConfig>
  );
}
