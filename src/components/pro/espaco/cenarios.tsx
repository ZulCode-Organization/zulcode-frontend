"use client";

import type { CSSProperties, ReactNode } from "react";

export type Cena = "nebulosa" | "planeta" | "sol" | "buraco" | "supernova";

/**
 * Os fundos do PRO: o espaço no lugar das nuvens.
 *
 * Tudo é gradiente, desfoque e transformação — nenhuma forma desenhada à mão.
 * Os cinco ficam montados o tempo todo e só o ativo aparece: trocar de cena é
 * uma transição de opacidade e escala (a câmera chega perto do que entra e se
 * afasta do que sai), sem desmontar nada no meio do movimento.
 *
 * O que é o assunto de cada tela (o buraco negro, o sol, a supernova) não
 * mora aqui, e sim na arte da própria tela: assim as rupees, a chama e o Zul
 * ficam alinhados com ele em qualquer tamanho de tela.
 */
export function Cenarios({ cena }: { cena: Cena }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Camada ativa={cena === "nebulosa"}>
        <Nebulosa />
      </Camada>
      <Camada ativa={cena === "planeta"}>
        <Nebulosa intensidade={0.55} />
        <Planeta />
      </Camada>
      <Camada ativa={cena === "sol"}>
        <Gas x="50%" y="36%" tamanho="92vmax" cor="#ff8a00" opacidade={0.3} />
        <Gas x="24%" y="74%" tamanho="70vmax" cor="#c026d3" opacidade={0.24} atraso={-7} />
        <Gas x="82%" y="20%" tamanho="50vmax" cor="#4f63e3" opacidade={0.22} atraso={-12} />
      </Camada>
      <Camada ativa={cena === "buraco"}>
        <Nebulosa intensidade={0.4} />
      </Camada>
      <Camada ativa={cena === "supernova"}>
        <Nebulosa intensidade={0.7} />
        <Gas x="50%" y="40%" tamanho="80vmax" cor="#ff6fb5" opacidade={0.3} atraso={-3} />
      </Camada>
    </div>
  );
}

function Camada({ ativa, children }: { ativa: boolean; children: ReactNode }) {
  return (
    <div className="zc-pro-camada absolute inset-0" data-ativa={ativa}>
      {children}
    </div>
  );
}

/** Uma mancha de gás: um gradiente radial desfocado que deriva devagar. */
function Gas({ x, y, tamanho, cor, opacidade, atraso = 0 }: { x: string; y: string; tamanho: string; cor: string; opacidade: number; atraso?: number }) {
  const estilo: CSSProperties = {
    left: x,
    top: y,
    width: tamanho,
    height: `calc(${tamanho} * 0.72)`,
    background: `radial-gradient(closest-side, ${cor}, transparent)`,
    opacity: opacidade,
    animationDelay: `${atraso}s`,
  };
  return <span className="zc-pro-gas absolute rounded-full" style={estilo} />;
}

/** As cores da marca viram gás: o azul, o lilás e o rosa do card do PRO. */
function Nebulosa({ intensidade = 1 }: { intensidade?: number }) {
  const f = intensidade;
  return (
    <>
      <Gas x="22%" y="26%" tamanho="72vmax" cor="#4f63e3" opacidade={0.5 * f} />
      <Gas x="78%" y="44%" tamanho="78vmax" cor="#bd73e9" opacidade={0.42 * f} atraso={-9} />
      <Gas x="48%" y="80%" tamanho="86vmax" cor="#c026d3" opacidade={0.3 * f} atraso={-17} />
      <Gas x="84%" y="12%" tamanho="44vmax" cor="#22d3ee" opacidade={0.2 * f} atraso={-4} />
    </>
  );
}

/** O horizonte de um planeta no lugar do chão de nuvens, com a via láctea atrás. */
function Planeta() {
  return (
    <>
      <span
        className="absolute"
        style={{
          left: "-40%",
          right: "-40%",
          top: "-12%",
          height: "70%",
          transform: "rotate(-24deg)",
          background:
            "linear-gradient(90deg, transparent 20%, rgba(189,115,233,.24) 44%, rgba(255,255,255,.14) 50%, rgba(79,99,227,.24) 56%, transparent 80%)",
          filter: "blur(18px)",
        }}
      />
      <span
        className="zc-pro-planeta absolute left-1/2 aspect-square rounded-full"
        style={{
          width: "max(170vw, 1100px)",
          top: "76%",
          background: "radial-gradient(circle at 50% 0%, #8a63e6 0%, #4f63e3 9%, #1d1650 26%, #0c0824 46%)",
          boxShadow: "0 -8px 50px 10px rgba(189,115,233,.6), inset 0 8px 20px rgba(255,255,255,.35)",
        }}
      />
    </>
  );
}
