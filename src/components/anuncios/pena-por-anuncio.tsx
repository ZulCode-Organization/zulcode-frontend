"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { anunciosDisponiveis, assistirParaGanharPena } from "@/lib/anuncios";
import { cn } from "@/lib/utils";

type Mensagem = { texto: string; erro: boolean } | null;

/**
 * "Assistir anúncio e ganhar 1 pena". Só aparece no app Android com o AdMob;
 * quem não tem como ver anúncio não vê o botão. Quem é PRO nem chega aqui:
 * as penas dele são infinitas.
 *
 * `botao` é o botão grande das telas sem penas; `linha` é a linha do painel de
 * penas, no mesmo formato dos itens da loja.
 */
export function PenaPorAnuncio({ visual, aoGanhar }: { visual: "botao" | "linha"; aoGanhar: (vidas: number) => void }) {
  const t = useTranslations("anuncios.pena");
  const [disponivel, setDisponivel] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useEffect(() => {
    let vivo = true;
    void anunciosDisponiveis().then((sim) => vivo && setDisponivel(sim));
    return () => {
      vivo = false;
    };
  }, []);

  if (!disponivel) return null;

  const assistir = async () => {
    if (ocupado) return;
    setOcupado(true);
    setMensagem(null);
    const resultado = await assistirParaGanharPena();
    setOcupado(false);
    if (!("motivo" in resultado)) {
      setMensagem({ texto: t("ganhou"), erro: false });
      aoGanhar(resultado.vidas);
      return;
    }
    const { motivo } = resultado;
    if (motivo === "semAnuncio" || motivo === "pro") return;
    setMensagem({ texto: t(motivo), erro: motivo !== "cancelado" });
  };

  const aviso = mensagem && (
    <p
      role="status"
      className={cn(
        "animate-pop-in rounded-xl px-3 py-2.5 text-center text-[0.8rem] font-black",
        mensagem.erro ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      )}
    >
      {mensagem.texto}
    </p>
  );

  if (visual === "botao") {
    return (
      <div className="mt-3 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => void assistir()}
          disabled={ocupado}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-3.5 text-sm font-black text-foreground disabled:opacity-70"
        >
          {ocupado ? <Loader2 className="size-4 animate-spin" /> : <Clapperboard className="size-4 text-primary" />}
          {ocupado ? t("carregando") : t("botao")}
        </button>
        {aviso}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3.5 rounded-[18px] border border-border bg-card px-4 py-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
          <Clapperboard className="size-6 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.92rem] font-black leading-snug text-foreground">{t("titulo")}</p>
          <p className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground">{ocupado ? t("carregando") : t("descricao")}</p>
        </div>
        <button
          type="button"
          onClick={() => void assistir()}
          disabled={ocupado}
          className="zc-press flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-[0.82rem] font-black text-primary disabled:opacity-60"
        >
          {ocupado && <Loader2 className="size-4 animate-spin" />}
          {t("gratis")}
        </button>
      </div>
      {aviso}
    </div>
  );
}
