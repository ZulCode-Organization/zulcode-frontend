"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, Check, CreditCard, Feather, Mail, Minus, ShieldCheck, Sparkles } from "lucide-react";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { Rupee } from "@/components/shared/rupee";
import { SeloPro } from "@/components/shared/selo-pro";
import { Odometro } from "@/components/app-shell/barra-viva/odometro";
import { animar, CURVA, movimentoReduzido, parabola, variacao } from "@/lib/motion/movimento";
import {
  COMPARACAO,
  DESCONTO_ANUAL,
  DIAS_DE_TESTE,
  DIAS_DO_LEMBRETE,
  formatarBRL,
  precoDoPeriodo,
  type PeriodoCobranca,
} from "@/lib/pro/planos";
import { cn } from "@/lib/utils";
import { ARCO_DO_ZUL, ZulPro } from "./zul-pro";

export const GRADIENTE_PRO = "linear-gradient(120deg, #4f63e3 0%, #8a63e6 48%, #bd73e9 100%)";

/**
 * O palco de cada momento: um quadrado do tamanho que couber entre o título e
 * o botão. Tudo dentro dele é posicionado em porcentagem, então a cena inteira
 * cresce e encolhe junto, do celular ao monitor.
 */
function Palco({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-square", className)} style={{ width: "min(100%, 46dvh, 420px)" }}>
      {children}
    </div>
  );
}

/** Um número que troca uma vez, pouco depois de a tela abrir: 5 → ∞, +10 → +20. */
function useVirada(atrasoMs: number) {
  const [virou, setVirou] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVirou(true), movimentoReduzido() ? 0 : atrasoMs);
    return () => clearTimeout(id);
  }, [atrasoMs]);
  return virou;
}

/** A pílula com o número que vira — a mesma linguagem dos chips da barra de cima. */
function Pilula({ icone, antes, depois, virou, className }: { icone: ReactNode; antes: string; depois: string; virou: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "zc-pro-pilula inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[1.05rem] font-black text-white backdrop-blur-md",
        className,
      )}
    >
      {icone}
      <span key={virou ? "depois" : "antes"} className={cn("tabular-nums", virou && "zc-pro-virada")}>
        {virou ? depois : antes}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Apresentação                                                         */
/* ------------------------------------------------------------------ */

export function ArteApresentacao() {
  return (
    <Palco>
      <div className="zc-pro-chegada absolute inset-[10%]">
        <div className="zc-pro-flutua size-full">
          <ZulPro className="size-full" />
        </div>
      </div>
    </Palco>
  );
}

/* ------------------------------------------------------------------ */
/* Penas ilimitadas: as penas entram em órbita em volta do Zul           */
/* ------------------------------------------------------------------ */

const PENAS = 5;

export function ArtePenas() {
  const palcoRef = useRef<HTMLDivElement>(null);
  const penasRef = useRef<(HTMLSpanElement | null)[]>([]);
  const virou = useVirada(1500);

  useEffect(() => {
    const reduzido = movimentoReduzido();
    const inicio = performance.now();
    let quadro = 0;

    const desenhar = (agora: number) => {
      const palco = palcoRef.current;
      if (!palco) return;
      const largura = palco.clientWidth;
      const t = (agora - inicio) / 1000;
      // As penas chegam de longe e se acomodam na órbita: o raio começa
      // grande e encolhe com a mesma curva de "chega rápido, assenta devagar".
      const chegada = reduzido ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.2), 3);
      const raio = 1 + (1 - chegada) * 1.4;
      penasRef.current.forEach((pena, i) => {
        if (!pena) return;
        const angulo = (i / PENAS) * Math.PI * 2 + (reduzido ? 0.6 : t * 0.5 + 0.6);
        const x = Math.cos(angulo) * largura * 0.43 * raio;
        const y = Math.sin(angulo) * largura * 0.15 * raio + largura * 0.05;
        // Seno positivo é a metade da frente da órbita: maior, mais clara e
        // por cima do Zul. A de trás encolhe e passa por baixo dele.
        const frente = Math.sin(angulo);
        const escala = 0.74 + (frente + 1) * 0.15;
        pena.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${Math.cos(angulo) * 22}deg) scale(${escala})`;
        pena.style.zIndex = frente > 0 ? "3" : "1";
        pena.style.opacity = String((0.5 + (frente + 1) * 0.25) * chegada);
      });
      if (!reduzido) quadro = requestAnimationFrame(desenhar);
    };
    quadro = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(quadro);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Palco>
        <div ref={palcoRef} className="absolute inset-0">
          <div className="absolute inset-[22%] z-[2]">
            <div className="zc-pro-flutua size-full">
              <ZulPro className="size-full" />
            </div>
          </div>
          {Array.from({ length: PENAS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                penasRef.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 w-[13%] opacity-0 will-change-transform"
            >
              <Feather className="size-full fill-[#bd73e9] text-white drop-shadow-[0_0_10px_rgba(189,115,233,.9)]" strokeWidth={1.8} />
            </span>
          ))}
        </div>
      </Palco>
      <Pilula
        virou={virou}
        antes="5"
        depois="∞"
        icone={<Feather className="size-5 fill-[#bd73e9] text-white" strokeWidth={2} />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* XP em dobro: o 2× cai do céu e bate no horizonte                      */
/* ------------------------------------------------------------------ */

export function ArteXp() {
  const virou = useVirada(1250);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Palco>
        {[
          { left: "-6%", top: "8%", largura: "46%", atraso: 0.4 },
          { left: "52%", top: "2%", largura: "34%", atraso: 2.1 },
          { left: "10%", top: "56%", largura: "40%", atraso: 3.6 },
        ].map((c, i) => (
          <span
            key={i}
            className="zc-pro-cadente absolute h-[2px] rounded-full"
            style={{ left: c.left, top: c.top, width: c.largura, animationDelay: `${c.atraso}s` }}
          />
        ))}
        <span
          className="zc-pro-dois-x absolute left-1/2 top-[2%] z-[2] font-black leading-none"
          style={{
            fontSize: "min(15dvh, 7.5rem)",
            backgroundImage: ARCO_DO_ZUL,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          2×
        </span>
        <div className="absolute inset-x-[24%] bottom-[2%] top-[38%]">
          <div className="zc-pro-chegada size-full" style={{ animationDelay: "120ms" }}>
            <div className="zc-pro-flutua size-full">
              <ZulPro className="size-full" />
            </div>
          </div>
        </div>
      </Palco>
      <Pilula
        virou={virou}
        antes="+10 XP"
        depois="+20 XP"
        icone={<Sparkles className="size-5 text-amber-300" strokeWidth={2.4} />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ofensiva protegida: a chama vira um sol e o cometa não a apaga        */
/* ------------------------------------------------------------------ */

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
/** O quarto dia é a falta que o PRO cobriu. */
const DIA_PROTEGIDO = 3;

export function ArteOfensiva() {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <Palco>
        <span
          className="zc-pro-coroa absolute left-1/2 top-1/2 aspect-square w-[118%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,214,10,.55) 0%, rgba(255,138,0,.3) 30%, rgba(255,59,92,.1) 50%, transparent 66%)" }}
        />
        <span className="zc-pro-cometa absolute inset-0">
          <span
            className="absolute left-[-30%] top-[-4%] h-[3px] w-[46%] rotate-[35deg] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #fff)", boxShadow: "0 0 10px #fff" }}
          />
        </span>
        <span className="zc-pro-escudo absolute inset-[16%] rounded-full" />
        <div className="absolute inset-[22%]">
          <div className="zc-pro-chama size-full">
            <ChamaDupla className="size-full drop-shadow-[0_0_28px_rgba(255,138,0,.9)]" dias={100} />
          </div>
        </div>
      </Palco>
      <div className="flex gap-2">
        {SEMANA.map((dia, i) => (
          <span key={i} className="zc-pro-sobe flex flex-col items-center gap-1" style={{ animationDelay: `${500 + i * 70}ms` }}>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border",
                i === DIA_PROTEGIDO ? "border-transparent text-white" : "border-white/15 bg-white/10",
              )}
              style={i === DIA_PROTEGIDO ? { background: GRADIENTE_PRO, boxShadow: "0 0 18px rgba(189,115,233,.8)" } : undefined}
            >
              {i === DIA_PROTEGIDO ? (
                <ShieldCheck className="size-[18px]" strokeWidth={2.4} />
              ) : (
                <ChamaDupla className="size-[18px]" dias={100} />
              )}
            </span>
            <span className="text-[0.7rem] font-black text-white/55">{dia}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rupees em dobro: entra uma no buraco negro, saem duas                 */
/* ------------------------------------------------------------------ */

const DISCO: CSSProperties = {
  background: "conic-gradient(from 0deg, #ff8a00, #ff3b8d, #c026d3, #6366f1, #22d3ee, #6366f1, #c026d3, #ff3b8d, #ff8a00)",
};

/**
 * O buraco negro. O disco de acreção é um círculo com gradiente cônico que
 * gira, achatado por uma escala vertical — a rotação dentro da elipse é o que
 * faz o gás parecer girar em volta, e não a figura inteira rodar. A metade de
 * baixo do disco é repetida por cima do centro escuro, para o disco passar na
 * frente dele.
 */
function BuracoNegro() {
  const disco = (frente: boolean) => (
    <div className="absolute left-1/2 top-1/2 w-[150%]" style={{ transform: "translate(-50%, -50%) rotate(-12deg)" }}>
      <div
        className="aspect-square"
        style={{
          transform: "scaleY(0.3)",
          ...(frente ? { WebkitMaskImage: "linear-gradient(transparent 52%, #000 64%)", maskImage: "linear-gradient(transparent 52%, #000 64%)" } : {}),
        }}
      >
        <div className={cn("zc-pro-disco size-full rounded-full", frente ? "opacity-95 blur-[5px]" : "opacity-90 blur-[9px]")} style={DISCO} />
      </div>
    </div>
  );
  return (
    <>
      {disco(false)}
      <span
        className="absolute left-1/2 top-1/2 aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
        style={{ boxShadow: "0 0 0 3px rgba(255,255,255,.85), 0 0 34px 10px rgba(255,111,181,.7), 0 0 90px 30px rgba(138,99,230,.45)" }}
      />
      {disco(true)}
    </>
  );
}

export function ArteRupees() {
  const palcoRef = useRef<HTMLDivElement>(null);
  const entraRef = useRef<HTMLSpanElement>(null);
  const saiRef = useRef<(HTMLSpanElement | null)[]>([]);
  const claraoRef = useRef<HTMLSpanElement>(null);
  const virou = useVirada(1700);

  useEffect(() => {
    const w = palcoRef.current?.clientWidth ?? 300;
    const ciclo: KeyframeAnimationOptions = { duration: 3000, iterations: Infinity, delay: 500, fill: "both" };
    const p = (x: number, y: number, giro: number, escala: number) =>
      `translate(-50%, -50%) translate(${x * w}px, ${y * w}px) rotate(${giro}deg) scale(${escala})`;

    const animacoes = [
      // Uma rupee cai em espiral para dentro do disco e some no centro.
      animar(
        entraRef.current,
        [
          { offset: 0, opacity: 0, transform: p(-0.46, -0.36, -40, 1) },
          { offset: 0.06, opacity: 1, transform: p(-0.44, -0.34, -30, 1) },
          { offset: 0.22, opacity: 1, transform: p(-0.1, -0.24, 90, 0.8), easing: "ease-in" },
          { offset: 0.38, opacity: 1, transform: p(0, 0, 320, 0.12) },
          { offset: 0.4, opacity: 0, transform: p(0, 0, 340, 0.05) },
          { offset: 1, opacity: 0, transform: p(0, 0, 340, 0.05) },
        ],
        ciclo,
      ),
      // O centro devolve num clarão…
      animar(
        claraoRef.current,
        [
          { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(.3)" },
          { offset: 0.39, opacity: 0, transform: "translate(-50%, -50%) scale(.3)" },
          { offset: 0.44, opacity: 1, transform: "translate(-50%, -50%) scale(1)", easing: CURVA.assenta },
          { offset: 0.62, opacity: 0, transform: "translate(-50%, -50%) scale(1.7)" },
          { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1.7)" },
        ],
        ciclo,
      ),
      // …e saem duas, uma para cada lado.
      ...[-1, 1].map((lado, i) =>
        animar(
          saiRef.current[i],
          [
            { offset: 0, opacity: 0, transform: p(0, 0, 0, 0.1) },
            { offset: 0.42, opacity: 0, transform: p(0, 0, 0, 0.1) },
            { offset: 0.46, opacity: 1, transform: p(lado * 0.04, 0.02, 0, 0.4), easing: CURVA.assenta },
            { offset: 0.74, opacity: 1, transform: p(lado * 0.34, 0.3, lado * 14, 1.08) },
            { offset: 0.9, opacity: 1, transform: p(lado * 0.36, 0.32, lado * 10, 1) },
            { offset: 1, opacity: 0, transform: p(lado * 0.38, 0.36, lado * 10, 0.9) },
          ],
          ciclo,
        ),
      ),
    ];
    return () => animacoes.forEach((a) => a?.cancel());
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Palco>
        <div ref={palcoRef} className="absolute inset-0">
          <div className="absolute inset-[14%]">
            <BuracoNegro />
          </div>
          <span
            ref={claraoRef}
            className="absolute left-1/2 top-1/2 aspect-square w-[40%] rounded-full opacity-0"
            style={{ background: "radial-gradient(circle, #fff 0%, rgba(110,231,183,.8) 25%, rgba(110,231,183,0) 65%)" }}
          />
          <span ref={entraRef} className="absolute left-1/2 top-1/2 w-[13%] opacity-0">
            <Rupee className="size-full text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,.8)]" />
          </span>
          {/* Paradas no fim do gesto: é o que aparece com movimento reduzido. */}
          {[-1, 1].map((lado, i) => (
            <span
              key={lado}
              ref={(el) => {
                saiRef.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 w-[15%]"
              style={{ transform: `translate(-50%, -50%) translate(${lado * 240}%, 213%)` }}
            >
              <Rupee className="size-full text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,.9)]" />
            </span>
          ))}
        </div>
      </Palco>
      <Pilula
        virou={virou}
        antes="+5"
        depois="+10"
        icone={<Rupee className="size-5 text-emerald-400" />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Como funciona o teste                                                */
/* ------------------------------------------------------------------ */

export function ArteTeste() {
  const itens = [
    { Icone: Sparkles, titulo: "Hoje", texto: "Tudo do PRO liberado na hora" },
    { Icone: Mail, titulo: `Daqui a ${DIAS_DE_TESTE - DIAS_DO_LEMBRETE} dias`, texto: "Te lembramos por e-mail" },
    { Icone: Bell, titulo: "No último dia", texto: "Um aviso aqui no app" },
    { Icone: CreditCard, titulo: `Daqui a ${DIAS_DE_TESTE} dias`, texto: "Primeira cobrança. Cancele antes e não paga nada" },
  ];
  return (
    <ol className="relative w-full max-w-sm">
      {/* A linha se desenha de cima para baixo, atrás dos pontos. */}
      <span className="zc-pro-linha absolute bottom-7 left-[21px] top-7 w-[2px] origin-top bg-white/20" />
      {itens.map(({ Icone, titulo, texto }, i) => (
        <li key={titulo} className="zc-pro-sobe relative flex items-start gap-4 pb-7 last:pb-0" style={{ animationDelay: `${150 + i * 260}ms` }}>
          <span
            className="zc-pro-ponto relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white"
            style={{ background: i === 0 ? GRADIENTE_PRO : "#1a1240", animationDelay: `${150 + i * 260}ms` }}
          >
            <Icone className="size-5" strokeWidth={2.2} />
          </span>
          <span className="pt-1">
            <b className="block text-[1rem] font-black text-white">{titulo}</b>
            <span className="text-[0.9rem] leading-snug text-white/65">{texto}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Grátis × PRO                                                         */
/* ------------------------------------------------------------------ */

function Celula({ valor, pro }: { valor: string | boolean; pro?: boolean }) {
  if (typeof valor === "string") return <span className={cn("text-[0.82rem] font-black", pro ? "text-white" : "text-white/55")}>{valor}</span>;
  return valor ? (
    <Check className={cn("size-5", pro ? "text-white" : "text-white/55")} strokeWidth={3} />
  ) : (
    <Minus className="size-5 text-white/25" />
  );
}

export function ArteComparacao() {
  return (
    <div className="relative w-full max-w-sm">
      {/* A coluna do PRO acende por trás das linhas, como uma constelação. */}
      <span
        className="zc-pro-coluna absolute bottom-0 right-0 top-0 w-[30%] overflow-hidden rounded-2xl"
        style={{ background: GRADIENTE_PRO, boxShadow: "0 0 40px rgba(189,115,233,.45)" }}
      >
        <span className="zc-pro-brilho-coluna absolute inset-x-0 h-1/3" />
      </span>
      <div className="relative grid grid-cols-[1fr_28%_30%] items-center">
        <span />
        <span className="py-3 text-center text-[0.72rem] font-black uppercase tracking-[0.1em] text-white/55">Grátis</span>
        <span className="flex justify-center py-3">
          <SeloPro className="h-5" />
        </span>
        {COMPARACAO.map((linha, i) => (
          <div key={linha.recurso} className="contents">
            <span className="zc-pro-sobe border-t border-white/10 py-3.5 text-[0.9rem] font-bold text-white" style={{ animationDelay: `${200 + i * 110}ms` }}>
              {linha.recurso}
            </span>
            <span className="zc-pro-sobe flex justify-center border-t border-white/10 py-3.5 text-center" style={{ animationDelay: `${200 + i * 110}ms` }}>
              <Celula valor={linha.gratis} />
            </span>
            <span className="zc-pro-sobe flex justify-center border-t border-white/15 px-1 py-3.5 text-center" style={{ animationDelay: `${260 + i * 110}ms` }}>
              <Celula valor={linha.pro} pro />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Escolha do plano                                                     */
/* ------------------------------------------------------------------ */

/** Preço em casas que rolam, como os números da barra de cima. */
function PrecoRolante({ valor, anterior, versao }: { valor: number; anterior?: number; versao: number }) {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  const reaisAntes = anterior === undefined ? undefined : Math.floor(anterior);
  const centavosAntes = anterior === undefined ? undefined : Math.round((anterior - Math.floor(anterior)) * 100);
  return (
    <span className="inline-flex items-baseline font-black tabular-nums">
      R$&nbsp;
      <Odometro valor={reais} anterior={reaisAntes} versao={versao} />,
      {centavos < 10 ? (
        <span>{String(centavos).padStart(2, "0")}</span>
      ) : (
        <Odometro valor={centavos} anterior={centavosAntes} versao={versao} atraso={60} />
      )}
    </span>
  );
}

export function ArtePlano({
  periodo,
  onPeriodo,
  comTeste,
}: {
  periodo: PeriodoCobranca;
  onPeriodo: (p: PeriodoCobranca) => void;
  comTeste: boolean;
}) {
  const anual = precoDoPeriodo("anual");
  const mensal = precoDoPeriodo("mensal");
  const [mudanca, setMudanca] = useState<{ versao: number; anterior?: number }>({ versao: 0 });
  const escolhido = periodo === "anual" ? anual : mensal;

  const escolher = (novo: PeriodoCobranca) => {
    if (novo === periodo) return;
    setMudanca((m) => ({ versao: m.versao + 1, anterior: escolhido.porMes }));
    onPeriodo(novo);
  };

  const opcao = (id: PeriodoCobranca, titulo: string, detalhe: string, selo?: string) => {
    const ativo = periodo === id;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={ativo}
        onClick={() => escolher(id)}
        className={cn(
          "zc-pro-sobe zc-press relative w-full rounded-2xl border-2 p-4 text-left transition-[border-color,box-shadow,background-color] duration-300",
          ativo ? "border-transparent" : "border-white/15 bg-white/[0.05] hover:border-white/30",
        )}
        style={ativo ? { background: GRADIENTE_PRO, boxShadow: "0 0 34px rgba(189,115,233,.55)" } : undefined}
      >
        {selo && (
          <span className="absolute -top-3 right-4 rounded-full bg-white px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-violet-700">
            {selo}
          </span>
        )}
        <span className="flex items-center justify-between gap-3">
          <span>
            <b className="block text-[1rem] font-black text-white">{titulo}</b>
            <span className="text-[0.82rem] text-white/75">{detalhe}</span>
          </span>
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
              ativo ? "border-white bg-white text-violet-700" : "border-white/35",
            )}
          >
            {ativo && <Check className="size-4" strokeWidth={3.4} />}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3" role="radiogroup" aria-label="Período da assinatura">
      <p className="mb-2 text-center text-white">
        <span className="block text-[2.6rem] leading-none">
          <PrecoRolante valor={escolhido.porMes} anterior={mudanca.anterior} versao={mudanca.versao} />
        </span>
        <span className="mt-1 block text-[0.85rem] font-bold text-white/60">por mês</span>
      </p>
      {opcao("anual", "Anual", `${formatarBRL(anual.total)} por ano`, `Economize ${Math.round(DESCONTO_ANUAL * 100)}%`)}
      {opcao("mensal", "Mensal", `${formatarBRL(mensal.total)} por mês`)}
      <p className="mt-1 text-center text-[0.82rem] leading-snug text-white/55">
        {comTeste
          ? `Hoje você paga R$ 0,00. A primeira cobrança é daqui a ${DIAS_DE_TESTE} dias.`
          : "A cobrança acontece hoje."}{" "}
        Cancele quando quiser.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Boas-vindas: a supernova                                             */
/* ------------------------------------------------------------------ */

const CORES_DO_CONFETE = ["#22d3ee", "#4f63e3", "#8a63e6", "#c026d3", "#ff6fb5", "#ffd60a", "#ffffff"];

export function ArteBoasVindas() {
  const palcoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const palco = palcoRef.current;
    if (!palco || movimentoReduzido()) return;
    const w = palco.clientWidth;
    const pecas: HTMLSpanElement[] = [];
    const animacoes: (Animation | null)[] = [];
    for (let i = 0; i < 70; i++) {
      const peca = document.createElement("span");
      const largura = 5 + variacao(i, 1) * 5;
      Object.assign(peca.style, {
        position: "absolute",
        left: "50%",
        top: "48%",
        width: `${largura}px`,
        height: `${largura * (1.4 + variacao(i, 2))}px`,
        borderRadius: variacao(i, 3) > 0.7 ? "50%" : "2px",
        background: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length],
        pointerEvents: "none",
      });
      palco.appendChild(peca);
      pecas.push(peca);
      // Sai do centro em todas as direções, com gravidade: a parábola é
      // calculada em quadros, senão o confete deslizaria em linha reta.
      const angulo = variacao(i, 4) * Math.PI * 2;
      const forca = w * (0.45 + variacao(i, 5) * 0.75);
      const pontos = parabola(Math.cos(angulo) * forca, Math.sin(angulo) * forca - w * 0.35, w * 1.1, 16);
      const giro = (variacao(i, 6) - 0.5) * 1080;
      animacoes.push(
        animar(
          peca,
          pontos.map(({ x, y, t }) => ({
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${giro * t}deg) rotateX(${t * 720}deg)`,
            opacity: t > 0.8 ? (1 - t) * 5 : 1,
          })),
          { duration: 1900 + variacao(i, 7) * 900, delay: 260 + variacao(i, 8) * 160, easing: "linear", fill: "both" },
        ),
      );
    }
    return () => {
      animacoes.forEach((a) => a?.cancel());
      pecas.forEach((p) => p.remove());
    };
  }, []);

  return (
    <Palco>
      <div ref={palcoRef} className="absolute inset-0">
        <span
          className="zc-pro-clarao absolute left-1/2 top-1/2 aspect-square w-[220%] rounded-full"
          style={{ background: "radial-gradient(circle, #fff 0%, #ffd6f5 6%, rgba(255,111,181,.6) 15%, rgba(138,99,230,.38) 30%, transparent 56%)" }}
        />
        <span
          className="zc-pro-onda absolute left-1/2 top-1/2 aspect-square w-[60%] rounded-full"
          style={{ boxShadow: "0 0 0 2px rgba(255,255,255,.85), 0 0 40px 8px rgba(189,115,233,.7)" }}
        />
        <div className="absolute inset-[14%]">
          <div className="zc-pro-nasce size-full">
            <div className="zc-pro-flutua size-full">
              <ZulPro className="size-full" />
            </div>
          </div>
        </div>
      </div>
    </Palco>
  );
}
