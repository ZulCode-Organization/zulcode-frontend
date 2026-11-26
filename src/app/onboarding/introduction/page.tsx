"use client";

import { type PointerEvent as EventoDePonteiro, type ReactNode, type Ref, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ArrowLeft, Check, Code, Flag, Question, Star, Target, Timer } from "@phosphor-icons/react/dist/ssr";
import { DuoOfensiva, DuoXp, IconeDuo } from "@/components/shared/icone-duo";
import { LadrilhoCurso } from "@/components/app-shell/topbar-cursos";
import { IconeDaOpcao } from "@/components/nivelamento/icones";
import { useOnboarding, PERGUNTAS_OPCIONAIS } from "@/hooks/use-onboarding";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useTextosDosAvisos } from "@/hooks/use-avisos";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { FundoAscii, type FundoAsciiControle, type ModoDoFundo } from "@/components/fundo-ascii/fundo-ascii";
import { CabecaDoZul, useReacaoDoZul, type AnimacaoDaCabeca, type ReacaoDoZul } from "@/components/zul/cabeca-do-zul";
import { CartaoDeEscolha } from "@/components/nivelamento/cartao-de-escolha";
import { VitrineDeAvisos } from "@/components/nivelamento/vitrine-de-avisos";
import { Confete } from "@/components/nivelamento/confete";
import { LanguageIcon } from "@/components/onboarding/language-icon";
import { NivelamentoQuiz } from "@/components/onboarding/nivelamento-quiz";
/** Onde a pessoa começa, vindo do POST /onboarding/placement (nulo para quem é iniciante). */
type InicioDaTrilha = { unidade: number; titulo: string | null; xp: number } | null;
import { ResultadoNivelamento } from "@/lib/nivelamento-local";
import { submitPlacement } from "@/lib/onboarding/service";
import { sugerirLinguagem } from "@/lib/onboarding/sugestao";
import { FALAS_DAS_PAGINAS, MOTIVOS, reacaoDaOpcao } from "@/lib/onboarding/reacoes";
import { abrirConfiguracoesDeAvisos } from "@/lib/avisos";
import { adiarPedidoDeAvisos, ativarAvisosNesteAparelho, situacaoDosAvisos } from "@/lib/ativar-avisos";
import { abrirAvaliacaoNaLoja, podeAvaliarNaLoja, registrarAvaliacao } from "@/lib/avaliacao";
import { vibrar } from "@/lib/reacoes/vibrar";
import { cn } from "@/lib/utils";
import "@/components/nivelamento/nivelamento.css";

/** Quanto o dedo tem que arrastar para trocar de página. */
const ARRASTE_PARA_TROCAR = 70;

type Fase = "perguntas" | "enviando" | "teste" | "fim";
type SituacaoDosAvisos = "pedir" | "bloqueadas" | "ativando" | "ativado" | "depois";

/**
 * O nivelamento: páginas que passam com o dedo (ou com Continuar), com o Zul
 * no alto reagindo a cada escolha e um fundo de caracteres que troca entre
 * ondas e grade a cada duas respostas. No fim, as notificações, o teste (para
 * quem já sabe algo) e o pedido de avaliação na Play Store (só no app).
 */
export default function NivelamentoPage() {
  useRequireAuth();
  const router = useRouter();
  const {
    loading,
    loadError,
    retry,
    languages,
    interesse,
    perguntas,
    selectedLanguage,
    languageId,
    escolherLinguagem,
    answers,
    multiplas,
    responder,
    alternar,
    guardarInteresse,
    result,
    finish,
  } = useOnboarding();
  const textosDosAvisos = useTextosDosAvisos();

  const fundo = useRef<FundoAsciiControle>(null);
  const { reacao, reagir } = useReacaoDoZul();
  const [animacao, setAnimacao] = useState<AnimacaoDaCabeca>("piscando");
  const [fala, setFala] = useState(FALAS_DAS_PAGINAS.inicio);
  const [pagina, setPagina] = useState(0);
  const [arraste, setArraste] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [fase, setFase] = useState<Fase>("perguntas");
  const [erroAoEnviar, setErroAoEnviar] = useState(false);
  const [avisos, setAvisos] = useState<SituacaoDosAvisos | null>(null);
  const [faseLinguagem, setFaseLinguagem] = useState<{ tipo: "lista" } | { tipo: "gosto" } | { tipo: "sugestao"; slug: string; porque: string }>({ tipo: "lista" });
  const [inicio, setInicio] = useState<InicioDaTrilha>(null);
  const [avaliaNaLoja, setAvaliaNaLoja] = useState(false);
  const [avaliou, setAvaliou] = useState(false);
  const [confete, setConfete] = useState(0);
  const voltaDaAnimacao = useRef<number | null>(null);

  // As notificações só viram página quando dá para pedir (ou quando estão
  // bloqueadas no aparelho). Já ligadas, ou num lugar sem suporte, a página some.
  useEffect(() => {
    let vivo = true;
    void situacaoDosAvisos()
      .then((s) => vivo && setAvisos(s))
      .catch(() => {});
    void podeAvaliarNaLoja().then((pode) => vivo && setAvaliaNaLoja(pode));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => () => {
    if (voltaDaAnimacao.current) window.clearTimeout(voltaDaAnimacao.current);
  }, []);

  /** O Zul reage: o movimento, a fala nova e, nos giros e danças, a cabeça balançando. */
  const zulReage = useCallback(
    (tipo: ReacaoDoZul, novaFala?: string) => {
      reagir(tipo);
      if (novaFala) setFala(novaFala);
      if (tipo === "danca" || tipo === "gira") {
        setAnimacao("balancando");
        if (voltaDaAnimacao.current) window.clearTimeout(voltaDaAnimacao.current);
        voltaDaAnimacao.current = window.setTimeout(() => setAnimacao("piscando"), 2200);
      }
    },
    [reagir],
  );

  // ── As páginas ─────────────────────────────────────────────────────────
  type Pagina = { id: string; tipo: "inicio" | "linguagem" | "pergunta" | "avisos"; perguntaIndice?: number };
  const paginas: Pagina[] = [
    { id: "inicio", tipo: "inicio" },
    { id: "linguagem", tipo: "linguagem" },
    ...perguntas.map((q, i) => ({ id: q.id, tipo: "pergunta" as const, perguntaIndice: i })),
    ...(avisos ? [{ id: "avisos", tipo: "avisos" as const }] : []),
  ];
  const ultima = paginas.length - 1;
  const atual = paginas[Math.min(pagina, ultima)];

  const respondida = (p: Pagina) => {
    if (p.tipo === "inicio") return true;
    if (p.tipo === "linguagem") return Boolean(languageId);
    if (p.tipo === "avisos") return avisos === "ativado" || avisos === "depois";
    const q = perguntas[p.perguntaIndice!];
    if (q.type === "multiple-choice") return (multiplas[q.id] ?? []).length > 0;
    // As opcionais também só seguem pelo Continuar com resposta; sem ela, pelo "Pular".
    return Boolean(answers[q.id]);
  };

  const irPara = useCallback(
    (destino: number) => {
      const p = paginas[destino];
      if (!p) return;
      setPagina(destino);
      setFala(FALAS_DAS_PAGINAS[p.id] ?? FALAS_DAS_PAGINAS.inicio);
      zulReage("pulo");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginas.length, zulReage],
  );

  /** Chegou ao fim: festa. */
  const chegarAoFim = useCallback(() => {
    setFase("fim");
    setFala(avaliaNaLoja ? "Prontinho! Sua trilha está montada." : "Prontinho! Bora para a primeira lição?");
    zulReage("danca");
    setConfete((c) => c + 1);
    void vibrar("comemoracao");
  }, [avaliaNaLoja, zulReage]);

  const enviar = useCallback(async () => {
    setFase("enviando");
    setErroAoEnviar(false);
    try {
      await finish();
      const nivel = answers.language_level;
      if (nivel && nivel !== "beginner") setFase("teste");
      else chegarAoFim();
    } catch {
      setErroAoEnviar(true);
      setFase("perguntas");
    }
  }, [answers.language_level, finish, chegarAoFim]);

  const avancar = (origem?: HTMLElement | null) => {
    if (!respondida(atual)) {
      zulReage("treme", "Escolhe uma opção antes!");
      void vibrar("erro");
      return;
    }
    if (origem) {
      const r = origem.getBoundingClientRect();
      fundo.current?.onda(r.left + r.width / 2, r.top + r.height / 2, 1);
    }
    if (pagina >= ultima) void enviar();
    else irPara(pagina + 1);
  };

  // ── Arrastar com o dedo ────────────────────────────────────────────────
  // Sem pointer capture: com ela o clique dos cartões iria para a área toda.
  // O arraste só começa quando o gesto é mais de lado que de cima a baixo, e
  // um arraste de verdade cancela o clique que viria ao soltar.
  const gesto = useRef<{ x: number; y: number; ativo: boolean } | null>(null);
  const ultimoArraste = useRef(false);
  const aoApertar = (e: EventoDePonteiro<HTMLElement>) => {
    gesto.current = { x: e.clientX, y: e.clientY, ativo: false };
    ultimoArraste.current = false;
    fundo.current?.onda(e.clientX, e.clientY, 0.8);
  };
  const aoMover = (e: EventoDePonteiro<HTMLElement>) => {
    const g = gesto.current;
    if (!g) return;
    let dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.ativo) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      g.ativo = true;
      setArrastando(true);
    }
    // Resistência na ponta: sem página antes, ou página sem resposta.
    if ((dx < 0 && (!respondida(atual) || pagina >= ultima)) || (dx > 0 && pagina === 0)) dx *= 0.22;
    setArraste(dx);
  };
  const aoSoltar = () => {
    const g = gesto.current;
    gesto.current = null;
    if (!g?.ativo) return;
    setArrastando(false);
    const dx = arraste;
    setArraste(0);
    if (dx < -ARRASTE_PARA_TROCAR && pagina < ultima && respondida(atual)) irPara(pagina + 1);
    else if (dx > ARRASTE_PARA_TROCAR && pagina > 0) irPara(pagina - 1);
    else if (dx < -40 && !respondida(atual)) zulReage("treme", "Escolhe uma opção antes!");
    // Foi arraste de verdade: o clique que vem ao soltar não escolhe nada.
    ultimoArraste.current = true;
  };

  // ── Escolhas ───────────────────────────────────────────────────────────
  const escolherOpcao = (chave: string, indice: number) => {
    const r = reacaoDaOpcao(chave, indice);
    zulReage(r.reacao, r.fala);
    void vibrar("toque");
  };

  const escolherLang = (id: string, indice: number) => {
    escolherLinguagem(id);
    escolherOpcao(`linguagem:${id}`, indice);
  };

  const ativarAvisos = async () => {
    if (avisos === "bloqueadas") {
      await abrirConfiguracoesDeAvisos();
      return;
    }
    setAvisos("ativando");
    zulReage("aperta", "Só um segundinho…");
    try {
      const { resultado } = await ativarAvisosNesteAparelho(textosDosAvisos);
      if (resultado === "ativado") {
        setAvisos("ativado");
        zulReage("pulo", "Combinado! Te chamo no seu horário.");
        setConfete((c) => c + 1);
        void vibrar("acerto");
        window.setTimeout(() => void enviar(), 1500);
      } else if (resultado === "bloqueadas") {
        setAvisos("bloqueadas");
        zulReage("treme", "Estão bloqueadas no celular. Dá para liberar nos ajustes.");
      } else {
        pularAvisos();
      }
    } catch {
      pularAvisos();
    }
  };

  const pularAvisos = () => {
    adiarPedidoDeAvisos();
    setAvisos("depois");
    zulReage("treme", "Tudo bem! Dá para ativar depois nos ajustes.");
    window.setTimeout(() => void enviar(), 1100);
  };

  // Quem volta dos ajustes do aparelho pode ter liberado lá.
  useEffect(() => {
    if (avisos !== "bloqueadas") return;
    const aoVoltar = async () => {
      if (document.visibilityState !== "visible") return;
      const agora = await situacaoDosAvisos();
      if (agora === "pedir") setAvisos("pedir");
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [avisos]);


  const avaliar = async () => {
    if (avaliou) {
      router.push("/home");
      return;
    }
    setAvaliou(true);
    zulReage("gira", "Valeu demais! Você é demais.");
    setConfete((c) => c + 1);
    void registrarAvaliacao("clicou");
    await abrirAvaliacaoNaLoja();
  };
  const naoAvaliar = () => {
    void registrarAvaliacao("pulou");
    router.push("/home");
  };

  // ── Telas de carregar e de erro ────────────────────────────────────────
  if (loadError) {
    return (
      <Moldura modo="ondas">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Não foi possível carregar as perguntas. Verifique sua conexão e tente de novo.</p>
          <BotaoRelevo onClick={retry}>Tentar novamente</BotaoRelevo>
        </div>
      </Moldura>
    );
  }
  if (loading) {
    return (
      <Moldura modo="ondas">
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Carregando…</span>
        </div>
      </Moldura>
    );
  }

  const nomeDaLinguagem = selectedLanguage?.name ?? "programação";

  // ── O teste de nivelamento (para quem já sabe algo) ────────────────────
  if (fase === "teste" && result) {
    return (
      <Moldura modo="ondas" fundoRef={fundo}>
        <div className="zc-scroll-hidden relative z-10 flex-1 overflow-y-auto">
        <NivelamentoQuiz
          semFundo
          languageSlug={result.payload.languageId}
          languageName={nomeDaLinguagem}
          onFinish={async (resultado: ResultadoNivelamento) => {
            try {
              const resposta = await submitPlacement(resultado.languageSlug, answers.language_level ?? "", resultado.acertos, Math.max(resultado.total, 1));
              setInicio({ unidade: resposta.startUnitNumber ?? 1, titulo: resposta.startUnitTitle ?? null, xp: resposta.xpEarned ?? 0 });
            } catch {
              /* segue começando do início */
            }
            chegarAoFim();
          }}
        />
        </div>
      </Moldura>
    );
  }

  const meta = Number.parseInt(answers.commitment ?? "", 10);
  const modoDoFundo: ModoDoFundo =
    fase === "fim" ? "grade" : Math.floor(Math.max(0, pagina - 1) / 2) % 2 === 0 ? "ondas" : "grade";

  return (
    <Moldura modo={modoDoFundo} pagina={pagina} arraste={arraste} fundoRef={fundo}>
      {/* O Zul e a fala dele, no alto. */}
      <header className="relative z-20 mx-auto flex w-full max-w-lg items-center gap-3 px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
        <CabecaDoZul animacao={animacao} reacao={reacao} cair className="size-24 shrink-0" />
        <div key={fala} className="zc-balao-entra relative min-w-0 flex-1">
          <p aria-live="polite" className="rounded-2xl border-2 border-border bg-card px-3.5 py-3 text-sm font-extrabold leading-snug text-foreground">
            {fala}
          </p>
          {/* O biquinho vem por cima da borda do balão e a cobre: sem a linha atravessando. */}
          <span aria-hidden className="absolute -left-[6px] top-1/2 -mt-[7px] size-3.5 rotate-45 border-b-2 border-l-2 border-border bg-card" />
        </div>
        {confete > 0 && <Confete key={confete} className="absolute left-16 top-24" />}
      </header>

      {fase === "fim" ? (
        <Fim
          linguagem={selectedLanguage}
          metaMinutos={Number.isFinite(meta) ? meta : null}
          nivel={answers.language_level}
          inicio={inicio}
          avaliaNaLoja={avaliaNaLoja}
          avaliou={avaliou}
          onAvaliar={avaliar}
          onNaoAvaliar={naoAvaliar}
          onComecar={() => router.push("/home")}
        />
      ) : (
        <>
          <main
            onPointerDown={aoApertar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onClickCapture={(e) => {
              if (ultimoArraste.current) {
                e.preventDefault();
                e.stopPropagation();
                ultimoArraste.current = false;
              }
            }}
            className="relative z-10 mx-auto w-full max-w-lg flex-1 touch-pan-y overflow-hidden select-none"
          >
            <div
              className="flex h-full"
              style={{
                width: `${paginas.length * 100}%`,
                transform: `translateX(calc(${(-pagina * 100) / paginas.length}% + ${arraste}px))`,
                transition: arrastando ? "none" : "transform 0.5s cubic-bezier(.25,1.15,.4,1)",
              }}
            >
              {paginas.map((p, i) => (
                <section
                  key={p.id}
                  inert={i !== pagina}
                  className="zc-scroll-hidden h-full overflow-y-auto px-5 pb-6 pt-4"
                  style={{ width: `${100 / paginas.length}%` }}
                >
                  {/* A chave muda ao entrar na página: as animações de entrada tocam de novo. */}
                  <div key={i === pagina ? "ativa" : "parada"} className="flex flex-col gap-3">
                    {p.tipo === "inicio" && <Abertura />}
                    {p.tipo === "linguagem" && (
                      <PaginaDaLinguagem
                        fase={faseLinguagem}
                        setFase={setFaseLinguagem}
                        languages={languages}
                        interesse={interesse}
                        escolhida={languageId}
                        onEscolher={escolherLang}
                        onInteresse={(id) => {
                          guardarInteresse(id);
                          const s = sugerirLinguagem(id, languages.map((l) => l.id));
                          if (s) {
                            setFaseLinguagem({ tipo: "sugestao", slug: s.slug, porque: s.porque });
                            zulReage("gira", "Acho que essa combina com você!");
                          }
                        }}
                        onAceitarSugestao={(slug) => {
                          escolherLinguagem(slug);
                          zulReage("danca", "Ótima escolha!");
                          setFaseLinguagem({ tipo: "lista" });
                          window.setTimeout(() => irPara(pagina + 1), 450);
                        }}
                      />
                    )}
                    {p.tipo === "pergunta" && (
                      <PaginaDePergunta
                        pergunta={perguntas[p.perguntaIndice!]}
                        linguagem={nomeDaLinguagem}
                        resposta={answers[perguntas[p.perguntaIndice!].id]}
                        marcadas={multiplas[perguntas[p.perguntaIndice!].id] ?? []}
                        onResponder={(qid, oid, indice) => {
                          responder(qid, oid);
                          escolherOpcao(`${qid}:${oid}`, indice);
                        }}
                        onAlternar={(qid, oid, indice) => {
                          const ja = (multiplas[qid] ?? []).includes(oid);
                          alternar(qid, oid);
                          if (ja) {
                            zulReage("inclina", "Ok, tirei essa.");
                            void vibrar("toque");
                          } else escolherOpcao(`${qid}:${oid}`, indice);
                        }}
                      />
                    )}
                    {p.tipo === "avisos" && <PaginaDeAvisos ativadas={avisos === "ativado"} bloqueadas={avisos === "bloqueadas"} />}
                  </div>
                </section>
              ))}
            </div>
          </main>

          {/* Os pontinhos e os botões, embaixo. */}
          <footer className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-4 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex justify-center gap-1.5" aria-hidden>
              {paginas.map((p, i) => (
                <span
                  key={p.id}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 [transition-timing-function:cubic-bezier(.3,1.4,.5,1)]",
                    i === pagina ? "w-6 bg-primary" : i < pagina ? "w-2 bg-primary/45" : "w-2 bg-border",
                  )}
                />
              ))}
            </div>
            {erroAoEnviar && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm font-semibold text-destructive">
                Não deu para salvar suas respostas. Confira a conexão e toque em Continuar de novo.
              </p>
            )}
            {atual.tipo === "avisos" ? (
              <div className="flex flex-col gap-1">
                <div className={cn(avisos === "pedir" && "zc-niv-pulsa")}>
                  <BotaoRelevo className="w-full" onClick={() => void ativarAvisos()} disabled={avisos === "ativando" || avisos === "ativado" || fase === "enviando"}>
                    {avisos === "ativando" ? "Ativando…" : avisos === "ativado" ? "Ativadas!" : avisos === "bloqueadas" ? "Abrir ajustes" : "Ativar notificações"}
                  </BotaoRelevo>
                </div>
                <button
                  type="button"
                  onClick={pularAvisos}
                  disabled={avisos === "ativando" || avisos === "ativado" || avisos === "depois"}
                  className="min-h-11 text-sm font-black uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground disabled:opacity-0"
                >
                  Agora não
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => pagina > 0 && irPara(pagina - 1)}
                  className={cn("flex min-h-11 w-24 items-center gap-1.5 text-sm font-black uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground", pagina === 0 && "invisible")}
                >
                  <ArrowLeft className="size-4" weight="bold" /> Voltar
                </button>
                <BotaoAvancar
                  disabled={!respondida(atual) || fase === "enviando"}
                  onAvancar={avancar}
                  rotulo={fase === "enviando" ? "Salvando…" : pagina === 0 ? "Vamos lá" : "Continuar"}
                />
              </div>
            )}
            {atual.tipo === "pergunta" && PERGUNTAS_OPCIONAIS.includes(atual.id) && !answers[atual.id] && (
              <button
                type="button"
                onClick={() => (pagina >= ultima ? void enviar() : irPara(pagina + 1))}
                className="-mt-2 min-h-11 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                Pular esta pergunta
              </button>
            )}
          </footer>
        </>
      )}
    </Moldura>
  );
}

// ── Partes da tela ───────────────────────────────────────────────────────

function Moldura({
  modo,
  pagina,
  arraste,
  fundoRef,
  children,
}: {
  modo: ModoDoFundo;
  pagina?: number;
  arraste?: number;
  fundoRef?: Ref<FundoAsciiControle>;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <FundoAscii ref={fundoRef} modo={modo} pagina={pagina} arraste={arraste} origemDaTroca={{ x: 0.62, y: 0.93 }} origemDoPulso={{ x: 0.14, y: 0.08 }} />
      {children}
    </div>
  );
}

function BotaoAvancar({ disabled, onAvancar, rotulo }: { disabled: boolean; onAvancar: (origem: HTMLElement | null) => void; rotulo: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  return (
    <div ref={caixa} className="flex-1">
      <BotaoRelevo className="w-full" onClick={() => onAvancar(caixa.current)} disabled={disabled}>
        {rotulo}
      </BotaoRelevo>
    </div>
  );
}

function Titulo({ children, texto }: { children: ReactNode; texto?: ReactNode }) {
  return (
    <div className="animate-fade-in-up mb-1">
      <h1 className="text-[1.6rem] font-black leading-tight text-foreground">{children}</h1>
      {texto && <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">{texto}</p>}
    </div>
  );
}

function Abertura() {
  const destaques = [
    { icone: <IconeDuo icone={Timer} className="size-7" />, titulo: "Lições de 5 minutos", texto: "Cabem no ônibus, na fila, no intervalo." },
    { icone: <DuoOfensiva className="size-7" />, titulo: "Ofensiva e XP todo dia", texto: "Cada dia estudando conta." },
    { icone: <IconeDuo icone={Code} className="size-7" />, titulo: "Código de verdade", texto: "Você escreve e roda o programa no app." },
  ];
  return (
    <>
      <Titulo texto="São poucos passos. Eu ajusto as lições ao seu ritmo.">Vamos montar sua trilha</Titulo>
      {destaques.map((d, i) => (
        <div
          key={d.titulo}
          className="animate-fade-in-up flex items-center gap-3.5 rounded-2xl border-2 border-border bg-card/90 px-3.5 py-3"
          style={{ animationDelay: `${150 + i * 90}ms` }}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">{d.icone}</span>
          <span className="min-w-0">
            <span className="block text-[0.95rem] font-black text-foreground">{d.titulo}</span>
            <span className="block text-xs font-semibold text-muted-foreground">{d.texto}</span>
          </span>
        </div>
      ))}
      <p aria-hidden className="mt-4 flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">
        <span className="zc-niv-arrasta size-7 rounded-full bg-primary/80" />
        Arraste para o lado
      </p>
    </>
  );
}

type FaseDaLinguagem = { tipo: "lista" } | { tipo: "gosto" } | { tipo: "sugestao"; slug: string; porque: string };

function PaginaDaLinguagem({
  fase,
  setFase,
  languages,
  interesse,
  escolhida,
  onEscolher,
  onInteresse,
  onAceitarSugestao,
}: {
  fase: FaseDaLinguagem;
  setFase: (f: FaseDaLinguagem) => void;
  languages: { id: string; name: string }[];
  interesse?: { title: string; subtitle?: string; options: { id: string; label: string }[] };
  escolhida: string | null;
  onEscolher: (id: string, indice: number) => void;
  onInteresse: (id: string) => void;
  onAceitarSugestao: (slug: string) => void;
}) {
  if (fase.tipo === "gosto" && interesse) {
    return (
      <>
        <button type="button" onClick={() => setFase({ tipo: "lista" })} className="flex w-fit items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" weight="bold" /> Ver todas as linguagens
        </button>
        <Titulo texto={interesse.subtitle}>{interesse.title}</Titulo>
        {interesse.options.map((o, i) => (
          <CartaoDeEscolha key={o.id} ordem={i} selecionado={false} titulo={o.label} icone={<IconeDaOpcao optionId={o.id} />} onClick={() => onInteresse(o.id)} />
        ))}
      </>
    );
  }
  if (fase.tipo === "sugestao") {
    const l = languages.find((x) => x.id === fase.slug);
    return (
      <div className="animate-pop-in flex flex-col items-center gap-4 pt-4 text-center">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">Nossa sugestão</p>
        <span className="flex size-24 items-center justify-center rounded-[28px] border-2 border-primary/30 bg-primary/10">
          <LanguageIcon id={fase.slug} name={l?.name} className="size-12" />
        </span>
        <h1 className="text-[1.75rem] font-black leading-tight text-foreground">Comece com {l?.name}</h1>
        {fase.porque && <p className="max-w-sm text-sm font-semibold leading-relaxed text-muted-foreground">{fase.porque}</p>}
        <BotaoRelevo className="w-full max-w-sm" onClick={() => onAceitarSugestao(fase.slug)}>
          Começar com {l?.name}
        </BotaoRelevo>
        <button type="button" onClick={() => setFase({ tipo: "lista" })} className="min-h-11 text-sm font-bold text-muted-foreground hover:text-primary">
          Prefiro escolher outra
        </button>
      </div>
    );
  }
  return (
    <>
      <Titulo>Qual linguagem você quer aprender?</Titulo>
      <div className="animate-fade-in-up flex flex-col gap-1 rounded-3xl border-2 border-border bg-card/90 p-2">
        {languages.map((l, i) => {
          const sel = escolhida === l.id;
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={sel}
              onClick={() => onEscolher(l.id, i)}
              style={{ animationDelay: `${80 + i * 50}ms` }}
              className={cn(
                "animate-fade-in-up flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150",
                sel ? "bg-primary/10" : "hover:bg-muted/70",
              )}
            >
              <LadrilhoCurso curso={{ id: l.id, name: l.name, icon: "" }} px={44} largura={62} />
              <span className={cn("min-w-0 flex-1 truncate text-[0.95rem] font-black", sel ? "text-primary" : "text-foreground")}>{l.name}</span>
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.7,.5,1)]",
                  sel ? "scale-100" : "scale-0",
                )}
              >
                <Check className="size-3.5" weight="bold" />
              </span>
            </button>
          );
        })}
      </div>
      {interesse && (
        <button
          type="button"
          onClick={() => setFase({ tipo: "gosto" })}
          className="animate-fade-in-up flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-4 text-sm font-bold text-muted-foreground hover:border-primary/50 hover:text-primary"
          style={{ animationDelay: `${80 + languages.length * 60}ms` }}
        >
          <IconeDuo icone={Question} className="size-6" /> Não sei qual escolher
        </button>
      )}
    </>
  );
}

function PaginaDePergunta({
  pergunta,
  linguagem,
  resposta,
  marcadas,
  onResponder,
  onAlternar,
}: {
  pergunta: { id: string; title: string; subtitle?: string; type: string; options: { id: string; label: string; disabled?: boolean }[] };
  linguagem: string;
  resposta?: string;
  marcadas: string[];
  onResponder: (qid: string, oid: string, indice: number) => void;
  onAlternar: (qid: string, oid: string, indice: number) => void;
}) {
  const varias = pergunta.type === "multiple-choice";
  const titulo = pergunta.title.replace("{{language}}", linguagem);
  const opcoes = pergunta.options.filter((o) => !o.disabled);
  const subtitulo = pergunta.subtitle ?? (varias ? "Escolha todas as opções que combinam com você." : undefined);
  return (
    <>
      <Titulo texto={subtitulo}>{titulo}</Titulo>
      {opcoes.map((o, i) => {
        if (pergunta.id === "commitment") {
          const minutos = Number.parseInt(o.id, 10);
          const [, descricao] = o.label.split("·").map((s) => s.trim());
          const nivel = Math.min(5, i + 1);
          const sel = resposta === o.id;
          return (
            <CartaoDeEscolha
              key={o.id}
              ordem={i}
              selecionado={sel}
              onClick={() => onResponder(pergunta.id, o.id, i)}
              icone={<span className="text-base font-black">{Number.isFinite(minutos) ? minutos : "•"}</span>}
              titulo={`${Number.isFinite(minutos) ? minutos : ""} min por dia`}
              texto={descricao ? descricao[0].toUpperCase() + descricao.slice(1) : undefined}
              extra={
                <span aria-hidden className="flex gap-[3px]">
                  {[1, 2, 3, 4, 5].map((c) => (
                    <span key={c} className={cn("h-4 w-2 rounded-t-full rounded-b-sm transition-colors", c <= nivel ? (sel ? "bg-orange-500" : "bg-orange-500/40") : "bg-border")} />
                  ))}
                </span>
              }
            />
          );
        }
        if (varias) {
          const m = MOTIVOS[o.id];
          return (
            <CartaoDeEscolha
              key={o.id}
              ordem={i}
              tipo="varias"
              selecionado={marcadas.includes(o.id)}
              onClick={() => onAlternar(pergunta.id, o.id, i)}
              icone={<IconeDaOpcao optionId={o.id} />}
              titulo={m?.titulo ?? o.label}
              texto={m?.texto}
            />
          );
        }
        return (
          <CartaoDeEscolha
            key={o.id}
            ordem={i}
            selecionado={resposta === o.id}
            onClick={() => onResponder(pergunta.id, o.id, i)}
            icone={<IconeDaOpcao optionId={o.id} />}
            titulo={o.label}
          />
        );
      })}
    </>
  );
}

function PaginaDeAvisos({ ativadas, bloqueadas }: { ativadas: boolean; bloqueadas: boolean }) {
  return (
    <>
      <Titulo
        texto={
          bloqueadas
            ? "As notificações do ZulCode estão bloqueadas no celular. Libere nos ajustes do aparelho e volte aqui."
            : "Um aviso por dia, no seu horário. Também aviso quando sua ofensiva estiver em perigo."
        }
      >
        Quer que eu te lembre de estudar?
      </Titulo>
      <VitrineDeAvisos ativadas={ativadas} />
    </>
  );
}

function Fim({
  linguagem,
  metaMinutos,
  nivel,
  inicio,
  avaliaNaLoja,
  avaliou,
  onAvaliar,
  onNaoAvaliar,
  onComecar,
}: {
  linguagem: { id: string; name: string } | null;
  metaMinutos: number | null;
  nivel?: string;
  inicio: InicioDaTrilha;
  avaliaNaLoja: boolean;
  avaliou: boolean;
  onAvaliar: () => void;
  onNaoAvaliar: () => void;
  onComecar: () => void;
}) {
  const pulou = inicio && inicio.unidade > 1;
  const linhas = [
    { icone: <LanguageIcon id={linguagem?.id ?? ""} name={linguagem?.name} className="size-5" />, rotulo: "Linguagem", valor: linguagem?.name ?? "—" },
    { icone: <IconeDuo icone={Target} className="size-7 text-primary" />, rotulo: "Meta diária", valor: metaMinutos ? `${metaMinutos} min por dia` : "No seu ritmo" },
    {
      icone: <IconeDuo icone={Flag} className="size-7 text-emerald-500" />,
      rotulo: "Você começa em",
      valor: pulou ? `Unidade ${inicio.unidade}${inicio.titulo ? `: ${inicio.titulo}` : ""}` : nivel === "beginner" ? "Unidade 1, do começo" : "Unidade 1",
    },
  ];
  return (
    <>
      <main className="zc-scroll-hidden relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6 pt-4">
        <Titulo texto="Dá para mudar a meta e a linguagem depois, nas configurações.">Sua trilha está pronta!</Titulo>
        {linhas.map((l, i) => (
          <div key={l.rotulo} className="animate-fade-in-up flex items-center gap-3.5 rounded-2xl border-2 border-border bg-card/90 px-3.5 py-3" style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">{l.icone}</span>
            <span className="min-w-0">
              <span className="block text-[0.7rem] font-black uppercase tracking-[0.08em] text-muted-foreground">{l.rotulo}</span>
              <span className="block text-[0.95rem] font-black text-foreground">{l.valor}</span>
            </span>
          </div>
        ))}
        {pulou && inicio.xp > 0 && (
          <p className="animate-fade-in-up flex items-center gap-2 rounded-2xl bg-amber-400/15 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-300">
            <DuoXp className="size-6" /> Você ganhou {inicio.xp} XP pelas unidades que já sabia.
          </p>
        )}
        {avaliaNaLoja && (
          <div className="animate-fade-in-up mt-1 flex flex-col items-center gap-2.5 rounded-3xl border-2 border-border bg-card/90 px-4 py-5 text-center" style={{ animationDelay: "420ms" }}>
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} weight="fill" className="zc-niv-estrela size-10 text-amber-400" style={{ animationDelay: `${650 + i * 140}ms` }} />
              ))}
            </div>
            <p className="text-lg font-black text-foreground">{avaliou ? "Valeu demais!" : "Está curtindo o ZulCode?"}</p>
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              {avaliou
                ? "Sua avaliação ajuda o Zul a chegar em mais gente. Agora bora para a primeira lição!"
                : "Uma avaliação na Play Store ajuda muito o app a crescer. Leva poucos segundos."}
            </p>
          </div>
        )}
      </main>
      <footer className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-1 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
        {avaliaNaLoja ? (
          <>
            <BotaoRelevo className="w-full" onClick={onAvaliar}>
              {avaliou ? "Começar a trilha" : "Avaliar na Play Store"}
            </BotaoRelevo>
            <button type="button" onClick={onNaoAvaliar} className={cn("min-h-11 text-sm font-black uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground", avaliou && "invisible")}>
              Agora não, começar
            </button>
          </>
        ) : (
          <BotaoRelevo className="w-full" onClick={onComecar}>
            Começar a estudar
          </BotaoRelevo>
        )}
      </footer>
    </>
  );
}
