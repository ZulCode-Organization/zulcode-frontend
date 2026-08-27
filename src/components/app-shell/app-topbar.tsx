"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Coins, Feather, Flame, ShieldCheck } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { useCursos } from "@/hooks/use-cursos";
import { cn } from "@/lib/utils";
import { TopbarPopover, TopbarSheet, useEhMobile } from "./topbar-overlay";
import { FaixaCursosMobile, LadrilhoCurso, ListaCursosDesktop, TelaTodosCursos, fundoDoCurso, raioDoLadrilho, useMeusCursos } from "./topbar-cursos";
import { PainelOfensiva } from "./topbar-ofensiva";
import { PainelMoedas } from "./topbar-moedas";
import { PainelVidas } from "./topbar-vidas";

type Painel = "curso" | "ofensiva" | "moedas" | "vidas" | "todos-cursos" | null;

/** Ladrilho do curso: retângulo deitado nos dois tamanhos de tela. */
const CURSO_ALTURA = { mobile: 42, desktop: 44 };
const CURSO_LARGURA = { mobile: 60, desktop: 64 };
/** A base sólida atrás do botão. Zero no celular: no ladrilho pequeno a faixa
 * escura pesava demais contra o fundo, então lá ele é chapado. */
const CURSO_BASE = { mobile: 0, desktop: 3 };
/** Quanto a face desce ao ser apertada. Independe da base: o retorno ao
 * toque tem que existir nos dois tamanhos, com ou sem peça atrás. */
const CURSO_AFUNDA = { mobile: 3, desktop: 3 };

interface ChipProps {
  rotulo: string;
  cor?: string;
  aberto: boolean;
  onClick: () => void;
  children: ReactNode;
}

/**
 * Chip de ofensiva, moedas e penas. No celular é só ícone + número, como na
 * referência; do lg pra cima (mesmo corte que liga a sidebar) ele ganha a
 * moldura do card. A peça afunda ao ser apertada com a sombra sumindo junto —
 * o `zc-press` de sempre.
 *
 * O botão de curso não passa por aqui: ele é montado em duas camadas, com
 * base sólida na cor do próprio curso, como o cabeçalho da Jornada.
 */
function Chip({ rotulo, cor, aberto, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      aria-haspopup="dialog"
      aria-expanded={aberto}
      className={cn(
        // zc-chip-sombra, e não zc-press-shadow: a sombra sólida só existe do
        // lg pra cima, onde o chip tem o corpo do card pra apoiar. No celular
        // ele é só ícone + número, e a barra escura ficaria solta embaixo.
        "zc-press zc-chip-sombra flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-1 text-[1.05rem] font-extrabold transition-colors duration-150",
        "lg:w-auto lg:gap-2 lg:border lg:bg-card lg:px-2.5 lg:text-[0.95rem]",
        aberto ? "bg-muted lg:border-primary lg:bg-card" : "lg:border-border",
        cor
      )}
      style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.18)" }}
    >
      {children}
    </button>
  );
}

/**
 * Barra de status fixa no topo do conteúdo. A ordem é a da referência —
 * curso, ofensiva, moedas e penas — e cada chip abre o próprio painel:
 * popover ancorado no ícone no desktop, tela cheia subindo de baixo no
 * celular (o seletor de curso, no celular, é a faixa que abre logo abaixo da
 * barra).
 *
 * Cada chip só mostra número quando a API devolve o campo de verdade — um
 * número ali seria saldo inventado.
 */
export function AppTopBar() {
  const { perfil, loading } = usePerfil();
  const { cursos, cursoAtual, selecionarCurso } = useCursos();
  const meusCursos = useMeusCursos(perfil?.id, cursoAtual);
  const ehMobile = useEhMobile();
  const [painel, setPainel] = useState<Painel>(null);
  const [cursoAfundado, setCursoAfundado] = useState(false);
  const barraRef = useRef<HTMLDivElement>(null);

  // Cada chip é a âncora do próprio popover, que vive num portal no body.
  const ancoraCurso = useRef<HTMLDivElement>(null);
  const ancoraOfensiva = useRef<HTMLDivElement>(null);
  const ancoraMoedas = useRef<HTMLDivElement>(null);
  const ancoraVidas = useRef<HTMLDivElement>(null);

  // Publica a altura real da barra em --zc-topbar-h. O cabeçalho da Jornada
  // gruda logo abaixo dela, e antes esse encaixe era um 72px chutado no CSS —
  // que passava a mentir sempre que a barra mudava de altura entre
  // breakpoints. Medindo, os dois ficam encostados em qualquer largura.
  useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return;
    const publicar = () =>
      document.documentElement.style.setProperty("--zc-topbar-h", `${Math.round(barra.getBoundingClientRect().height)}px`);

    publicar();
    const observador = new ResizeObserver(publicar);
    observador.observe(barra);
    return () => {
      observador.disconnect();
      document.documentElement.style.removeProperty("--zc-topbar-h");
    };
  }, []);

  const fechar = () => setPainel(null);
  const alternar = (alvo: Exclude<Painel, null>) => setPainel((atual) => (atual === alvo ? null : alvo));

  /** `teto` corta o número no chip pra ele não empurrar os vizinhos: acima
   * dele vira "teto+". O valor cheio continua aparecendo dentro do painel. */
  const valor = (numero: number | null | undefined, teto?: number) => {
    if (loading || !perfil) return "…";
    if (typeof numero !== "number") return null;
    if (teto !== undefined && numero > teto) return `${teto}+`;
    return numero.toLocaleString("pt-BR");
  };

  const curso = cursos.find((item) => item.id === cursoAtual);
  const protecoes = perfil?.streakFreezes ?? 0;

  const trocarCurso = (slug: string) => {
    selecionarCurso(slug);
    fechar();
  };

  const propsDaLista = {
    cursos,
    cursoAtual,
    meusCursos,
    onSelecionar: trocarCurso,
    onAbrirTodos: () => setPainel("todos-cursos"),
  };

  const baseCurso = ehMobile ? CURSO_BASE.mobile : CURSO_BASE.desktop;
  const cursoAltura = ehMobile ? CURSO_ALTURA.mobile : CURSO_ALTURA.desktop;
  const cursoLargura = ehMobile ? CURSO_LARGURA.mobile : CURSO_LARGURA.desktop;

  const celula = "relative z-30 flex min-w-0 justify-center lg:justify-end";

  return (
    <div ref={barraRef} className="sticky top-0 z-20 bg-background px-3 pb-1 pt-3 sm:px-4 sm:pt-4 lg:pb-0 lg:pl-8 lg:pr-5 xl:pr-7">
      <div className="relative grid grid-cols-4 gap-1 lg:flex lg:items-center lg:justify-end lg:gap-2">
        {/* 1. Curso atual — era o botão do cabeçalho da Jornada, agora vive
            aqui, coladinho na ofensiva. */}
        <div ref={ancoraCurso} className={cn(celula, "justify-start pl-2 lg:pl-0")}>
          {/* Duas camadas, igual ao cabeçalho da Jornada e aos nós da trilha:
              a base é uma peça de verdade na mesma cor do curso, só mais
              escura, e a face desce em cima dela ao ser apertada. Não é
              box-shadow — é o que dá o corpo sólido do botão.
              O -mt no celular sobe só este botão; no desktop ele volta pra
              linha dos outros chips. */}
          <div className="relative -mt-2.5 lg:mt-0">
            {baseCurso > 0 && (
              <span
                aria-hidden
                className="absolute inset-x-0 brightness-75"
                style={{
                  top: baseCurso,
                  bottom: -baseCurso,
                  borderRadius: raioDoLadrilho(cursoAltura),
                  backgroundColor: (curso && fundoDoCurso(curso)) ?? "var(--muted)",
                }}
              />
            )}
            <button
              type="button"
              title={curso ? `Curso: ${curso.name}` : "Trocar de curso"}
              aria-label={curso ? `Curso: ${curso.name}` : "Trocar de curso"}
              aria-haspopup="dialog"
              aria-expanded={painel === "curso"}
              onClick={() => alternar("curso")}
              onPointerDown={() => setCursoAfundado(true)}
              onPointerUp={() => setCursoAfundado(false)}
              onPointerCancel={() => setCursoAfundado(false)}
              onPointerLeave={() => setCursoAfundado(false)}
              className="relative block"
              style={{ top: cursoAfundado ? (ehMobile ? CURSO_AFUNDA.mobile : CURSO_AFUNDA.desktop) : 0, transition: "top 100ms ease" }}
            >
              {curso ? (
                <LadrilhoCurso curso={curso} ativo={painel === "curso"} px={cursoAltura} largura={cursoLargura} />
              ) : (
                <span
                  className="block bg-muted"
                  style={{ width: cursoLargura, height: cursoAltura, borderRadius: raioDoLadrilho(cursoAltura) }}
                  aria-hidden
                />
              )}
            </button>
          </div>
        </div>

        {/* 2. Ofensiva */}
        <div ref={ancoraOfensiva} className={celula}>
          <Chip rotulo="Dias seguidos" cor="text-orange-500" aberto={painel === "ofensiva"} onClick={() => alternar("ofensiva")}>
            <Flame className="size-6 fill-current lg:size-5" />
            {valor(perfil?.streakAtual, 1000)}
            {protecoes > 0 && (
              <span className="flex items-center gap-0.5 text-sky-500" title="Proteções de sequência">
                <ShieldCheck className="size-5 lg:size-4" />
                {protecoes}
              </span>
            )}
          </Chip>
        </div>

        {/* 3. Moedas */}
        <div ref={ancoraMoedas} className={celula}>
          <Chip rotulo="Moedas" cor="text-yellow-500" aberto={painel === "moedas"} onClick={() => alternar("moedas")}>
            <Coins className="size-6 lg:size-5" />
            {valor(perfil?.moedas, 999)}
          </Chip>
        </div>

        {/* 4. Penas: a marca é uma ave, então a vida do app é uma pena dela. */}
        <div ref={ancoraVidas} className={celula}>
          <Chip rotulo="Penas" cor="text-rose-500" aberto={painel === "vidas"} onClick={() => alternar("vidas")}>
            <Feather className="size-6 lg:size-5" />
            {perfil?.isPro ? "∞" : valor(perfil?.vidas)}
          </Chip>
        </div>

        {/* Faixa de cursos do celular: abre logo abaixo da barra, sem empurrar
            o conteúdo (é um menu, não parte do layout). */}
        {ehMobile && painel === "curso" && (
          <>
            <div className="fixed inset-0 z-20 lg:hidden" onClick={fechar} role="presentation" />
            {/* Balão: cresce a partir do canto de cima à esquerda, que é onde
                fica o botão de curso, com a setinha apontando pra ele. */}
            <div className="absolute left-0 right-0 top-full z-30 pt-2 lg:hidden">
              <div className="animate-pop-in relative origin-top-left rounded-[20px] border border-border bg-popover p-3 shadow-2xl">
                <span
                  className="absolute -top-[7px] left-[42px] size-3 rotate-45 border-l border-t border-border bg-popover"
                  aria-hidden
                />
                <div className="relative">
                  <FaixaCursosMobile {...propsDaLista} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popovers do desktop. Ficam fora da grade porque vão pra um portal no
          body — dentro da barra eles eram cortados pelo overflow do container
          e cobertos pelo cabeçalho da Jornada. */}
      {!ehMobile && painel === "curso" && (
        <TopbarPopover ancora={ancoraCurso} rotulo="Meus cursos" alinhamento="inicio" largura={330} onClose={fechar}>
          <ListaCursosDesktop {...propsDaLista} />
        </TopbarPopover>
      )}

      {!ehMobile && painel === "ofensiva" && (
        <TopbarPopover ancora={ancoraOfensiva} rotulo="Ofensiva" largura={380} onClose={fechar}>
          <div className="p-4">
            <PainelOfensiva streakAtual={perfil?.streakAtual ?? 0} streakRecorde={perfil?.streakRecorde ?? 0} protecoes={protecoes} diasProtegidos={perfil?.protectedStreakDays ?? []} onNavegar={fechar} />
          </div>
        </TopbarPopover>
      )}

      {!ehMobile && painel === "moedas" && (
        <TopbarPopover ancora={ancoraMoedas} rotulo="Moedas" largura={320} onClose={fechar}>
          <div className="p-4">
            <PainelMoedas moedas={perfil?.moedas ?? null} onNavegar={fechar} />
          </div>
        </TopbarPopover>
      )}

      {!ehMobile && painel === "vidas" && (
        <TopbarPopover ancora={ancoraVidas} rotulo="Penas" alinhamento="fim" largura={360} onClose={fechar}>
          <div className="p-4">
            <PainelVidas onNavegar={fechar} />
          </div>
        </TopbarPopover>
      )}

      {/* Telas cheias do celular */}
      {ehMobile && painel === "ofensiva" && (
        <TopbarSheet titulo="Ofensiva" onClose={fechar}>
          <PainelOfensiva streakAtual={perfil?.streakAtual ?? 0} streakRecorde={perfil?.streakRecorde ?? 0} protecoes={protecoes} diasProtegidos={perfil?.protectedStreakDays ?? []} onNavegar={fechar} />
        </TopbarSheet>
      )}

      {ehMobile && painel === "moedas" && (
        <TopbarSheet titulo="Moedas" onClose={fechar}>
          <PainelMoedas moedas={perfil?.moedas ?? null} onNavegar={fechar} />
        </TopbarSheet>
      )}

      {ehMobile && painel === "vidas" && (
        <TopbarSheet titulo="Penas" onClose={fechar}>
          <PainelVidas onNavegar={fechar} />
        </TopbarSheet>
      )}

      {/* Catálogo inteiro — abre pelo "+" nos dois tamanhos, porque é uma tela
          de escolha, não um menu. */}
      {painel === "todos-cursos" && (
        <TopbarSheet
          titulo="Cursos"
          direita={
            <span className="flex items-center gap-1 text-[0.9rem] font-black text-yellow-500">
              <Coins className="size-4.5" />
              {valor(perfil?.moedas, 999)}
            </span>
          }
          onClose={fechar}
        >
          <TelaTodosCursos cursos={cursos} cursoAtual={cursoAtual} meusCursos={meusCursos} onSelecionar={trocarCurso} />
        </TopbarSheet>
      )}
    </div>
  );
}
