"use client";

/* eslint-disable @next/next/no-img-element -- O ícone é o mesmo arquivo que a
   splash do Android usa, carregado de /public sem passar pelo otimizador: na
   abertura ele precisa estar na tela no primeiro quadro, e o componente do
   Next entrega a imagem num segundo momento. */

import { useEffect, useState, useSyncExternalStore } from "react";

/** Quanto tempo a abertura fica na tela antes de começar a sair, e quanto dura a saída. */
const PERMANENCIA = 1500;
const SAIDA = 320;
/** Com "menos movimento" ligado no celular, a marca só aparece e já sai. */
const PERMANENCIA_REDUZIDA = 600;

/**
 * A abertura do app: o Zul aparece e o nome se escreve ao lado dele.
 *
 * O fundo é o do tema — o mesmo `--background` do app e o mesmo da splash que
 * o Android mostra antes disto. São três telas em sequência (a splash do
 * sistema, esta e o app), todas da mesma cor: a pessoa vê uma só, com a marca
 * entrando por cima.
 *
 * Aparece a cada abertura do app. Numa aba de navegador aparece uma vez por
 * sessão: ali a pessoa navega entre páginas o tempo todo, e repetir a cada
 * visita cansaria.
 */
export function Abertura() {
  // No servidor a abertura sempre entra no HTML; é o que garante que ela já
  // esteja na tela no primeiro quadro, antes de o app aparecer por baixo. Só
  // no navegador dá para saber se ela deve mesmo ficar, e aí ou fica, ou sai
  // nesse mesmo instante — sem piscar, porque o fundo dela é o do app.
  const fica = useSyncExternalStore(assinar, deveAparecer, () => true);
  const [fase, setFase] = useState<"abrindo" | "saindo">("abrindo");
  const [acabou, setAcabou] = useState(false);

  useEffect(() => {
    if (!fica) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const espera = reduzido ? PERMANENCIA_REDUZIDA : PERMANENCIA;
    const comeco = setTimeout(() => setFase("saindo"), espera);
    const fim = setTimeout(() => setAcabou(true), espera + SAIDA);
    return () => {
      clearTimeout(comeco);
      clearTimeout(fim);
    };
  }, [fica]);

  if (!fica || acabou) return null;

  return (
    <div
      aria-hidden
      className={`zc-abertura${fase === "saindo" ? " zc-abertura-saindo" : ""}`}
      style={{ "--zc-abertura-saida": `${SAIDA}ms` } as React.CSSProperties}
    >
      <div className="zc-abertura-marca">
        <img src="/icon-only.svg" alt="" width={112} height={112} className="zc-abertura-icone" />
        {/* O nome é revelado por uma máscara que anda da esquerda para a
            direita, como se estivesse sendo escrito; o `span` de dentro não se
            mexe, senão as letras entrariam tortas. */}
        <span className="zc-abertura-nome">
          <span>ZulCode</span>
        </span>
      </div>
    </div>
  );
}

/** A abertura não muda de ideia depois de decidida; não há o que assinar. */
const assinar = () => () => {};

let decidido: boolean | null = null;

/**
 * Dentro do app, toda vez. No navegador, uma vez por aba.
 *
 * A resposta é guardada: `useSyncExternalStore` chama isto a cada desenho, e
 * a marca no `sessionStorage` tornaria a segunda resposta diferente da
 * primeira.
 */
function deveAparecer() {
  if (decidido !== null) return decidido;
  decidido = decidir();
  return decidido;
}

function decidir() {
  try {
    const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (capacitor?.isNativePlatform?.()) return true;
    if (sessionStorage.getItem("zc-abertura") === "vista") return false;
    sessionStorage.setItem("zc-abertura", "vista");
    return true;
  } catch {
    // Sem sessionStorage (aba anônima com armazenamento bloqueado) a abertura
    // simplesmente não aparece: é enfeite, não pode atrapalhar a entrada.
    return false;
  }
}
