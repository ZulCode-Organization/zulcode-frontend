"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Palette, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  estadoDosWidgets, fixarWidget, mudarEstiloDosWidgets, previaDoWidget, WIDGET_ATUALIZADO,
  type EstadoDosWidgets, type EstiloDosWidgets, type TipoDeWidget,
} from "@/lib/widget-ofensiva";
import { Grupo, LinhaDeEscolha, Opcao } from "./linhas";

/** Os widgets e o tamanho em que aparecem no seletor do Android (dp). */
const TIPOS: { tipo: TipoDeWidget; largura: number; altura: number }[] = [
  { tipo: "ofensiva", largura: 160, altura: 170 },
  { tipo: "semana", largura: 330, altura: 170 },
  { tipo: "zul", largura: 330, altura: 170 },
];
const ESTILOS: EstiloDosWidgets[] = ["auto", "claro", "escuro", "azul"];

/** O visual da prévia: o escolhido; no automático, o tema que o app mostra agora. */
function visualDaPrevia(estilo: EstiloDosWidgets) {
  if (estilo !== "auto") return estilo;
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

/**
 * Os widgets nas Configurações: cada um com a prévia (desenhada pelo próprio
 * celular, com a ofensiva de verdade), o botão de pôr na tela inicial e o
 * visual de todos.
 *
 * Só existe no app Android: no navegador e num APK anterior aos widgets novos
 * a seção não aparece.
 */
export function GrupoDeWidgets() {
  const t = useTranslations("configuracoes");
  const [estado, setEstado] = useState<EstadoDosWidgets | null>(null);
  const [previas, setPrevias] = useState<Partial<Record<TipoDeWidget, string>>>({});
  const espera = useRef<ReturnType<typeof setInterval> | null>(null);
  const estilo = useRef<EstiloDosWidgets>("auto");

  const desenhar = useCallback(async (escolhido: EstiloDosWidgets) => {
    estilo.current = escolhido;
    const visual = visualDaPrevia(escolhido);
    const imagens = await Promise.all(TIPOS.map(({ tipo, largura, altura }) => previaDoWidget(tipo, largura, altura, visual)));
    setPrevias(Object.fromEntries(TIPOS.map(({ tipo }, i) => [tipo, imagens[i] ?? undefined])));
  }, []);

  useEffect(() => {
    let vivo = true;
    void estadoDosWidgets().then((lido) => {
      if (!vivo || !lido) return;
      setEstado(lido);
      void desenhar(lido.estilo);
    });
    // O perfil pode chegar depois da primeira prévia: com ele, o desenho é refeito.
    const aoAtualizar = () => void desenhar(estilo.current);
    window.addEventListener(WIDGET_ATUALIZADO, aoAtualizar);
    return () => {
      vivo = false;
      window.removeEventListener(WIDGET_ATUALIZADO, aoAtualizar);
      if (espera.current) clearInterval(espera.current);
    };
  }, [desenhar]);

  /**
   * O lançador mostra a confirmação por cima do app e não avisa quando a
   * pessoa aceita; então o estado é relido por alguns segundos.
   */
  const adicionar = async (tipo: TipoDeWidget) => {
    if (!(await fixarWidget(tipo))) return;
    if (espera.current) clearInterval(espera.current);
    let voltas = 0;
    espera.current = setInterval(async () => {
      voltas += 1;
      const lido = await estadoDosWidgets();
      if (lido) setEstado(lido);
      if (voltas >= 15 || (lido && lido.naTela[tipo] > (estado?.naTela[tipo] ?? 0))) {
        if (espera.current) clearInterval(espera.current);
      }
    }, 1500);
  };

  const escolher = async (escolhido: EstiloDosWidgets) => {
    const novo = await mudarEstiloDosWidgets(escolhido);
    if (!novo) return;
    setEstado(novo);
    void desenhar(escolhido);
  };

  if (!estado) return null;

  return (
    <Grupo titulo={t("grupos.widgets")}>
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <p className="text-[0.8rem] leading-snug text-muted-foreground">{t("widgets.descricao")}</p>
        <div className="-mx-4 mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5">
          {TIPOS.map(({ tipo }) => {
            const naTela = estado.naTela[tipo] > 0;
            return (
              <div key={tipo} className="flex w-60 shrink-0 snap-start flex-col rounded-2xl border border-border bg-muted/40 p-3">
                <div className="grid h-28 place-items-center">
                  {previas[tipo] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- PNG gerado pelo celular, em data URL
                    <img src={previas[tipo]} alt="" className="max-h-28 w-auto max-w-full drop-shadow-sm" />
                  ) : (
                    <span className="h-24 w-full animate-pulse rounded-xl bg-muted" />
                  )}
                </div>
                <p className="mt-3 text-[0.88rem] font-black">{t(`widgets.tipos.${tipo}.nome`)}</p>
                <p className="mt-0.5 flex-1 text-[0.75rem] leading-snug text-muted-foreground">{t(`widgets.tipos.${tipo}.descricao`)}</p>
                {naTela ? (
                  <span className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3.5" strokeWidth={3} />
                    {t("widgets.naTela")}
                  </span>
                ) : estado.podeFixar ? (
                  <button
                    type="button"
                    onClick={() => void adicionar(tipo)}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
                  >
                    <Plus className="size-3.5" strokeWidth={3} />
                    {t("widgets.adicionar")}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        {!estado.podeFixar && <p className="mt-3 text-[0.75rem] leading-snug text-muted-foreground">{t("widgets.comoAdicionar")}</p>}
      </div>
      <LinhaDeEscolha Icone={Palette} titulo={t("widgets.estilo.titulo")} descricao={t("widgets.estilo.descricao")}>
        <div role="radiogroup" aria-label={t("widgets.estilo.titulo")} className="grid grid-cols-4 gap-2">
          {ESTILOS.map((opcao) => (
            <Opcao key={opcao} ativa={estado.estilo === opcao} aoEscolher={() => void escolher(opcao)}>
              <span className="text-[0.78rem] font-black">{t(`widgets.estilo.${opcao}`)}</span>
            </Opcao>
          ))}
        </div>
      </LinhaDeEscolha>
    </Grupo>
  );
}
