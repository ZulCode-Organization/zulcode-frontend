"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { usePerfil } from "@/hooks/use-perfil";
import { useCursos } from "@/hooks/use-cursos";
import { cn } from "@/lib/utils";
import { TopbarPopover, TopbarSheet, useEhMobile } from "./topbar-overlay";
import { FaixaCursosMobile, LadrilhoCurso, ListaCursosDesktop, TelaTodosCursos, fundoDoCurso, raioDoLadrilho, useMeusCursos } from "./topbar-cursos";
import { PainelOfensiva } from "./topbar-ofensiva";
import { PainelMoedas } from "./topbar-moedas";
import { PainelVidas } from "./topbar-vidas";
import { PenaDesgastada, PenaInfinita } from "@/components/shared/pena-desgastada";
import { Rupee } from "@/components/shared/rupee";
import { sequenciaAtivaHoje } from "@/lib/sequencia";

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
  // A faixa de cursos do celular precisa sobreviver ao clique que a fecha:
  // sem isso o React a desmonta na hora e ela some de uma vez, sem recolher.
  // Quem a tira do DOM é o animationend do recolhimento.
  const [faixaRecolhendo, setFaixaRecolhendo] = useState(false);
  const barraRef = useRef<HTMLDivElement>(null);

  // Os chips so existem na trilha. Em Loja, Perfil, Metas e companhia
  // eles nao tinham o que fazer: sao atalhos do estudo, e ali so repetiam
  // informacao que a propria pagina ja mostra.
  const naTrilha = usePathname() === "/home";

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

  const fechar = () => {
    if (ehMobile && painel === "curso") setFaixaRecolhendo(true);
    setPainel(null);
  };
  const alternar = (alvo: Exclude<Painel, null>) => {
    if (painel === alvo) {
      fechar();
      return;
    }
    setFaixaRecolhendo(false);
    setPainel(alvo);
  };

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

  // O fogo so acende quando a sequencia existe e foi feita hoje. Zero apaga,
  // e "fiz ontem, hoje ainda nao" tambem — nos dois casos a pessoa precisa
  // estudar, e uma chama acesa ali diria o contrario.
  const sequenciaAcesa = sequenciaAtivaHoje(perfil?.streakAtual, perfil?.ultimaAtividade);

  const baseCurso = ehMobile ? CURSO_BASE.mobile : CURSO_BASE.desktop;
  const cursoAltura = ehMobile ? CURSO_ALTURA.mobile : CURSO_ALTURA.desktop;
  const cursoLargura = ehMobile ? CURSO_LARGURA.mobile : CURSO_LARGURA.desktop;

  const celula = "relative z-30 flex min-w-0 justify-center lg:justify-end";

  // Fora da trilha sobra so o respiro do topo. E a mesma div medida, entao
  // --zc-topbar-h continua sendo publicada (agora com a altura menor) e o
  // painel da direita gruda no lugar certo em vez de cair no fallback de 72px.
  if (!naTrilha) {
    return <div ref={barraRef} className="sticky top-0 z-20 bg-background px-3 pt-3 sm:px-4 sm:pt-4" />;
  }

  return (
    <div ref={barraRef} className="sticky top-0 z-20 bg-background px-3 pb-1 pt-3 sm:px-4 sm:pt-4 lg:pb-0 lg:pl-8 lg:pr-5 xl:pr-7">
      <div className="relative grid grid-cols-4 items-center gap-1 lg:flex lg:items-center lg:justify-end lg:gap-2">
        {/* 1. Curso atual — era o botão do cabeçalho da Jornada, agora vive
            aqui, coladinho na ofensiva. */}
        <div ref={ancoraCurso} className={cn(celula, "lg:justify-end")}>
          {/* Duas camadas, igual ao cabeçalho da Jornada e aos nós da trilha:
              a base é uma peça de verdade na mesma cor do curso, só mais
              escura, e a face desce em cima dela ao ser apertada. Não é
              box-shadow — é o que dá o corpo sólido do botão.
              No celular ele fica na mesma linha e no mesmo eixo dos outros
              chips: a coluna centraliza e o items-center da grade alinha. */}
          <div className="relative">
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
          <Chip
            rotulo={sequenciaAcesa ? "Dias seguidos" : "Estude hoje para manter a sequência"}
            cor={sequenciaAcesa ? "text-blue-600" : "text-muted-foreground"}
            aberto={painel === "ofensiva"}
            onClick={() => alternar("ofensiva")}
          >
            <ChamaDupla className="size-7 lg:size-6" aceso={sequenciaAcesa} />
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
          <Chip rotulo="Moedas" cor="text-emerald-500" aberto={painel === "moedas"} onClick={() => alternar("moedas")}>
            <Rupee className="size-6 lg:size-5" />
            {valor(perfil?.moedas, 999)}
          </Chip>
        </div>

        {/* 4. Penas: a marca é uma ave, então a vida do app é uma pena dela. */}
        <div ref={ancoraVidas} className={celula}>
          <Chip
            rotulo={perfil?.isPro ? "Penas ilimitadas" : "Penas"}
            cor={perfil?.isPro ? "text-violet-500" : "text-rose-500"}
            aberto={painel === "vidas"}
            onClick={() => alternar("vidas")}
          >
            {perfil?.isPro ? (
              <PenaInfinita className="size-6 lg:size-5" />
            ) : (
              <>
                <PenaDesgastada restantes={perfil?.vidas ?? 5} className="size-6 lg:size-5" />
                {valor(perfil?.vidas)}
              </>
            )}
          </Chip>
        </div>

        {/* Faixa de cursos do celular: desce de trás da barra, cobrindo o
            conteúdo sem empurrá-lo (é um menu, não parte do layout). */}
        {ehMobile && (painel === "curso" || faixaRecolhendo) && (
          <>
            {/* Escurece o que está embaixo pra faixa virar o foco. Começa no
                fim da barra, e não em inset-0: cobrindo a barra também, os
                próprios chips apagariam junto. */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-20 bg-background/70 lg:hidden",
                faixaRecolhendo ? "zc-cursos-fundo-sai" : "zc-cursos-fundo"
              )}
              style={{ top: "var(--zc-topbar-h, 0px)" }}
              onClick={fechar}
              role="presentation"
            />
            <div className="absolute inset-x-0 top-full z-30 lg:hidden">
              {/* O quadro parado: sangra até as bordas da tela (o -mx cancela o
                  px do container), recorta a faixa e segura a linha que separa
                  da barra. Transparente de propósito — a cor vai no pedaço que
                  se move, logo abaixo. */}
              <div className="-mx-3 overflow-hidden border-t border-border sm:-mx-4">
                {/* O pedaço que se move, fundo incluso. O fundo precisa viajar
                    junto: parado no quadro de cima, ele ficava na altura cheia
                    enquanto o conteúdo subia e só sumia de uma vez no fim — era
                    a engasgada do recolhimento.

                    Recortado pelo pai, nasce inteiro acima e desce, então
                    aparece de baixo pra cima: primeiro os nomes, depois os
                    ladrilhos. */}
                <div
                  className={cn(
                    "bg-background px-3 pb-3 pt-3 sm:px-4",
                    faixaRecolhendo ? "zc-cursos-sobe" : "zc-cursos-desce"
                  )}
                  // Só o fim do recolhimento desmonta. O mesmo evento dispara
                  // ao abrir, daí a guarda do estado; e a do alvo garante que uma
                  // animação de algum filho não arranque a faixa da tela no meio.
                  onAnimationEnd={(evento) => {
                    if (evento.target !== evento.currentTarget) return;
                    if (faixaRecolhendo) setFaixaRecolhendo(false);
                  }}
                >
                  <FaixaCursosMobile {...propsDaLista} />
                </div>
              </div>
              {/* Bico apontando pro botão de curso. Ele é a 1ª de 4 colunas
                  iguais e fica centralizado nela, então o centro cai em 12,5%
                  da largura — medida, não chutada. */}
              <span
                className="absolute top-0 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-border bg-background"
                style={{ left: "12.5%" }}
                aria-hidden
              />
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
            <span className="flex items-center gap-1 text-[0.9rem] font-black text-emerald-500">
              <Rupee className="size-4.5" />
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
