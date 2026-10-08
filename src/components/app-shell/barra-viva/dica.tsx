"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Fuel } from "lucide-react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { faixaDaChama } from "@/components/shared/chama-dupla";
import { INTERVALO_DA_PENA_MS, progressoDaRecarga } from "./barra-recarga";

/** Quanto o mouse precisa parar em cima para a dica abrir. Menos que isso e
 *  ela pisca em quem só está passando a caminho de outro lugar. */
const ESPERA_MS = 320;
const LARGURA = 232;

type Posicao = { x: number; y: number; seta: number };

/**
 * 12. A dica que responde sem abrir painel.
 *
 * Só para mouse: no toque não existe "passar por cima", e o primeiro toque
 * tem de abrir o painel, não uma dica. Fecha ao apertar o chip, ao sair dele
 * e quando o painel do mesmo chip está aberto — duas camadas dizendo a mesma
 * coisa seria ruído.
 */
export function useDica(desligada: boolean) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpar = () => {
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = null;
  };

  useEffect(() => () => {
    if (relogio.current) clearTimeout(relogio.current);
  }, []);

  const handlers = {
    onPointerEnter: (evento: React.PointerEvent<HTMLElement>) => {
      if (evento.pointerType !== "mouse" || desligada) return;
      limpar();
      const alvo = evento.currentTarget;
      relogio.current = setTimeout(() => {
        const r = alvo.getBoundingClientRect();
        const centro = r.left + r.width / 2;
        // Puxada para dentro da janela; a seta continua no centro do chip.
        const x = Math.min(Math.max(centro, LARGURA / 2 + 12), window.innerWidth - LARGURA / 2 - 12);
        setPosicao({ x, y: r.bottom + 10, seta: centro - x });
      }, ESPERA_MS);
    },
    onPointerLeave: () => {
      limpar();
      setPosicao(null);
    },
    onPointerDown: () => {
      limpar();
      setPosicao(null);
    },
  };

  return { posicao: desligada ? null : posicao, handlers };
}

export function Dica({ posicao, children }: { posicao: Posicao | null; children: ReactNode }) {
  if (!posicao || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="tooltip"
      className="zc-dica pointer-events-none fixed z-[65] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
      style={{ left: posicao.x, top: posicao.y, width: LARGURA, ["--zc-seta" as string]: `${posicao.seta}px` }}
    >
      {children}
    </div>,
    document.body,
  );
}

function Rodape({ tecla }: { tecla: string }) {
  return (
    <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[0.68rem] font-bold text-muted-foreground">
      <span>Clique no número → Loja</span>
      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] font-black text-foreground">{tecla}</kbd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ofensiva — com a semana (13)
// ---------------------------------------------------------------------------

const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];

function chaveDoDia(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

/** Os sete últimos dias, terminando hoje. A sequência é contada de trás para
 *  frente a partir do último dia aceso: hoje, se já estudou; ontem, se não —
 *  senão uma sequência de 5 que ainda não foi feita hoje pintaria hoje e
 *  esqueceria o quinto dia. */
function Semana({ dias, acesa, protegidos }: { dias: number; acesa: boolean; protegidos: string[] }) {
  const [hoje] = useState(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  });
  const faixa = faixaDaChama(dias);
  const comProtecao = new Set(protegidos);
  const ultimoAceso = new Date(hoje);
  if (!acesa) ultimoAceso.setDate(hoje.getDate() - 1);
  const acesos = new Set<string>();
  for (let voltar = 0; voltar < Math.min(dias, 8); voltar += 1) {
    const data = new Date(ultimoAceso);
    data.setDate(ultimoAceso.getDate() - voltar);
    acesos.add(chaveDoDia(data));
  }

  const semana = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - (6 - indice));
    return data;
  });

  return (
    <div className="mt-2.5 grid grid-cols-7 gap-1">
      {semana.map((data, indice) => {
        const chave = chaveDoDia(data);
        const protegido = comProtecao.has(chave);
        const aceso = acesos.has(chave) || protegido;
        const ehHoje = indice === 6;
        return (
          <div key={chave} className="flex flex-col items-center gap-1">
            <span className={cn("text-[0.6rem] font-black", ehHoje ? "text-foreground" : "text-muted-foreground")}>
              {LETRAS[data.getDay()]}
            </span>
            <span
              className={cn(
                "zc-dia grid size-5 place-items-center rounded-full",
                protegido ? "bg-violet-600" : aceso ? faixa.fundo : "bg-muted",
                ehHoje && !aceso && "ring-2 ring-inset ring-primary/60",
              )}
              style={{ animationDelay: `${indice * 35}ms` }}
            >
              {protegido && <Fuel className="size-3 text-emerald-300" strokeWidth={2.6} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DicaOfensiva({
  dias, acesa, protegidos, recorde, emRisco, comGas,
}: {
  dias: number;
  acesa: boolean;
  protegidos: string[];
  recorde: number;
  emRisco: boolean;
  /** Há gás guardado: a chama está roxa, e a dica não pode chamá-la de azul. */
  comGas: boolean;
}) {
  const faixa = faixaDaChama(dias);
  return (
    <>
      <p className="text-[0.85rem] font-black leading-tight">
        {dias > 0 ? `${dias} ${dias === 1 ? "dia seguido" : "dias seguidos"}` : "Sem sequência"}
      </p>
      <p className={cn("mt-0.5 text-[0.72rem] font-bold leading-snug", emRisco ? "text-orange-500" : "text-muted-foreground")}>
        {emRisco
          ? "Estude hoje antes da meia-noite para não apagar."
          : acesa
            ? `Feito hoje. ${comGas ? "Protegida pelo gás" : faixa.nome}${recorde > dias ? ` · recorde ${recorde}` : ""}.`
            : dias > 0 ? "Ainda falta estudar hoje." : "Uma lição hoje acende a chama."}
      </p>
      <Semana dias={dias} acesa={acesa} protegidos={protegidos} />
      <Rodape tecla="S" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Rupees — com o saldo do dia (14)
// ---------------------------------------------------------------------------

type ResumoDoDia = { ganhou: number; gastou: number };
let resumoGuardado: { valor: ResumoDoDia; em: number } | null = null;

/** O resumo do dia vem do servidor uma vez por minuto no máximo: a dica abre
 *  a cada passada de mouse, e cada passada não merece uma ida ao banco. */
function useResumoDoDia(saldo: number | null) {
  const [resumo, setResumo] = useState<ResumoDoDia | null>(() =>
    resumoGuardado && Date.now() - resumoGuardado.em < 60_000 ? resumoGuardado.valor : null);

  useEffect(() => {
    if (resumoGuardado && Date.now() - resumoGuardado.em < 60_000) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    let valeu = true;
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/hoje`, { headers: { Authorization: `Bearer ${token}` } }, 6000)
      .then((r) => (r.ok ? r.json() : null))
      .then((corpo: ResumoDoDia | null) => {
        if (!corpo || typeof corpo.ganhou !== "number") return;
        resumoGuardado = { valor: corpo, em: Date.now() };
        if (valeu) setResumo(corpo);
      })
      .catch(() => {});
    return () => { valeu = false; };
    // O saldo entra para buscar de novo quando ele muda com a dica aberta.
  }, [saldo]);

  return resumo;
}

export function DicaRupees({ saldo }: { saldo: number | null }) {
  const resumo = useResumoDoDia(saldo);
  const total = saldo ?? 0;
  return (
    <>
      <p className="text-[0.85rem] font-black leading-tight">
        {total.toLocaleString("pt-BR")} {total === 1 ? "Rupee" : "Rupees"}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[0.72rem] font-bold">
        {resumo === null ? (
          <span className="zc-esqueleto h-3.5 w-28 rounded" />
        ) : (
          <>
            <span className="text-emerald-500">+{resumo.ganhou.toLocaleString("pt-BR")} hoje</span>
            {resumo.gastou > 0 && <span className="text-muted-foreground">−{resumo.gastou.toLocaleString("pt-BR")} gastas</span>}
          </>
        )}
      </div>
      {total === 0 && (
        <p className="mt-1.5 text-[0.7rem] font-bold leading-snug text-muted-foreground">
          Lições, metas e o barril do dia rendem Rupees.
        </p>
      )}
      <Rodape tecla="R" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Penas — com a contagem até a próxima
// ---------------------------------------------------------------------------

function useAgora(intervalo: number) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [intervalo]);
  return agora;
}

function falta(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  if (horas > 0) return `${horas}h ${String(minutos).padStart(2, "0")}min`;
  if (minutos > 0) return `${minutos}min ${String(segundos).padStart(2, "0")}s`;
  return `${segundos}s`;
}

export function DicaPenas({
  vidas, maximo, proximaEm, pro,
}: {
  vidas: number;
  maximo: number;
  proximaEm: string | null;
  pro: boolean;
}) {
  const agora = useAgora(1000);
  const progresso = progressoDaRecarga(proximaEm, agora);
  const restante = proximaEm ? new Date(proximaEm).getTime() - agora : 0;
  // Quanto falta para encher tudo: a próxima mais uma hora por pena a mais.
  const paraEncher = proximaEm ? restante + Math.max(0, maximo - vidas - 1) * INTERVALO_DA_PENA_MS : 0;

  if (pro) {
    return (
      <>
        <p className="text-[0.85rem] font-black leading-tight">Penas ilimitadas</p>
        <p className="mt-0.5 text-[0.72rem] font-bold text-muted-foreground">Errar não custa nada na conta Pro.</p>
        <Rodape tecla="V" />
      </>
    );
  }

  return (
    <>
      <p className="text-[0.85rem] font-black leading-tight">
        {vidas} de {maximo} penas
      </p>
      {vidas >= maximo || !proximaEm ? (
        <p className="mt-0.5 text-[0.72rem] font-bold text-muted-foreground">Penas cheias.</p>
      ) : (
        <>
          <p className={cn("mt-0.5 text-[0.72rem] font-bold", vidas === 0 ? "text-rose-500" : "text-muted-foreground")}>
            Próxima em <span className="tabular-nums text-foreground">{falta(restante)}</span>
          </p>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-rose-500/15">
            <span
              className="block h-full origin-left rounded-full bg-rose-500 transition-transform duration-1000 ease-linear"
              style={{ transform: `scaleX(${progresso ?? 0})` }}
            />
          </span>
          {maximo - vidas > 1 && (
            <p className="mt-1.5 text-[0.68rem] font-bold text-muted-foreground">
              Cheias em <span className="tabular-nums">{falta(paraEncher)}</span>
            </p>
          )}
        </>
      )}
      <Rodape tecla="V" />
    </>
  );
}
