"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Crown, Infinity as Infinito, Loader2, Minus, Sparkles, X, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { PerfilProvider, usePerfil } from "@/hooks/use-perfil";
import { HeroPro, MascotePro } from "@/components/pro/hero-pro";
import { cn } from "@/lib/utils";
import {
  DESCONTO_ANUAL,
  DIAS_DE_TESTE,
  PLANOS,
  type PeriodoCobranca,
  type Plano,
  type PlanoId,
  formatarBRL,
  iniciarAssinatura,
  planoPorId,
  precoDoPlano,
} from "@/lib/pro/planos";

/**
 * Tabela de comparação.
 *
 * `true` vira visto, `false` vira traço, e texto vira o próprio texto — assim
 * uma linha como "5 por hora" cabe sem precisar de coluna especial.
 */
const COMPARACAO: { grupo: string; linhas: { recurso: string; gratis: boolean | string; pro: boolean | string; max: boolean | string }[] }[] = [
  {
    grupo: "Aprender",
    linhas: [
      { recurso: "Todos os cursos e trilhas", gratis: true, pro: true, max: true },
      { recurso: "Penas", gratis: "5 por hora", pro: "Ilimitadas", max: "Ilimitadas" },
      { recurso: "Sem anúncios", gratis: false, pro: true, max: true },
      { recurso: "Playground", gratis: "Básico", pro: "Completo", max: "Sem limites" },
    ],
  },
  {
    grupo: "Avançar mais rápido",
    linhas: [
      { recurso: "XP em dobro", gratis: false, pro: true, max: true },
      { recurso: "Moedas em dobro", gratis: false, pro: false, max: true },
      { recurso: "Proteção de ofensiva", gratis: false, pro: true, max: true },
      { recurso: "Escudo de pena", gratis: false, pro: false, max: true },
    ],
  },
  {
    grupo: "Apoio",
    linhas: [
      { recurso: "Metas e tabela de líderes", gratis: true, pro: true, max: true },
      { recurso: "Suporte prioritário", gratis: false, pro: false, max: true },
    ],
  },
];

const VANTAGENS = [
  { Icone: Infinito, cor: "text-violet-300", texto: "Penas ilimitadas" },
  { Icone: Zap, cor: "text-amber-300", texto: "XP em dobro" },
  { Icone: Crown, cor: "text-fuchsia-300", texto: "Sem anúncios" },
];

function Celula({ valor, destaque = false }: { valor: boolean | string; destaque?: boolean }) {
  if (typeof valor === "string") {
    return <span className={cn("text-[0.8rem] font-bold sm:text-[0.85rem]", destaque ? "text-violet-200" : "text-white/70")}>{valor}</span>;
  }
  return valor ? (
    <Check className={cn("size-4 sm:size-5", destaque ? "text-violet-300" : "text-white")} strokeWidth={3} />
  ) : (
    <Minus className="size-4 text-white/25 sm:size-5" />
  );
}

function Preco({ plano, periodo }: { plano: Plano; periodo: PeriodoCobranca }) {
  const preco = precoDoPlano(plano, periodo);

  if (preco.gratuito) {
    return (
      <div className="mt-4">
        <strong className="text-[1.9rem] font-black leading-none text-white sm:text-[2.2rem]">Grátis</strong>
        <p className="mt-1.5 text-[0.78rem] font-bold text-white/50">Para sempre</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <strong className="text-[1.9rem] font-black leading-none text-white sm:text-[2.2rem]">{formatarBRL(preco.porMes)}</strong>
      <p className="mt-1.5 text-[0.78rem] font-bold text-white/50">
        por mês{periodo === "anual" && <> · {formatarBRL(preco.total)} por ano</>}
      </p>
    </div>
  );
}

function CardPlano({
  plano,
  periodo,
  jaAssinado,
  onAssinar,
  enviando,
  indice,
}: {
  plano: Plano;
  periodo: PeriodoCobranca;
  jaAssinado: boolean;
  onAssinar: (id: PlanoId) => void;
  enviando: PlanoId | null;
  indice: number;
}) {
  const herdado = plano.herdaDe ? planoPorId(plano.herdaDe) : undefined;
  const gratuito = plano.precoMensal === null;
  const carregando = enviando === plano.id;

  return (
    <article
      style={{ animationDelay: `${indice * 90}ms` }}
      className={cn(
        "animate-fade-in-up relative flex flex-col overflow-hidden rounded-3xl border p-5 transition-transform duration-300 sm:p-6",
        plano.destaque
          ? "border-violet-400/70 bg-violet-500/[0.08] shadow-[0_0_60px_-15px_rgba(139,92,246,0.5)] lg:-my-2 lg:scale-[1.03]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      )}
    >
      {/* Brilho que atravessa só o card em destaque. */}
      {plano.destaque && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent zc-pro-brilho" aria-hidden />
      )}

      {plano.destaque && (
        <span className="relative mb-3 self-start rounded-full bg-violet-500 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-white">
          Mais escolhido
        </span>
      )}

      <h3 className={cn("relative text-lg font-black sm:text-xl", plano.destaque ? "text-violet-300" : "text-white")}>{plano.nome}</h3>
      <p className="relative mt-1.5 text-[0.85rem] leading-relaxed text-white/60">{plano.resumo}</p>

      <div className="relative">
        <Preco plano={plano} periodo={periodo} />
      </div>

      {gratuito ? (
        <Link
          href="/home"
          className="relative mt-5 rounded-2xl border border-white/15 bg-white/5 py-3.5 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-white transition-colors duration-150 hover:bg-white/10"
        >
          Continuar grátis
        </Link>
      ) : jaAssinado ? (
        <span className="relative mt-5 flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 py-3.5 text-[0.78rem] font-black uppercase tracking-[0.06em] text-emerald-300">
          <Check className="size-4" strokeWidth={3} /> Seu plano
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onAssinar(plano.id)}
          disabled={carregando}
          className={cn(
            "relative mt-5 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[0.78rem] font-black uppercase tracking-[0.06em] transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
            plano.destaque
              ? "bg-violet-500 text-white hover:brightness-110"
              : "border border-violet-400/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
          )}
        >
          {carregando && <Loader2 className="size-4 animate-spin" />}
          {carregando ? "Abrindo…" : `Testar ${DIAS_DE_TESTE} dias grátis`}
        </button>
      )}

      <ul className="relative mt-5 space-y-2.5 border-t border-white/10 pt-5">
        {herdado && <li className="text-[0.82rem] font-black text-white/80">Tudo do {herdado.nome}, e mais:</li>}
        {plano.recursos.map((recurso) => (
          <li key={recurso} className="flex items-start gap-2.5 text-[0.85rem] leading-snug text-white/75">
            <Check className={cn("mt-0.5 size-4 shrink-0", plano.destaque ? "text-violet-300" : "text-white/50")} strokeWidth={3} />
            {recurso}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ProPage() {
  // Tela cheia: não passa pelo AppShell, que é quem normalmente monta o
  // PerfilProvider. Sem ele por perto o usePerfil derruba a página.
  return (
    <PerfilProvider>
      <ConteudoPro />
    </PerfilProvider>
  );
}

function ConteudoPro() {
  useRequireAuth();
  const router = useRouter();
  const { perfil } = usePerfil();
  const [periodo, setPeriodo] = useState<PeriodoCobranca>("anual");
  const [enviando, setEnviando] = useState<PlanoId | null>(null);
  const [erro, setErro] = useState("");

  const jaEhPro = Boolean(perfil?.isPro);

  /**
   * O único caminho de compra da tela.
   *
   * Nenhum card conhece o provedor de pagamento: todos passam por aqui, e daqui
   * pro `iniciarAssinatura`. Quando o provedor entrar, é lá que ele entra —
   * esta função e os botões continuam iguais.
   */
  const assinar = async (id: PlanoId) => {
    setEnviando(id);
    setErro("");
    try {
      const { urlDeCheckout } = await iniciarAssinatura(id, periodo);
      if (urlDeCheckout) window.location.assign(urlDeCheckout);
      else setErro("O checkout não devolveu um endereço de pagamento.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível iniciar a assinatura.");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0b0414]">
      {/* ---------- Topo ---------- */}
      <header className="relative overflow-hidden border-b border-violet-500/20">
        <HeroPro />

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fechar"
          className="absolute left-4 top-4 z-30 flex size-10 items-center justify-center rounded-xl text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:left-8 lg:top-6"
        >
          <X className="size-5" />
        </button>

        {/* Uma coluna no celular, duas no computador: no celular o mascote
            embaixo do texto, e não do lado, senão os dois ficam apertados
            demais pra qualquer um dos dois ser legível. */}
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-10 pt-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:gap-10 lg:pb-14 lg:pt-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white">
              <Sparkles className="size-3.5" /> ZulCode Pro
            </span>

            <h1 className="mt-4 text-balance text-[1.75rem] font-black leading-[1.1] text-white sm:text-4xl lg:text-[2.75rem]">
              Aprenda sem freio,{" "}
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">sem limite de erro</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/70 lg:mx-0">
              Penas ilimitadas pra errar quantas vezes precisar, XP em dobro e nenhum anúncio no meio do caminho.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {VANTAGENS.map(({ Icone, cor, texto }) => (
                <span
                  key={texto}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-violet-100"
                >
                  <Icone className={cn("size-3.5", cor)} />
                  {texto}
                </span>
              ))}
            </div>

            <a
              href="#planos"
              className="mt-7 inline-flex rounded-2xl bg-violet-500 px-7 py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              {jaEhPro ? "Ver os planos" : `Testar ${DIAS_DE_TESTE} dias grátis`}
            </a>
          </div>

          <MascotePro className="mx-auto w-[190px] sm:w-[240px] lg:w-full lg:max-w-[380px]" />
        </div>
      </header>

      {/* ---------- Planos ---------- */}
      <section id="planos" className="scroll-mt-6 bg-[#0f1115] px-5 pb-16 pt-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-400">Planos</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Escolha até onde quer ir</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9rem] leading-relaxed text-white/55">
              {DIAS_DE_TESTE} dias grátis para testar. Cancele quando quiser, sem multa nem taxa.
            </p>
          </div>

          <div className="mt-7 flex justify-center">
            <div className="relative inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {(["mensal", "anual"] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setPeriodo(opcao)}
                  aria-pressed={periodo === opcao}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-[0.8rem] font-black transition-colors duration-200 sm:px-7",
                    periodo === opcao ? "bg-violet-500 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  {opcao === "mensal" ? "Mensal" : "Anual"}
                </button>
              ))}
              <span className="absolute -right-2 -top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-wide text-white">
                −{Math.round(DESCONTO_ANUAL * 100)}%
              </span>
            </div>
          </div>

          {erro && (
            <p role="alert" className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-[0.85rem] font-bold text-amber-200">
              {erro}
            </p>
          )}

          <div className="mt-9 grid gap-4 lg:grid-cols-3 lg:gap-5">
            {PLANOS.map((plano, indice) => (
              <CardPlano
                key={plano.id}
                plano={plano}
                periodo={periodo}
                jaAssinado={jaEhPro && plano.id !== "gratis"}
                onAssinar={assinar}
                enviando={enviando}
                indice={indice}
              />
            ))}
          </div>

          {/* ---------- Comparação ---------- */}
          <h2 className="mt-14 text-center text-2xl font-black text-white sm:text-3xl">Comparação completa</h2>

          <div className="zc-scroll-hidden mt-7 overflow-x-auto">
            <div className="min-w-[540px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center border-b border-white/10 px-4 py-4 sm:px-5">
                <span className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/40">Recurso</span>
                {PLANOS.map((plano) => (
                  <span
                    key={plano.id}
                    className={cn(
                      "text-center text-[0.7rem] font-black uppercase tracking-[0.1em]",
                      plano.destaque ? "text-violet-300" : "text-white/60"
                    )}
                  >
                    {plano.nome}
                  </span>
                ))}
              </div>

              {COMPARACAO.map((secao) => (
                <div key={secao.grupo}>
                  <p className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/50 sm:px-5">
                    <Sparkles className="size-3.5 text-violet-400" />
                    {secao.grupo}
                  </p>
                  {secao.linhas.map((linha) => (
                    <div
                      key={linha.recurso}
                      className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center border-b border-white/5 px-4 py-3.5 transition-colors duration-150 last:border-0 hover:bg-white/[0.03] sm:px-5"
                    >
                      <span className="text-[0.85rem] text-white/85 sm:text-[0.9rem]">{linha.recurso}</span>
                      <span className="flex justify-center"><Celula valor={linha.gratis} /></span>
                      <span className="flex justify-center"><Celula valor={linha.pro} destaque /></span>
                      <span className="flex justify-center"><Celula valor={linha.max} /></span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-[0.8rem] text-white/45">
            Os {DIAS_DE_TESTE} dias são gratuitos. A cobrança só começa depois, e você pode cancelar antes sem pagar nada.
          </p>

          <Link
            href="/home"
            className="mt-3 block py-2 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-white/45 transition-colors duration-150 hover:text-white"
          >
            Agora não
          </Link>
        </div>
      </section>
    </div>
  );
}
