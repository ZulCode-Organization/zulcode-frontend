"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A arte do topo do PRO, em duas camadas.
 *
 * O ideal é o fundo sem o Zul e o Zul por cima, solto: só assim ele pode
 * correr enquanto o raio fica parado. Essas duas peças moram em `public/pro/`:
 *
 *   fundo-pro.png         o roxo com os raios e o "PRO", sem o mascote
 *   mascote-correndo.png  o Zul correndo, com fundo transparente
 *
 * Enquanto elas não existirem, a tela cai na arte que já vem no projeto — o
 * mesmo banner, porém com o Zul embutido nele. Aí a camada do mascote não é
 * desenhada, senão apareceriam dois papagaios.
 *
 * A regra é as duas juntas ou nenhuma: se só uma chegar, o resultado seria ou
 * um fundo com dois Zuls, ou um fundo sem Zul nenhum e sem mascote.
 */
const FUNDO_NOVO = "/pro/fundo-pro.png";
const MASCOTE_NOVO = "/pro/mascote-correndo.png";

/** A arte pronta que já vem no projeto, com o mascote embutido. */
const FUNDO_RESERVA_LARGO = "/banner/banner-pro.png";
const FUNDO_RESERVA_ALTO = "/banner/banner-pro-mobile.png";

export function HeroPro({ className }: { className?: string }) {
  const [temArteNova, setTemArteNova] = useState(true);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {temArteNova ? (
        <Image
          src={FUNDO_NOVO}
          alt=""
          fill
          priority
          sizes="100vw"
          onError={() => setTemArteNova(false)}
          className="object-cover object-center"
        />
      ) : (
        <>
          {/* A reserva alta (2:1) no celular e a larga (5:1) no computador: a
              mesma arte cortada pro formato de cada tela, em vez de uma só
              esticada nas duas. */}
          <Image src={FUNDO_RESERVA_ALTO} alt="" fill priority sizes="100vw" className="object-cover object-center sm:hidden" />
          <Image src={FUNDO_RESERVA_LARGO} alt="" fill priority sizes="100vw" className="hidden object-cover object-center sm:block" />
        </>
      )}

      {/* Véu escuro: sem ele o texto branco cai em cima do branco do raio e
          some. Mais forte embaixo, que é onde os planos começam. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0414]/70 via-[#0b0414]/45 to-[#0b0414]" />
    </div>
  );
}

/**
 * O Zul correndo, solto por cima do fundo.
 *
 * Só aparece quando a arte nova existe: a reserva já traz o mascote desenhado
 * dentro dela, e desenhar outro por cima daria dois.
 *
 * A corrida é sugerida por dois movimentos somados: o corpo sobe e desce de
 * leve, e a sombra encolhe no mesmo compasso. Sombra parada com corpo em
 * movimento é o que faz a animação parecer recortada.
 */
export function MascotePro({ className }: { className?: string }) {
  const [existe, setExiste] = useState(true);

  if (!existe) return null;

  return (
    <span className={cn("relative inline-flex items-end justify-center", className)}>
      <span className="zc-pro-sombra absolute bottom-0 h-3 w-3/5 rounded-[50%] bg-violet-950/60 blur-md" aria-hidden />
      <Image
        src={MASCOTE_NOVO}
        alt=""
        width={520}
        height={520}
        priority
        onError={() => setExiste(false)}
        className="zc-pro-corre relative w-full select-none object-contain"
      />
    </span>
  );
}
