"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Feather, Loader2, Sparkles, X } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { SeloPro } from "@/components/shared/selo-pro";
import { Rupee } from "@/components/shared/rupee";
import { movimentoReduzido } from "@/lib/motion/movimento";
import {
  abrirPortal,
  conferirSessao,
  DIAS_DE_TESTE,
  estadoDaAssinatura,
  fimDoTeste,
  type EstadoAssinatura,
  type PeriodoCobranca,
} from "@/lib/pro/planos";
import { cn } from "@/lib/utils";
import { CampoDeEstrelas } from "./espaco/campo-de-estrelas";
import { Cenarios, type Cena } from "./espaco/cenarios";
import {
  ArteApresentacao,
  ArteBoasVindas,
  ArteComparacao,
  ArteOfensiva,
  ArtePenas,
  ArtePlano,
  ArteRupees,
  ArteTeste,
  ArteXp,
} from "./momentos";
import { PagamentoEmbutido } from "./pagamento-embutido";
import { ZulPro } from "./zul-pro";

const ESPACO = "radial-gradient(120% 80% at 50% 0%, #1a1145 0%, #0c0824 55%, #06040f 100%)";

type IdPasso = "apresentacao" | "penas" | "xp" | "ofensiva" | "rupees" | "teste" | "comparacao" | "plano" | "pagamento";

interface Passo {
  id: IdPasso;
  cena: Cena;
  titulo: string;
  sub?: string;
  Arte?: ComponentType;
}

/** Os momentos, na ordem: um benefício por tela, como no roteiro aprovado. */
const PASSOS: Passo[] = [
  { id: "apresentacao", cena: "nebulosa", titulo: "Conheça o PRO", sub: "Aprenda sem limite nenhum", Arte: ArteApresentacao },
  { id: "penas", cena: "nebulosa", titulo: "Penas ilimitadas", sub: "Errou? Continue estudando sem esperar", Arte: ArtePenas },
  { id: "xp", cena: "planeta", titulo: "XP em dobro", sub: "Cada lição vale o dobro de XP", Arte: ArteXp },
  { id: "ofensiva", cena: "sol", titulo: "Ofensiva protegida", sub: "Perdeu um dia? O PRO segura sua sequência, uma vez por semana", Arte: ArteOfensiva },
  { id: "rupees", cena: "buraco", titulo: "Rupees em dobro", sub: "Cada lição rende o dobro de rupees", Arte: ArteRupees },
  { id: "teste", cena: "nebulosa", titulo: "Como funciona o teste", Arte: ArteTeste },
  { id: "comparacao", cena: "nebulosa", titulo: "Grátis × PRO", Arte: ArteComparacao },
  { id: "plano", cena: "planeta", titulo: "Escolha seu plano" },
  { id: "pagamento", cena: "nebulosa", titulo: "Quase lá" },
];

/** Telas que só apresentam: delas dá para pular direto aos planos. */
const APRESENTACOES = new Set<IdPasso>(["apresentacao", "penas", "xp", "ofensiva", "rupees"]);

type Fase = "entrada" | "passos" | "conferindo" | "boas-vindas" | "assinante";

/** Quanto a tela que sai leva para sumir antes de a próxima entrar. */
const SAIDA_MS = 230;

/**
 * O PRO inteiro: a entrada pela dobra espacial, um benefício por tela, a
 * escolha do plano, o pagamento embutido e as boas-vindas — e, para quem já
 * assina, o painel da assinatura.
 *
 * O fundo (estrelas e cenários) fica montado do começo ao fim: só o conteúdo
 * troca. É o que faz o fluxo parecer uma viagem só, e não páginas em fila.
 */
export function FluxoPro({ sessao }: { sessao: string | null }) {
  const router = useRouter();
  const { perfil, loading, atualizar } = usePerfil();

  const [faseEscolhida, setFaseEscolhida] = useState<Fase | null>(null);
  const [indice, setIndice] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const [pulso, setPulso] = useState(0);
  const [periodo, setPeriodo] = useState<PeriodoCobranca>("anual");
  const [assinatura, setAssinatura] = useState<EstadoAssinatura | null>(null);
  const [aviso, setAviso] = useState("");

  // A fase de partida sai do que já se sabe; as seguintes, das ações.
  const fase: Fase | null =
    faseEscolhida ?? (sessao ? "conferindo" : loading && !perfil ? null : perfil?.isPro ? "assinante" : "entrada");

  // Quem já usou o teste não pode ver a promessa de "7 dias grátis".
  const comTeste = !assinatura?.jaTeveTeste;
  const passos = PASSOS.filter((p) => p.id !== "teste" || comTeste);
  const passo = passos[Math.min(indice, passos.length - 1)];

  useEffect(() => {
    if (sessao) return;
    let vivo = true;
    estadoDaAssinatura()
      .then((estado) => vivo && setAssinatura(estado))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [sessao]);

  // A entrada: a dobra espacial dura o bastante para a logo assentar.
  useEffect(() => {
    if (fase !== "entrada") return;
    const id = setTimeout(() => {
      setFaseEscolhida("passos");
      setPulso((n) => n + 1);
    }, movimentoReduzido() ? 0 : 1250);
    return () => clearTimeout(id);
  }, [fase]);

  // A volta do pagamento: o backend pergunta ao Stripe como terminou.
  const [tentativaConferencia, setTentativaConferencia] = useState(0);
  useEffect(() => {
    if (!sessao || faseEscolhida) return;
    let vivo = true;
    const inicio = Date.now();
    const conferir = async (restantes: number): Promise<void> => {
      try {
        const estado = await conferirSessao(sessao);
        if (!vivo) return;
        if (estado.isPro) {
          // A dobra fica no ar pelo menos um instante: chegar na supernova
          // num piscar perde a explosão.
          await new Promise((r) => setTimeout(r, Math.max(0, 1400 - (Date.now() - inicio))));
          if (!vivo) return;
          setAssinatura(estado);
          setFaseEscolhida("boas-vindas");
          setPulso((n) => n + 1);
          atualizar();
          router.replace("/pro");
          return;
        }
        if (estado.sessao === "complete" && restantes > 0) {
          await new Promise((r) => setTimeout(r, 1500));
          return conferir(restantes - 1);
        }
        setAviso("O pagamento não foi concluído. Você pode tentar de novo.");
        setAssinatura(estado);
        setIndice(PASSOS.filter((p) => p.id !== "teste" || !estado.jaTeveTeste).findIndex((p) => p.id === "plano"));
        setFaseEscolhida("passos");
        router.replace("/pro");
      } catch (e) {
        if (vivo) setAviso(e instanceof Error ? e.message : "Não foi possível confirmar o pagamento.");
      }
    };
    conferir(5);
    return () => {
      vivo = false;
    };
  }, [sessao, faseEscolhida, tentativaConferencia, atualizar, router]);

  const fechar = useCallback(() => router.push("/home"), [router]);

  const irPara = useCallback(
    (destino: number) => {
      if (destino < 0 || destino >= passos.length || saindo) return;
      setSaindo(true);
      setTimeout(
        () => {
          setIndice(destino);
          setSaindo(false);
          setPulso((n) => n + 1);
        },
        movimentoReduzido() ? 0 : SAIDA_MS,
      );
    },
    [passos.length, saindo],
  );

  const avancar = useCallback(() => {
    setAviso("");
    irPara(indice + 1);
  }, [indice, irPara]);

  // Teclado: Enter e → avançam, ← volta, Esc fecha. Dentro do pagamento as
  // teclas são do formulário do Stripe, e não da tela.
  const atalhos = useRef({ avancar, voltar: () => irPara(indice - 1), fechar, ativo: false });
  useEffect(() => {
    atalhos.current = { avancar, voltar: () => irPara(indice - 1), fechar, ativo: fase === "passos" && passo.id !== "pagamento" };
  });
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const a = atalhos.current;
      if (e.key === "Escape") return a.fechar();
      if (!a.ativo || (e.target as HTMLElement)?.closest("button, a, input")) return;
      if (e.key === "Enter" || e.key === "ArrowRight") a.avancar();
      if (e.key === "ArrowLeft") a.voltar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const cena: Cena =
    fase === "passos" ? passo.cena : fase === "boas-vindas" ? "supernova" : "nebulosa";

  const textoDoBotao = (() => {
    if (APRESENTACOES.has(passo.id)) return "Continuar";
    if (passo.id === "plano") return comTeste ? `Começar ${DIAS_DE_TESTE} dias grátis` : "Ir para o pagamento";
    return comTeste ? `Teste ${DIAS_DE_TESTE} dias grátis` : "Assinar o PRO";
  })();

  return (
    <div className="fixed inset-0 overflow-hidden text-white" style={{ background: ESPACO }}>
      <Cenarios cena={cena} />
      <CampoDeEstrelas dobra={fase === "entrada" || fase === "conferindo" || fase === null} pulso={pulso} />

      <div className="relative z-10 mx-auto flex h-dvh max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:max-w-lg">
        {/* ---------- Topo ---------- */}
        <header className="flex h-12 shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="-ml-2 flex size-10 items-center justify-center rounded-xl text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <X className="size-6" strokeWidth={2.4} />
          </button>
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {fase === "passos" &&
              passos.map((p, i) => (
                <span key={p.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-white transition-transform duration-500"
                    style={{ transform: `scaleX(${i <= indice ? 1 : 0})`, transformOrigin: "left", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />
                </span>
              ))}
          </div>
          <SeloPro className={cn("h-6 transition-opacity duration-500", fase === "entrada" ? "opacity-0" : "opacity-100")} />
        </header>

        {fase === null && <div className="flex-1" />}

        {fase === "entrada" && (
          <div className="flex flex-1 items-center justify-center">
            <SeloPro className="zc-pro-selo-entrada h-16 sm:h-20" />
          </div>
        )}

        {fase === "conferindo" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            {aviso ? (
              <>
                <p className="max-w-xs text-[1rem] font-bold text-amber-100">{aviso}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAviso("");
                    setTentativaConferencia((n) => n + 1);
                  }}
                  className="zc-press rounded-2xl bg-white px-6 py-3 text-[0.8rem] font-black uppercase tracking-[0.06em] text-violet-700"
                >
                  Tentar de novo
                </button>
              </>
            ) : (
              <>
                <Loader2 className="size-8 animate-spin text-white/80" />
                <p className="zc-pro-sobe text-[1.05rem] font-black">Confirmando seu pagamento…</p>
              </>
            )}
          </div>
        )}

        {fase === "passos" && (
          <>
            <div
              key={passo.id}
              className={cn("flex min-h-0 flex-1 flex-col", saindo ? "zc-pro-sai-tela" : "zc-pro-entra-tela")}
            >
              <div className="shrink-0 pt-4 text-center">
                <h1 className="zc-pro-sobe text-balance text-[1.85rem] font-black leading-tight sm:text-[2.1rem]">{passo.titulo}</h1>
                {passo.sub && (
                  <p className="zc-pro-sobe mx-auto mt-2 max-w-xs text-balance text-[0.98rem] leading-snug text-white/70" style={{ animationDelay: "70ms" }}>
                    {passo.sub}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "zc-scroll-hidden flex min-h-0 flex-1 flex-col items-center py-4",
                  passo.id === "pagamento" ? "overflow-y-auto" : "justify-center",
                )}
              >
                {passo.id === "plano" ? (
                  <ArtePlano periodo={periodo} onPeriodo={setPeriodo} comTeste={comTeste} />
                ) : passo.id === "pagamento" ? (
                  <PagamentoEmbutido periodo={periodo} />
                ) : (
                  passo.Arte && <passo.Arte />
                )}
              </div>
            </div>

            <footer className="shrink-0 pt-2">
              {aviso && (
                <p role="alert" className="mb-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-center text-[0.85rem] font-bold text-amber-100">
                  {aviso}
                </p>
              )}
              {passo.id === "pagamento" ? (
                <button
                  type="button"
                  onClick={() => irPara(indice - 1)}
                  className="block w-full py-3 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-white/55 transition-colors hover:text-white"
                >
                  Voltar aos planos
                </button>
              ) : (
                <>
                  <BotaoPro onClick={avancar}>{textoDoBotao}</BotaoPro>
                  <button
                    type="button"
                    onClick={() => (APRESENTACOES.has(passo.id) ? irPara(passos.findIndex((p) => p.id === "plano")) : fechar())}
                    className="block w-full py-3 text-center text-[0.75rem] font-black uppercase tracking-[0.06em] text-white/45 transition-colors hover:text-white"
                  >
                    {APRESENTACOES.has(passo.id) ? "Pular para os planos" : "Agora não"}
                  </button>
                </>
              )}
            </footer>
          </>
        )}

        {fase === "boas-vindas" && (
          <BoasVindas emTeste={assinatura?.status === "trialing"} onComecar={() => router.push("/home")} />
        )}

        {fase === "assinante" && <PainelAssinante assinatura={assinatura} onVoltar={fechar} />}
      </div>
    </div>
  );
}

/** O botão de ação do PRO: branco com o texto roxo, como no card da home. */
function BotaoPro({ children, onClick, carregando = false }: { children: React.ReactNode; onClick: () => void; carregando?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="zc-press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[0.85rem] font-black uppercase tracking-[0.06em] text-violet-700 shadow-[0_8px_30px_rgba(189,115,233,.35)] transition-[filter] hover:brightness-95 disabled:opacity-70"
    >
      {carregando && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

function BoasVindas({ emTeste, onComecar }: { emTeste: boolean; onComecar: () => void }) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 pt-4 text-center">
          <h1 className="zc-pro-sobe text-[2.1rem] font-black leading-tight" style={{ animationDelay: "500ms" }}>
            Você é PRO!
          </h1>
          <p className="zc-pro-sobe mx-auto mt-2 max-w-xs text-[0.98rem] text-white/70" style={{ animationDelay: "600ms" }}>
            {emTeste ? `Seu teste de ${DIAS_DE_TESTE} dias começou. Aproveite cada um.` : "Sua assinatura está ativa."}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-4">
          <ArteBoasVindas />
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icone: <Feather className="size-4 fill-[#bd73e9] text-white" />, texto: "∞ penas" },
              { icone: <Sparkles className="size-4 text-amber-300" />, texto: "2× XP" },
              { icone: <Rupee className="size-4 text-emerald-400" />, texto: "2× rupees" },
            ].map((item, i) => (
              <span
                key={item.texto}
                className="zc-pro-sobe inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.85rem] font-black backdrop-blur-md"
                style={{ animationDelay: `${900 + i * 120}ms` }}
              >
                {item.icone}
                {item.texto}
              </span>
            ))}
          </div>
        </div>
      </div>
      <footer className="zc-pro-sobe shrink-0 pt-2 pb-3" style={{ animationDelay: "1200ms" }}>
        <BotaoPro onClick={onComecar}>Começar a estudar</BotaoPro>
      </footer>
    </>
  );
}

const formatarDia = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

function PainelAssinante({ assinatura, onVoltar }: { assinatura: EstadoAssinatura | null; onVoltar: () => void }) {
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");
  const teste = fimDoTeste(assinatura);
  const temAssinatura = Boolean(assinatura?.status);

  const linhas: { rotulo: string; valor: string }[] = [];
  if (assinatura?.plano) linhas.push({ rotulo: "Plano", valor: assinatura.plano === "anual" ? "Anual" : "Mensal" });
  if (assinatura?.validoAte) {
    linhas.push(
      teste
        ? { rotulo: "Teste grátis até", valor: formatarDia(assinatura.validoAte) }
        : assinatura.canceladaNoFim
          ? { rotulo: "Termina em", valor: formatarDia(assinatura.validoAte) }
          : { rotulo: "Renova em", valor: formatarDia(assinatura.validoAte) },
    );
  }

  const gerenciar = async () => {
    setAbrindo(true);
    setErro("");
    try {
      const { url } = await abrirPortal();
      window.location.assign(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a assinatura.");
      setAbrindo(false);
    }
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
        <div className="zc-pro-chegada w-[min(46vw,190px)]">
          <div className="zc-pro-flutua">
            <ZulPro className="w-full" />
          </div>
        </div>
        <div>
          <h1 className="zc-pro-sobe text-[2rem] font-black leading-tight">Você é PRO</h1>
          <p className="zc-pro-sobe mt-1.5 text-[0.95rem] text-white/70" style={{ animationDelay: "80ms" }}>
            Penas ilimitadas, XP e rupees em dobro, ofensiva protegida.
          </p>
        </div>

        {teste && teste.horasRestantes <= 24 && !assinatura?.canceladaNoFim && (
          <p className="zc-pro-sobe w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[0.9rem] font-bold">
            Seu teste termina hoje. A primeira cobrança acontece em seguida.
          </p>
        )}

        {linhas.length > 0 && (
          <dl className="zc-pro-sobe w-full divide-y divide-white/10 rounded-2xl border border-white/15 bg-white/[0.07] px-4 backdrop-blur-md" style={{ animationDelay: "140ms" }}>
            {linhas.map((l) => (
              <div key={l.rotulo} className="flex items-center justify-between py-3 text-[0.92rem]">
                <dt className="text-white/60">{l.rotulo}</dt>
                <dd className="font-black">{l.valor}</dd>
              </div>
            ))}
          </dl>
        )}
        {!temAssinatura && assinatura && (
          <p className="text-[0.88rem] text-white/60">Seu PRO foi ativado pela equipe do ZulCode.</p>
        )}
        {erro && <p role="alert" className="text-[0.88rem] font-bold text-amber-200">{erro}</p>}
      </div>
      <footer className="shrink-0 pt-2">
        {temAssinatura ? (
          <BotaoPro onClick={gerenciar} carregando={abrindo}>
            Gerenciar assinatura
          </BotaoPro>
        ) : (
          <BotaoPro onClick={onVoltar}>Voltar para o ZulCode</BotaoPro>
        )}
        {temAssinatura && (
          <button
            type="button"
            onClick={onVoltar}
            className="block w-full py-3 text-center text-[0.75rem] font-black uppercase tracking-[0.06em] text-white/45 transition-colors hover:text-white"
          >
            Voltar
          </button>
        )}
      </footer>
    </>
  );
}
