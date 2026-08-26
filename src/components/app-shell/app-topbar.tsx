"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Coins, Feather, Flame, ShieldCheck } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { useCursos } from "@/hooks/use-cursos";

import { cn } from "@/lib/utils";
import { TopbarPopover, TopbarSheet, useEhMobile } from "./topbar-overlay";
import { FaixaCursosMobile, LadrilhoCurso, ListaCursosDesktop, TelaTodosCursos, useMeusCursos } from "./topbar-cursos";
import { PainelOfensiva } from "./topbar-ofensiva";
import { PainelMoedas } from "./topbar-moedas";
import { PainelVidas } from "./topbar-vidas";

type Painel = "curso" | "ofensiva" | "moedas" | "vidas" | "todos-cursos" | null;

interface ChipProps {
  rotulo: string;
  cor?: string;
  aberto: boolean;
  onClick: () => void;
  /** O chip do curso não tem moldura em tamanho nenhum: o próprio ladrilho
   * quadrado já é o botão, igual no celular. Sem isso, no desktop ele virava
   * uma pílula (rounded-2xl num chip de 44px é quase um círculo) em volta do
   * ícone. */
  semMoldura?: boolean;
  children: ReactNode;
}

/**
 * Chip da barra de status. No celular é só ícone + número, como na
 * referência; do lg pra cima (mesmo corte que liga a sidebar) ele ganha a
 * moldura do card e a sombra sólida do `zc-press` — a mesma peça que afunda
 * ao ser tocada no botão da Jornada.
 */
function Chip({ rotulo, cor, aberto, onClick, semMoldura = false, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      aria-haspopup="dialog"
      aria-expanded={aberto}
      className={cn(
        "zc-press flex min-w-0 items-center justify-center gap-1.5 text-[0.8rem] font-extrabold transition-colors duration-150",
        semMoldura
          ? // Sem moldura o próprio ladrilho define a altura do botão.
            "rounded-[28%]"
          : [
              "zc-chip-sombra h-10 rounded-2xl px-1",
              "lg:h-11 lg:w-auto lg:gap-2 lg:border lg:bg-card lg:px-4 lg:text-[0.95rem]",
              aberto ? "bg-muted lg:border-primary lg:bg-card" : "lg:border-border",
            ],
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
  const barraRef = useRef<HTMLDivElement>(null);

  // Publica a altura real da barra em --zc-topbar-h. O cabeçalho da Jornada
  // gruda logo abaixo dela, e antes esse encaixe era um 72px chutado no CSS —
  // que passava a mentir sempre que a barra mudava de altura (chip de 40 no
  // celular, 44 no desktop, padding diferente por breakpoint). Medindo, os
  // dois ficam encostados em qualquer largura.
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

  const valor = (numero: number | null | undefined) => {
    if (loading || !perfil) return "…";
    return typeof numero === "number" ? numero.toLocaleString("pt-BR") : null;
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

  return (
    <div ref={barraRef} className="sticky top-0 z-20 bg-background px-3 pb-0 pt-3 sm:px-4 sm:pt-4 lg:px-8">
      <div className="relative grid grid-cols-4 gap-1 lg:flex lg:items-center lg:justify-end lg:gap-3">
        {/* 1. Curso atual — era o botão do cabeçalho da Jornada, agora vive
            aqui, coladinho na ofensiva. */}
        <div className="relative z-30 flex min-w-0 justify-center lg:justify-end">
          <Chip
            rotulo={curso ? `Curso: ${curso.name}` : "Trocar de curso"}
            aberto={painel === "curso"}
            onClick={() => alternar("curso")}
            semMoldura
          >
            {curso ? (
              <LadrilhoCurso curso={curso} ativo={painel === "curso"} px={ehMobile ? 42 : 44} />
            ) : (
              <span className="rounded-[28%] bg-muted" style={{ width: ehMobile ? 42 : 44, height: ehMobile ? 42 : 44 }} aria-hidden />
            )}
          </Chip>

          {!ehMobile && painel === "curso" && (
            <TopbarPopover rotulo="Meus cursos" alinhamento="inicio" onClose={fechar}>
              <ListaCursosDesktop {...propsDaLista} />
            </TopbarPopover>
          )}
        </div>

        {/* 2. Ofensiva */}
        <div className="relative z-30 flex min-w-0 justify-center lg:justify-end">
          <Chip rotulo="Dias seguidos" cor="text-orange-500" aberto={painel === "ofensiva"} onClick={() => alternar("ofensiva")}>
            <Flame className="size-5 fill-current" />
            {valor(perfil?.streakAtual)}
            {protecoes > 0 && (
              <span className="flex items-center gap-0.5 text-sky-500" title="Proteções de sequência">
                <ShieldCheck className="size-4" />
                {protecoes}
              </span>
            )}
          </Chip>

          {!ehMobile && painel === "ofensiva" && (
            <TopbarPopover rotulo="Ofensiva" largura="w-[360px]" onClose={fechar}>
              <div className="p-4">
                <PainelOfensiva streakAtual={perfil?.streakAtual ?? 0} streakRecorde={perfil?.streakRecorde ?? 0} protecoes={protecoes} onNavegar={fechar} />
              </div>
            </TopbarPopover>
          )}
        </div>

        {/* 3. Moedas */}
        <div className="relative z-30 flex min-w-0 justify-center lg:justify-end">
          <Chip rotulo="Moedas" cor="text-yellow-500" aberto={painel === "moedas"} onClick={() => alternar("moedas")}>
            <Coins className="size-5" />
            {valor(perfil?.moedas)}
          </Chip>

          {!ehMobile && painel === "moedas" && (
            <TopbarPopover rotulo="Moedas" onClose={fechar}>
              <div className="p-4">
                <PainelMoedas moedas={perfil?.moedas ?? null} onNavegar={fechar} />
              </div>
            </TopbarPopover>
          )}
        </div>

        {/* 4. Penas: a marca é uma ave, então a vida do app é uma pena dela. */}
        <div className="relative z-30 flex min-w-0 justify-center lg:justify-end">
          <Chip rotulo="Penas" cor="text-rose-500" aberto={painel === "vidas"} onClick={() => alternar("vidas")}>
            <Feather className="size-5" />
            {perfil?.isPro ? "∞" : valor(perfil?.vidas)}
          </Chip>

          {!ehMobile && painel === "vidas" && (
            <TopbarPopover rotulo="Penas" alinhamento="fim" onClose={fechar}>
              <div className="p-4">
                <PainelVidas onNavegar={fechar} />
              </div>
            </TopbarPopover>
          )}
        </div>

        {/* Faixa de cursos do celular: abre logo abaixo da barra, sem empurrar
            o conteúdo (é um menu, não parte do layout). */}
        {ehMobile && painel === "curso" && (
          <>
            <div className="fixed inset-0 z-20 lg:hidden" onClick={fechar} role="presentation" />
            <div className="absolute left-0 right-0 top-full z-30 bg-background px-3 pt-3 shadow-xl lg:hidden">
              <FaixaCursosMobile {...propsDaLista} />
            </div>
          </>
        )}
      </div>

      {/* Telas cheias do celular */}
      {ehMobile && painel === "ofensiva" && (
        <TopbarSheet titulo="Ofensiva" onClose={fechar}>
          <PainelOfensiva streakAtual={perfil?.streakAtual ?? 0} streakRecorde={perfil?.streakRecorde ?? 0} protecoes={protecoes} onNavegar={fechar} />
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
              {valor(perfil?.moedas)}
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
