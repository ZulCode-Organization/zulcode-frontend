"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePerfil } from "@/hooks/use-perfil";
import { useCursos } from "@/hooks/use-cursos";
import { cn } from "@/lib/utils";
import { TopbarPopover, TopbarSheet, useEhMobile } from "./topbar-overlay";
import { FaixaCursosMobile, LadrilhoCurso, ListaCursosDesktop, TelaTodosCursos, fundoDoCurso, raioDoLadrilho, useMeusCursos } from "./topbar-cursos";
import { PainelOfensiva } from "./topbar-ofensiva";
import { PainelMoedas } from "./topbar-moedas";
import { PainelVidas } from "./topbar-vidas";
import { Rupee } from "@/components/shared/rupee";
import { sequenciaAtivaHoje } from "@/lib/sequencia";
import { DIVISOES, divisaoDoXp } from "@/lib/divisoes";
import { useMudanca } from "@/lib/motion/mudancas";
import { mostrarSeloDeDivisao } from "@/lib/motion/efeitos";
import { ChipOfensiva, ChipPenas, ChipRupees } from "./barra-viva/chips-vivos";

type Painel = "curso" | "ofensiva" | "moedas" | "vidas" | "todos-cursos" | null;

/** Ladrilho do curso: retângulo deitado nos dois tamanhos de tela. */
const CURSO_ALTURA = { mobile: 36, desktop: 44 };
const CURSO_LARGURA = { mobile: 52, desktop: 64 };
/** A base sólida atrás do botão. Zero no celular: no ladrilho pequeno a faixa
 * escura pesava demais contra o fundo, então lá ele é chapado. */
const CURSO_BASE = { mobile: 0, desktop: 3 };
/** Quanto a face desce ao ser apertada. Independe da base: o retorno ao
 * toque tem que existir nos dois tamanhos, com ou sem peça atrás. */
const CURSO_AFUNDA = { mobile: 3, desktop: 3 };

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
  const { perfil, loading, atualizar } = usePerfil();
  const { cursos, cursoAtual, selecionarCurso } = useCursos();
  const meusCursos = useMeusCursos(perfil?.id, cursoAtual);
  const ehMobile = useEhMobile();
  const [painel, setPainel] = useState<Painel>(null);
  // 18. Painel fixado por segurar o chip: não fecha ao clicar fora, para dar
  // pra comparar com outra coisa da tela.
  const [fixado, setFixado] = useState(false);
  const grupoRef = useRef<HTMLDivElement>(null);
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
    setFixado(false);
  };
  const alternar = (alvo: Exclude<Painel, null>) => {
    if (painel === alvo) {
      fechar();
      return;
    }
    setFaixaRecolhendo(false);
    setFixado(false);
    setPainel(alvo);
  };
  const fixar = (alvo: Exclude<Painel, null>) => {
    setFaixaRecolhendo(false);
    setPainel(alvo);
    setFixado(true);
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

  // Voltar para a trilha busca os números de novo, em silêncio. É o que faz a
  // barra ver as 30 rupees ganhas na lição e animar a diferença — o perfil
  // estava em cache desde antes da lição.
  useEffect(() => {
    if (naTrilha) atualizar();
  }, [naTrilha, atualizar]);

  // 17. Atalhos: S, R, V e C. Só sem modificador e fora de campo de texto —
  // ninguém pode perder um "r" digitado porque abriu o painel de rupees.
  const alternarRef = useRef(alternar);
  useEffect(() => { alternarRef.current = alternar; });
  useEffect(() => {
    if (!naTrilha) return;
    const mapa: Record<string, Exclude<Painel, null>> = { s: "ofensiva", r: "moedas", v: "vidas", c: "curso" };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.repeat) return;
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='dialog']")) return;
      const destino = mapa[evento.key.toLowerCase()];
      if (!destino) return;
      evento.preventDefault();
      alternarRef.current(destino);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [naTrilha]);

  // 20. Divisão nova: o índice da divisão sobe, e um selo desce de baixo dos
  // chips. Descer de divisão não acontece (o XP não cai), mas se acontecer não
  // há o que comemorar.
  const indiceDaDivisao = typeof perfil?.xp === "number"
    ? DIVISOES.findIndex((item) => item.id === divisaoDoXp(perfil.xp).id)
    : null;
  const mudancaDeDivisao = useMudanca(perfil?.id && naTrilha ? `${perfil.id}:divisao` : null, indiceDaDivisao);
  useEffect(() => {
    const ancora = grupoRef.current;
    if (!mudancaDeDivisao || !ancora || mudancaDeDivisao.para <= mudancaDeDivisao.de) return;
    const divisao = DIVISOES[mudancaDeDivisao.para];
    if (divisao) mostrarSeloDeDivisao(ancora, divisao.nome, divisao.cor, 900);
  }, [mudancaDeDivisao]);

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
    <div ref={barraRef} className="sticky top-0 z-20 bg-background px-3 pb-1 pt-2 sm:px-4 sm:pt-4 lg:pb-0 lg:pl-8 lg:pr-5 xl:pr-7">
      {/* No computador os chips ficam centralizados com o painel da direita, e
          nao encostados na borda. As larguras sao a area util do painel: ele
          tem 340px com px-5 (sobram 300) e 410px com px-7 no xl (sobram 354).
          Como o respiro lateral desta barra ja e o mesmo do painel, uma caixa
          dessa largura encostada a direita cai exatamente em cima do card.

          O espacamento divide esse orcamento com os chips, que somam 248px:
          sobram ~17px por vao no lg e ~35px no xl. Dai o gap-3/gap-5 -- com
          numeros grandes (99999 rupees) os chips crescem, e o que sobra e a
          margem que impede eles de passarem do card. */}
      <div ref={grupoRef} className="relative grid grid-cols-4 items-center gap-1 lg:ml-auto lg:flex lg:w-[300px] lg:items-center lg:justify-center lg:gap-3 xl:w-[354px] xl:gap-5">
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
          <ChipOfensiva
            contaId={perfil?.id ?? null}
            carregando={loading || !perfil}
            aberto={painel === "ofensiva"}
            aoAbrir={() => alternar("ofensiva")}
            aoSegurar={() => fixar("ofensiva")}
            dias={typeof perfil?.streakAtual === "number" ? perfil.streakAtual : null}
            acesa={sequenciaAcesa}
            protegido={protecoes > 0}
            recorde={perfil?.streakRecorde ?? 0}
            protegidos={perfil?.protectedStreakDays ?? []}
          />
        </div>

        {/* 3. Rupees */}
        <div ref={ancoraMoedas} className={celula}>
          <ChipRupees
            contaId={perfil?.id ?? null}
            carregando={loading || !perfil}
            aberto={painel === "moedas"}
            aoAbrir={() => alternar("moedas")}
            aoSegurar={() => fixar("moedas")}
            moedas={typeof perfil?.moedas === "number" ? perfil.moedas : null}
          />
        </div>

        {/* 4. Penas: a marca é uma ave, então a vida do app é uma pena dela. */}
        <div ref={ancoraVidas} className={celula}>
          <ChipPenas
            contaId={perfil?.id ?? null}
            carregando={loading || !perfil}
            aberto={painel === "vidas"}
            aoAbrir={() => alternar("vidas")}
            aoSegurar={() => fixar("vidas")}
            vidas={typeof perfil?.vidas === "number" ? perfil.vidas : null}
            maximo={perfil?.maxVidas ?? 5}
            proximaEm={perfil?.proximaVidaEm ?? null}
            pro={!!perfil?.isPro}
            aoRecarregar={atualizar}
          />
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
        <TopbarPopover ancora={ancoraOfensiva} rotulo="Ofensiva" largura={380} fixo={fixado} onClose={fechar}>
          <div className="p-4">
            <PainelOfensiva streakAtual={perfil?.streakAtual ?? 0} streakRecorde={perfil?.streakRecorde ?? 0} protecoes={protecoes} diasProtegidos={perfil?.protectedStreakDays ?? []} onNavegar={fechar} />
          </div>
        </TopbarPopover>
      )}

      {!ehMobile && painel === "moedas" && (
        <TopbarPopover ancora={ancoraMoedas} rotulo="Rupees" largura={320} fixo={fixado} onClose={fechar}>
          <div className="p-4">
            <PainelMoedas moedas={perfil?.moedas ?? null} onNavegar={fechar} />
          </div>
        </TopbarPopover>
      )}

      {!ehMobile && painel === "vidas" && (
        <TopbarPopover ancora={ancoraVidas} rotulo="Penas" alinhamento="fim" largura={360} fixo={fixado} onClose={fechar}>
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
        <TopbarSheet titulo="Rupees" onClose={fechar}>
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
              {valor(perfil?.moedas, 99999)}
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
