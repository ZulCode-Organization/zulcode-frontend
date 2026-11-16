"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePerfil } from "@/hooks/use-perfil";
import { cn } from "@/lib/utils";

/**
 * Anúncio do Google AdSense no site, para computador. O app Android tem os
 * seus (AdMob, em lib/anuncios.ts); aqui é só o navegador.
 *
 * Só aparece quando tudo isto vale:
 * - NEXT_PUBLIC_ADSENSE_CLIENT (o "ca-pub-…" da conta) e o bloco do lugar
 *   (NEXT_PUBLIC_ADSENSE_SLOT_HOME, _LICAO, _LOJA ou _PERFIL) estão definidos.
 *   Sem eles nada carrega: dá para publicar o código antes de a conta do
 *   AdSense ser aprovada;
 * - a pessoa não é PRO;
 * - não é o app instalado (no Android quem cuida é o AdMob);
 * - a tela é de computador (lg). No celular, o site fica sem anúncio.
 *
 * `NEXT_PUBLIC_ADSENSE_TESTE=1` marca os pedidos como teste (data-adtest):
 * o Google mostra o anúncio sem contar como impressão de verdade.
 */
export type LugarDoAnuncio = "home" | "licao" | "loja" | "perfil";

const CLIENTE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const BLOCOS: Record<LugarDoAnuncio, string | undefined> = {
  home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  licao: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LICAO,
  loja: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOJA,
  perfil: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PERFIL,
};
const TESTE = process.env.NEXT_PUBLIC_ADSENSE_TESTE === "1";

type JanelaComAdsense = Window & { adsbygoogle?: unknown[] };

/** O script do AdSense entra uma vez só, na primeira vez que algum anúncio aparece. */
function carregarScript(cliente: string) {
  if (document.querySelector("script[data-zc-adsense]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cliente)}`;
  script.dataset.zcAdsense = "1";
  document.head.appendChild(script);
}

/** O app instalado (Capacitor) se identifica no window; o site comum não tem isso. */
function ehAppInstalado() {
  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!capacitor?.isNativePlatform?.();
}

const COMPUTADOR = "(min-width: 1024px)";
function assinar(aoMudar: () => void) {
  const mq = window.matchMedia(COMPUTADOR);
  mq.addEventListener("change", aoMudar);
  return () => mq.removeEventListener("change", aoMudar);
}
/** Computador e site comum: no servidor a resposta é "não", e o anúncio só entra depois de montar. */
const noSiteDeComputador = () => window.matchMedia(COMPUTADOR).matches && !ehAppInstalado();
const noServidor = () => false;

export function AnuncioWeb({ lugar, className }: { lugar: LugarDoAnuncio; className?: string }) {
  const { perfil, loading } = usePerfil();
  const bloco = BLOCOS[lugar];
  const noSite = useSyncExternalStore(assinar, noSiteDeComputador, noServidor);
  const pedido = useRef(false);

  const mostrar = !!CLIENTE && !!bloco && noSite && !loading && !!perfil && !perfil.isPro;

  useEffect(() => {
    if (!mostrar || pedido.current || !CLIENTE) return;
    pedido.current = true;
    carregarScript(CLIENTE);
    try {
      const janela = window as JanelaComAdsense;
      (janela.adsbygoogle = janela.adsbygoogle || []).push({});
    } catch {
      // Bloqueador de anúncio ou script fora do ar: o espaço fica vazio, nada quebra.
    }
  }, [mostrar]);

  if (!mostrar) return null;

  return (
    <div className={cn("hidden lg:block", className)}>
      <p className="mb-1.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Publicidade</p>
      <ins
        className="adsbygoogle block overflow-hidden rounded-2xl"
        style={{ display: "block" }}
        data-ad-client={CLIENTE}
        data-ad-slot={bloco}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(TESTE ? { "data-adtest": "on" } : {})}
      />
    </div>
  );
}
