"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { Rupee } from "@/components/shared/rupee";
import { usePerfil } from "@/hooks/use-perfil";
import { anunciosDisponiveis, assistirParaRecuperarOfensiva } from "@/lib/anuncios";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { MolduraDeComemoracao } from "./moldura";

type Recuperacao = { aberta: boolean; ofensiva: number; ate: string | null; precoEmRupees: number; podePagar: boolean; proLiberado: boolean };

function cabecalhos(): Record<string, string> | null {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

/**
 * O que aconteceu com a ofensiva enquanto a pessoa estava fora, mostrado uma
 * vez ao abrir o app: o gás de ofensiva que segurou os dias perdidos, ou a
 * ofensiva que apagou — com as formas de trazê-la de volta nas 48 horas
 * seguintes. Quem decide é o servidor (src/ofensiva no backend), que acerta a
 * ofensiva ao abrir o app e toda madrugada.
 */
export function AvisoDaOfensiva() {
  const t = useTranslations("comemoracoes.avisoDaOfensiva");
  const formato = useFormatter();
  const { perfil, atualizar } = usePerfil();
  const [fechado, setFechado] = useState(false);
  const [recuperacao, setRecuperacao] = useState<Recuperacao | null>(null);
  const [comAnuncio, setComAnuncio] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recuperada, setRecuperada] = useState<number | null>(null);
  const aviso = perfil?.ofensivaAviso;
  const perdida = aviso?.tipo === "perdida" && !fechado;

  useEffect(() => {
    if (!perdida) return;
    const headers = cabecalhos();
    if (!headers) return;
    let vivo = true;
    void fetchComTimeout(`${API_BASE_URL}/user/ofensiva/recuperacao`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados: Recuperacao | null) => vivo && dados && setRecuperacao(dados))
      .catch(() => null);
    // Sem PRO, o anúncio é mais uma saída.
    if (!perfil?.isPro) void anunciosDisponiveis().then((sim) => vivo && setComAnuncio(sim));
    return () => {
      vivo = false;
    };
  }, [perdida, perfil?.isPro]);

  if (!aviso || fechado) return null;

  const continuar = () => {
    setFechado(true);
    const headers = cabecalhos();
    if (headers) void fetchComTimeout(`${API_BASE_URL}/user/ofensiva/aviso-visto`, { method: "POST", headers }).catch(() => null);
    if (recuperada !== null) atualizar();
  };

  const recuperar = async (forma: "rupees" | "pro" | "anuncio") => {
    const headers = cabecalhos();
    if (!headers || ocupado) return;
    setOcupado(forma);
    setErro(null);
    try {
      if (forma === "anuncio") {
        if (!(await assistirParaRecuperarOfensiva())) throw new Error(t("recuperar.erro"));
        setRecuperada(recuperacao?.ofensiva ?? 0);
      } else {
        const resposta = await fetchComTimeout(`${API_BASE_URL}/user/ofensiva/recuperar`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ forma }),
        });
        const corpo = await resposta.json().catch(() => null);
        if (!resposta.ok) throw new Error(corpo?.message ?? t("recuperar.erro"));
        setRecuperada(corpo.ofensiva);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("recuperar.erro"));
    } finally {
      setOcupado(null);
    }
  };

  if (aviso.tipo === "perdida" && recuperada !== null) {
    return (
      <MolduraDeComemoracao
        cor="#f97316"
        momento="ofensiva"
        aoContinuar={continuar}
        rotulo={t("recuperar.sucesso")}
        peca={
          <span className="zc-com-nasce">
            <span className="zc-com-tremula block">
              <ChamaDupla dias={recuperada} className="size-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
            </span>
          </span>
        }
        titulo={<span className="block text-[4.5rem] font-black leading-none tabular-nums">{recuperada}</span>}
      >
        <p className="zc-com-sobe mt-4 text-[1rem] text-muted-foreground" style={{ "--atraso": "900ms" } as CSSProperties}>
          {t("recuperar.voltou", { n: recuperada })}
        </p>
      </MolduraDeComemoracao>
    );
  }

  if (aviso.tipo === "perdida") {
    const aberta = recuperacao?.aberta;
    return (
      <MolduraDeComemoracao
        cor="#64748b"
        momento="perdaDePena"
        aoContinuar={continuar}
        peca={
          <span className="zc-com-nasce">
            <ChamaDupla aceso={false} className="size-40 opacity-80" />
          </span>
        }
        titulo={<span className="block text-[2rem] leading-tight">{t("perdida.titulo")}</span>}
      >
        <p className="zc-com-sobe mt-4 max-w-xs text-[1rem] leading-snug text-muted-foreground" style={{ "--atraso": "700ms" } as CSSProperties}>
          {t("perdida.texto", { n: aviso.antes })}
        </p>

        {aberta && recuperacao?.ate && (
          <div className="zc-com-sobe mt-6 flex w-full flex-col gap-2.5" style={{ "--atraso": "1000ms" } as CSSProperties}>
            <p className="text-[0.8rem] font-black uppercase tracking-[0.08em] text-orange-500">
              {t("recuperar.titulo", { quando: formato.dateTime(new Date(recuperacao.ate), { weekday: "long", hour: "2-digit", minute: "2-digit" }) })}
            </p>
            {recuperacao.proLiberado && (
              <button
                type="button"
                onClick={() => void recuperar("pro")}
                disabled={!!ocupado}
                className="zc-press flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[0.85rem] font-black uppercase tracking-[0.04em] text-violet-700 disabled:opacity-60"
              >
                {ocupado === "pro" && <Loader2 className="size-4 animate-spin" />}
                {t("recuperar.pro")}
              </button>
            )}
            <button
              type="button"
              onClick={() => void recuperar("rupees")}
              disabled={!!ocupado || !recuperacao.podePagar}
              title={recuperacao.podePagar ? undefined : t("recuperar.semRupees")}
              className="zc-press flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-[0.85rem] font-black uppercase tracking-[0.04em] text-emerald-950 disabled:opacity-50"
            >
              {ocupado === "rupees" ? <Loader2 className="size-4 animate-spin" /> : <Rupee className="size-4.5" />}
              {t("recuperar.rupees", { preco: recuperacao.precoEmRupees })}
            </button>
            {comAnuncio && (
              <button
                type="button"
                onClick={() => void recuperar("anuncio")}
                disabled={!!ocupado}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border text-[0.85rem] font-black uppercase tracking-[0.04em] text-foreground disabled:opacity-60"
              >
                {ocupado === "anuncio" ? <Loader2 className="size-4 animate-spin" /> : <Clapperboard className="size-4 text-primary" />}
                {t("recuperar.anuncio")}
              </button>
            )}
            {erro && <p role="status" className="text-[0.85rem] font-bold text-rose-500">{erro}</p>}
          </div>
        )}

        {!aberta && (
          <p className="zc-com-sobe mt-3 max-w-xs text-[0.9rem] font-bold leading-snug text-violet-500" style={{ "--atraso": "900ms" } as CSSProperties}>
            {t("perdida.dica")}
          </p>
        )}
      </MolduraDeComemoracao>
    );
  }

  return (
    <MolduraDeComemoracao
      cor="#8b5cf6"
      momento="ofensiva"
      aoContinuar={continuar}
      rotulo={t("gas.titulo")}
      peca={
        <span className="zc-com-nasce">
          <span className="zc-com-tremula block">
            <ChamaDupla dias={aviso.ofensiva} protegido className="size-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
          </span>
        </span>
      }
      titulo={
        <>
          <span className="block text-[4.5rem] font-black leading-none tabular-nums text-violet-500">{aviso.ofensiva}</span>
          <span className="mt-2 block text-[1.5rem]">{t("dias", { n: aviso.ofensiva })}</span>
        </>
      }
    >
      <p className="zc-com-sobe mt-5 max-w-xs text-[1rem] leading-snug text-muted-foreground" style={{ "--atraso": "900ms" } as CSSProperties}>
        {t("gas.texto", { dias: aviso.dias })}
        {aviso.pro && ` ${t("gas.pro")}`}
      </p>
      <p className="zc-com-sobe mt-3 text-[0.9rem] font-bold text-violet-500" style={{ "--atraso": "1100ms" } as CSSProperties}>
        {t("gas.restantes", { n: aviso.gasesRestantes })}
      </p>
    </MolduraDeComemoracao>
  );
}
