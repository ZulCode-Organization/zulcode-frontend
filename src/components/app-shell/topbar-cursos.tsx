"use client";

import { useEffect, useMemo } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CursoDaJornada } from "@/hooks/use-cursos";
import { LanguageIcon, languageColor } from "@/components/onboarding/language-icon";
import { useArrastarFaixa } from "@/hooks/use-arrastar-faixa";

/**
 * Ordem de destaque dos cursos "principais" — os mais conhecidos primeiro.
 * O que não estiver aqui cai pro fim mantendo a ordem que o admin definiu em
 * `order` no catálogo, então curso novo nunca some: só entra depois.
 */
const FAMA = [
  "python", "javascript", "java", "typescript", "csharp", "c", "cplusplus",
  "php", "go", "ruby", "swift", "kotlin", "rust", "sql", "html", "css",
];

/** Vitrine "Novos cursos" (só no celular). Se o catálogo ainda não tiver
 * esses, cai pros dois últimos da ordenação do admin — que é onde um curso
 * recém-criado aparece. */
const NOVOS_PREFERIDOS = ["sqlite", "arduino"];

function normalizar(valor: string) {
  return valor.trim().toLowerCase().replace(/[\s._+#-]+/g, "");
}

function posicaoNaFama(curso: CursoDaJornada) {
  const indice = FAMA.indexOf(normalizar(curso.id));
  return indice === -1 ? FAMA.length : indice;
}

function chaveDoUsuario(perfilId?: string | null) {
  return `zulcode:meus-cursos:${perfilId ?? "anonimo"}`;
}

/**
 * Cor do traço em cima do ladrilho. Quase toda cor de marca é escura o
 * bastante pra receber branco, mas algumas são claras demais (o amarelo do
 * JavaScript, o cinza do C) — nessas, branco sobre branco sumiria, então o
 * ícone vira quase preto. É o mesmo desenho, só legível nos dois casos.
 */
function corDoTraco(fundo: string) {
  const hex = fundo.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.68 ? "#16181d" : "#ffffff";
}

/**
 * Linguagens cujo logo já é um quadrado cheio: em cima do ladrilho ele vira
 * um bloco sólido e o desenho some. Nessas, a sigla escrita lê muito melhor
 * — e no caso do JS é exatamente o logo de verdade (letras pretas no
 * amarelo). Só vale aqui; no onboarding e no perfil o logo continua o mesmo.
 */
const SIGLAS: Record<string, string> = {
  javascript: "JS",
  js: "JS",
  typescript: "TS",
  ts: "TS",
};

/**
 * Fundo do ladrilho quando a cor de marca da linguagem não é a escolhida pra
 * cá. O traço continua branco por cima, como em todos os outros.
 */
const FUNDO_ESPECIAL: Record<string, string> = {
  python: "#015869",
};

/**
 * Cursos anunciados que ainda não existem no catálogo da API. Aparecem só na
 * tela de todos os cursos, apagados e sem clique — é vitrine, não curso: nada
 * aqui é enviado ao backend nem pode ser selecionado.
 */
export const CURSOS_EM_BREVE = [
  { id: "arduino", name: "Arduino" },
  { id: "sql", name: "SQL" },
  { id: "cplusplus", name: "C++" },
  { id: "c", name: "C" },
  { id: "php", name: "PHP" },
  { id: "git", name: "Git" },
  { id: "shell", name: "Shell" },
];

/** Proporção do desenho dentro do ladrilho. */
const OCUPACAO_ICONE = 0.64;
const OCUPACAO_SIGLA = 0.46;

/** Quantos cursos cabem na barra antes do botão que abre o catálogo inteiro. */
const LIMITE_NA_BARRA = 4;

interface LadrilhoProps {
  curso: CursoDaJornada;
  ativo?: boolean;
  /** Altura em px — o ícone, a sigla e o arredondamento saem daqui, então os
   * tamanhos usados no app ficam proporcionais entre si sozinhos. */
  px: number;
  /** Largura, quando o ladrilho não é quadrado: o botão de curso da barra de
   * status é um retângulo deitado no celular. Padrão: igual à altura. */
  largura?: number;
  className?: string;
}

/**
 * Ladrilho do curso: bloco de cantos bem arredondados (entre o quadrado e o
 * círculo) pintado com a cor de marca da linguagem, com o ícone em branco por
 * cima. É o que deixa todos os cursos com o mesmo peso visual, em vez de cada
 * ícone aparecer numa cor solta sobre o fundo do card.
 */
function daTabela<T>(mapa: Record<string, T>, curso: CursoDaJornada): T | undefined {
  return mapa[normalizar(curso.id)] ?? (curso.name ? mapa[normalizar(curso.name)] : undefined);
}

/** Cor de fundo do ladrilho do curso. Exportada porque quem monta a base
 * sólida do botão (a peça mais escura atrás) precisa da mesma cor. */
export function fundoDoCurso(curso: CursoDaJornada): string | undefined {
  return daTabela(FUNDO_ESPECIAL, curso) ?? languageColor(curso.id, curso.name);
}

/** Raio do ladrilho pra uma dada altura — a base sólida usa o mesmo. */
export function raioDoLadrilho(px: number) {
  return Math.round(px * 0.28);
}

export function LadrilhoCurso({ curso, ativo = false, px, largura, className }: LadrilhoProps) {
  const sigla = daTabela(SIGLAS, curso);
  const fundo = fundoDoCurso(curso);
  const lado = px * OCUPACAO_ICONE;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        ativo && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !fundo && "bg-muted text-foreground",
        className
      )}
      style={{
        width: largura ?? px,
        height: px,
        // Raio em px, e não em %: num retângulo a porcentagem arredonda cada
        // eixo pela sua própria medida e os cantos saem ovalados.
        borderRadius: raioDoLadrilho(px),
        ...(fundo ? { backgroundColor: fundo, color: corDoTraco(fundo) } : {}),
      }}
    >
      {sigla ? (
        // Encostada no canto inferior direito, que é onde as letras ficam nos
        // logos de verdade do JavaScript e do TypeScript — não centralizadas.
        // O recuo de baixo é menor que o da direita de propósito: com
        // line-height 1 sobra o espaço do descendente embaixo da maiúscula, e
        // sem compensar isso a sigla parece flutuar longe da borda.
        <span
          className="absolute inset-0 flex items-end justify-end font-black leading-none"
          style={{
            paddingRight: px * 0.12,
            paddingBottom: px * 0.04,
            fontSize: px * OCUPACAO_SIGLA,
          }}
        >
          {sigla}
        </span>
      ) : (
        <LanguageIcon
          id={curso.id}
          name={curso.name}
          className="shrink-0"
          style={{ width: lado, height: lado }}
          monochrome
        />
      )}
    </span>
  );
}

function lerSalvos(chave: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) ?? "[]");
    return Array.isArray(salvo) ? salvo.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Quais cursos o usuário faz. O backend não expõe isso: o PATCH
 * /languages/:slug/current cria o vínculo lá dentro, mas não existe rota que
 * devolva a lista. Então a ordem de uso fica no navegador, por usuário — nada
 * é enviado ou pedido ao servidor por causa disso.
 */
export function useMeusCursos(perfilId: string | null | undefined, cursoAtual: string | null) {
  const chave = chaveDoUsuario(perfilId);

  // O curso ativo sempre conta como "meu" e vai pra frente da fila — é ele o
  // mais recente por definição. Como isso é só uma leitura + reordenação, dá
  // pra calcular no render, sem estado espelhando o localStorage.
  const ids = useMemo(() => {
    const salvos = lerSalvos(chave);
    return cursoAtual ? [cursoAtual, ...salvos.filter((id) => id !== cursoAtual)] : salvos;
  }, [chave, cursoAtual]);

  useEffect(() => {
    if (!cursoAtual) return;
    try {
      localStorage.setItem(chave, JSON.stringify(ids));
    } catch {
      // navegação privada / armazenamento bloqueado: segue só em memória
    }
  }, [chave, cursoAtual, ids]);

  return ids;
}

interface ListaProps {
  cursos: CursoDaJornada[];
  cursoAtual: string | null;
  meusCursos: string[];
  onSelecionar: (slug: string) => void;
  onAbrirTodos: () => void;
}

/**
 * A barra mostra no máximo LIMITE_NA_BARRA cursos: primeiro os que a pessoa
 * faz (o atual na frente, porque é o mais recente), e o que sobrar de espaço
 * é completado com os mais famosos. O resto do catálogo fica atrás do botão
 * que abre a tela de todos os cursos.
 */
function useVitrine({ cursos, meusCursos }: Pick<ListaProps, "cursos" | "meusCursos">) {
  return useMemo(() => {
    const porId = new Map(cursos.map((curso) => [curso.id, curso]));
    const meus = meusCursos.map((id) => porId.get(id)).filter((curso): curso is CursoDaJornada => !!curso);
    const porFama = [...cursos].sort((a, b) => posicaoNaFama(a) - posicaoNaFama(b));

    const exibidos: CursoDaJornada[] = [];
    const juntar = (lista: CursoDaJornada[]) => {
      for (const curso of lista) {
        if (exibidos.length >= LIMITE_NA_BARRA) return;
        if (!exibidos.some((item) => item.id === curso.id)) exibidos.push(curso);
      }
    };
    juntar(meus);
    juntar(porFama);

    const jaExibido = new Set(exibidos.map((curso) => curso.id));

    const preferidos = NOVOS_PREFERIDOS
      .map((slug) => cursos.find((curso) => normalizar(curso.id) === slug))
      .filter((curso): curso is CursoDaJornada => !!curso && !jaExibido.has(curso.id));
    const recentes = [...cursos]
      .reverse()
      .filter((curso) => !jaExibido.has(curso.id) && !preferidos.some((item) => item.id === curso.id));

    return { exibidos, novos: [...preferidos, ...recentes].slice(0, 2) };
  }, [cursos, meusCursos]);
}

const TITULO = "text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground";

/* --------------------------------------------------------------------- */
/* Desktop: lista vertical dentro do popover ancorado no chip do curso.   */
/* Sem a vitrine de novos cursos aqui — ela só faz sentido no celular.    */
/* --------------------------------------------------------------------- */
export function ListaCursosDesktop({ cursos, cursoAtual, meusCursos, onSelecionar, onAbrirTodos }: ListaProps) {
  const { exibidos } = useVitrine({ cursos, meusCursos });

  return (
    <div className="p-3">
      <p className={cn(TITULO, "px-3 pb-2 pt-1")}>Meus cursos</p>
      <div className="flex flex-col gap-0.5">
        {exibidos.map((curso, indice) => {
          const ativo = curso.id === cursoAtual;
          return (
            <button
              key={curso.id}
              type="button"
              onClick={() => onSelecionar(curso.id)}
              title={ativo ? `${curso.name} — curso atual` : `Trocar para ${curso.name}`}
              // Entrada escalonada: os itens sobem em cascata em vez de o
              // painel inteiro aparecer de uma vez.
              style={{ animationDelay: `${indice * 45}ms` }}
              className={cn(
                "animate-fade-in-up flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150",
                ativo ? "bg-primary/10" : "hover:bg-muted/70"
              )}
            >
              <LadrilhoCurso curso={curso} px={44} largura={62} />
              <span className={cn("min-w-0 flex-1 truncate text-[0.95rem] font-black", ativo ? "text-primary" : "text-foreground")}>
                {curso.name}
              </span>
              {ativo && <Check className="size-4.5 shrink-0 text-primary" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAbrirTodos}
        className="mt-2 flex w-full items-center gap-3 border-t border-border px-3 pb-1 pt-3 text-left transition-colors duration-150 hover:text-primary"
      >
        <span className="flex h-[44px] w-[62px] shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
          <Plus className="size-5" strokeWidth={2.6} />
        </span>
        <span className="text-[0.95rem] font-black">Adicionar curso</span>
      </button>
    </div>
  );
}

/** Medidas do ladrilho deitado usado na faixa e no catálogo do celular. */
const LARGURA_LADRILHO = 82;
const ALTURA_LADRILHO = 60;

/** Um curso dentro da faixa/grade: ladrilho deitado + nome embaixo. */
function BotaoCurso({
  curso,
  ativo,
  onSelecionar,
  indice = 0,
}: {
  curso: CursoDaJornada;
  ativo: boolean;
  onSelecionar: (slug: string) => void;
  /** Posição na faixa, só pra escalonar a entrada. */
  indice?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelecionar(curso.id)}
      className="animate-fade-in-up flex shrink-0 flex-col items-center gap-2 pt-1"
      style={{ width: LARGURA_LADRILHO, animationDelay: `${indice * 45}ms` }}
    >
      <LadrilhoCurso curso={curso} ativo={ativo} px={ALTURA_LADRILHO} largura={LARGURA_LADRILHO} className="zc-press" />
      <span
        className={cn(
          "w-full truncate text-center text-[0.68rem] font-black uppercase tracking-[0.02em]",
          ativo ? "text-primary" : "text-muted-foreground"
        )}
      >
        {curso.name}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------- */
/* Mobile: faixa arrastável que abre logo abaixo da barra de status.      */
/* --------------------------------------------------------------------- */
export function FaixaCursosMobile({ cursos, cursoAtual, meusCursos, onSelecionar, onAbrirTodos }: ListaProps) {
  const { exibidos, novos } = useVitrine({ cursos, meusCursos });
  const { ref, manipuladores } = useArrastarFaixa();

  return (
    <div>
      {/* touch-pan-x deixa o dedo arrastar na horizontal sem roubar a rolagem
          vertical da página; o mouse é tratado pelo useArrastarFaixa. */}
      <div className="relative">
        <div
          ref={ref}
          {...manipuladores}
          className="zc-scroll-hidden -mx-3 flex touch-pan-x select-none gap-3 overflow-x-auto overscroll-x-contain px-3 pb-1"
        >
          {exibidos.map((curso, indice) => (
            <BotaoCurso key={curso.id} curso={curso} ativo={curso.id === cursoAtual} onSelecionar={onSelecionar} indice={indice} />
          ))}

          <button
            type="button"
            onClick={onAbrirTodos}
            className="flex shrink-0 flex-col items-center gap-2 pt-1"
            style={{ width: LARGURA_LADRILHO }}
          >
            <span
              className="zc-press flex shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground"
              style={{ width: LARGURA_LADRILHO, height: ALTURA_LADRILHO }}
            >
              <Plus className="size-7" strokeWidth={2.6} />
            </span>
            <span className="w-full truncate text-center text-[0.68rem] font-black uppercase tracking-[0.02em] text-muted-foreground">
              Ver mais
            </span>
          </button>
        </div>

        {/* Sombra na borda direita: sinaliza que a faixa continua. */}
        <span
          className="pointer-events-none absolute -right-3 bottom-1 top-0 w-8 bg-gradient-to-l from-popover to-transparent"
          aria-hidden
        />
      </div>

      {novos.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className={cn(TITULO, "pb-2")}>Novos cursos</p>
          <div className="flex gap-3">
            {novos.map((curso) => (
              <BotaoCurso key={curso.id} curso={curso} ativo={false} onSelecionar={onSelecionar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Catálogo inteiro, aberto pelo "+".                                     */
/* --------------------------------------------------------------------- */
export function TelaTodosCursos({ cursos, cursoAtual, meusCursos, onSelecionar }: Omit<ListaProps, "onAbrirTodos">) {
  const feitos = useMemo(() => new Set(meusCursos), [meusCursos]);
  const emAndamento = cursos.filter((curso) => feitos.has(curso.id));
  const disponiveis = cursos.filter((curso) => !feitos.has(curso.id));

  const grade = (lista: CursoDaJornada[]) => (
    <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-4">
      {lista.map((curso) => (
        <button
          key={curso.id}
          type="button"
          onClick={() => onSelecionar(curso.id)}
          className="flex flex-col items-center gap-2"
          style={{ width: LARGURA_LADRILHO + 12 }}
        >
          <LadrilhoCurso
            curso={curso}
            ativo={curso.id === cursoAtual}
            px={ALTURA_LADRILHO + 6}
            largura={LARGURA_LADRILHO + 12}
            className="zc-press"
          />
          <span
            className={cn(
              "w-full truncate text-center text-[0.7rem] font-black uppercase tracking-[0.02em]",
              curso.id === cursoAtual ? "text-primary" : "text-muted-foreground"
            )}
          >
            {curso.name}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-2xl pb-6">
      {emAndamento.length > 0 && (
        <section className="mb-6">
          <p className={cn(TITULO, "pb-3")}>Meus cursos</p>
          {grade(emAndamento)}
        </section>
      )}

      <section>
        <p className={cn(TITULO, "pb-3")}>{emAndamento.length > 0 ? "Todos os cursos" : "Escolha um curso"}</p>
        {disponiveis.length > 0 ? (
          grade(disponiveis)
        ) : (
          <p className="text-sm text-muted-foreground">Você já está em todos os cursos disponíveis.</p>
        )}
      </section>

      {/* Vitrine do que ainda vai existir: apagada e sem clique, pra ninguém
          tentar entrar num curso que o backend não tem. */}
      <section className="mt-7">
        <p className={cn(TITULO, "pb-3")}>Em breve</p>
        <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-4">
          {CURSOS_EM_BREVE.map((curso) => (
            <div
              key={curso.id}
              className="flex flex-col items-center gap-2 opacity-45"
              style={{ width: LARGURA_LADRILHO + 12 }}
              aria-disabled
            >
              <span className="relative">
                <LadrilhoCurso curso={{ ...curso, icon: "" }} px={ALTURA_LADRILHO + 6} largura={LARGURA_LADRILHO + 12} />
                <span className="absolute inset-x-1 bottom-1 rounded-md bg-black/55 py-0.5 text-center text-[0.55rem] font-black uppercase tracking-[0.06em] text-white">
                  Em breve
                </span>
              </span>
              <span className="w-full truncate text-center text-[0.7rem] font-black uppercase tracking-[0.02em] text-muted-foreground">
                {curso.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
