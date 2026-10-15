/**
 * Os selos das conquistas e as medalhas do mês, com as artes do Zul.
 *
 * As conquistas formam famílias (aulas, XP, rank…): cada família tem uma arte
 * e uma cor, e o número do selo é o nível tirado do próprio id
 * ("lesson-25" → 25). As que não têm nível mostram uma estrela.
 */

/** Cores da moldura: topo e base do degradê, a borda clara e o tom escuro (sombra e contorno do número). */
export type CoresDoSelo = { topo: string; base: string; borda: string; escuro: string };

const CORES = {
  azul: { topo: "#8ec5ff", base: "#2f7bf6", borda: "#cfe5ff", escuro: "#1b4fb0" },
  violeta: { topo: "#c4b5fd", base: "#7c3aed", borda: "#e4dcff", escuro: "#4c1d95" },
  ouro: { topo: "#fde68a", base: "#f59e0b", borda: "#fff3c4", escuro: "#a85a06" },
  verde: { topo: "#86efac", base: "#16a34a", borda: "#d6fbe1", escuro: "#0f6b33" },
  ciano: { topo: "#99f6e4", base: "#0d9488", borda: "#d6fbf5", escuro: "#0b5f58" },
  laranja: { topo: "#ffc08a", base: "#f97316", borda: "#ffe2c7", escuro: "#a3410d" },
  rosa: { topo: "#fbcfe8", base: "#ec4899", borda: "#ffe3f2", escuro: "#9d1d5c" },
  esmeralda: { topo: "#6ee7b7", base: "#059669", borda: "#d1fae5", escuro: "#065f46" },
  ambar: { topo: "#fcd34d", base: "#d97706", borda: "#fff0c2", escuro: "#8a4b06" },
  vermelho: { topo: "#fca5a5", base: "#ef4444", borda: "#ffe0e0", escuro: "#9b1c1c" },
  amarelo: { topo: "#fef08a", base: "#eab308", borda: "#fffbd1", escuro: "#8a6a05" },
  indigo: { topo: "#a5b4fc", base: "#4f46e5", borda: "#e0e4ff", escuro: "#312e81" },
  magenta: { topo: "#f5a8ff", base: "#c026d3", borda: "#fbe0ff", escuro: "#7a1489" },
  marca: { topo: "#7cc4ff", base: "#1892ff", borda: "#d3ecff", escuro: "#0b5bb5" },
} satisfies Record<string, CoresDoSelo>;

/** O caminho da arte do Zul. A do app (mascot) é a dos especiais. */
const arte = (nome: string) => (nome === "zul" ? "/mascot.png" : `/conquistas/${nome}.webp`);

type Familia = { arte: string; cores: CoresDoSelo };

const FAMILIAS = {
  aulas: { arte: arte("zul-programando"), cores: CORES.azul },
  xp: { arte: arte("zul-mergulho"), cores: CORES.violeta },
  rank: { arte: arte("zul-comemorando"), cores: CORES.ouro },
  unidades: { arte: arte("zul-lupa"), cores: CORES.verde },
  perfeitas: { arte: arte("zul-equilibrio"), cores: CORES.ciano },
  ofensiva: { arte: arte("zul-correndo"), cores: CORES.laranja },
  estudo: { arte: arte("zul-lendo"), cores: CORES.rosa },
  rupees: { arte: arte("zul-oculos"), cores: CORES.esmeralda },
  ritmo: { arte: arte("zul-escrevendo"), cores: CORES.ambar },
  fenix: { arte: arte("zul-muletas"), cores: CORES.vermelho },
  madrugador: { arte: arte("zul-lagarta"), cores: CORES.amarelo },
  coruja: { arte: arte("zul-derretido"), cores: CORES.indigo },
  estilo: { arte: arte("zul-pintando"), cores: CORES.magenta },
  especiais: { arte: arte("zul"), cores: CORES.marca },
} satisfies Record<string, Familia>;

/** A família de cada conquista, pelo id. A ordem importa: os ids exatos vêm antes dos prefixos. */
function familiaDe(id: string): Familia {
  const exatas: Record<string, Familia> = {
    "first-step": FAMILIAS.aulas,
    "limited-pioneers": FAMILIAS.aulas,
    "secret-zul-master": FAMILIAS.xp,
    "secret-first-legend": FAMILIAS.rank,
    "limited-top-10": FAMILIAS.rank,
    "course-completionist": FAMILIAS.unidades,
    "limited-perfectionists": FAMILIAS.perfeitas,
    "limited-streak-keepers": FAMILIAS.ofensiva,
    "secret-coin-rain": FAMILIAS.rupees,
    "secret-phoenix": FAMILIAS.fenix,
    "secret-early-bird": FAMILIAS.madrugador,
    "secret-night-owl": FAMILIAS.coruja,
    "secret-collector": FAMILIAS.estilo,
    "secret-fashionista": FAMILIAS.estilo,
  };
  if (exatas[id]) return exatas[id];
  const prefixos: [string, Familia][] = [
    ["lesson-", FAMILIAS.aulas],
    ["xp-", FAMILIAS.xp],
    ["rank-", FAMILIAS.rank],
    ["unit-", FAMILIAS.unidades],
    ["perfect-", FAMILIAS.perfeitas],
    ["streak-", FAMILIAS.ofensiva],
    ["study-", FAMILIAS.estudo],
    ["coins-", FAMILIAS.rupees],
    ["consistency-", FAMILIAS.ritmo],
  ];
  return prefixos.find(([prefixo]) => id.startsWith(prefixo))?.[1] ?? FAMILIAS.especiais;
}

/** O número do selo: o nível que está no id. Sem nível, uma estrela. Acima de 9.999, em milhares ("10K"). */
function numeroDe(id: string) {
  if (id === "first-step") return "1";
  if (id === "secret-zul-master") return "10K";
  if (id === "course-completionist") return "10";
  if (id === "limited-pioneers") return "50";
  const nivel = id.match(/-(\d+)$/)?.[1];
  if (!nivel || id.startsWith("limited-")) return "★";
  const n = Number(nivel);
  return n >= 10_000 ? `${Math.round(n / 1000)}K` : String(n);
}

export function seloDaConquista(id: string) {
  const familia = familiaDe(id);
  return { arte: familia.arte, cores: familia.cores, numero: numeroDe(id) };
}

/** Cada mês tem a sua arte e a sua cor na medalha. */
const MESES: { arte: string; cor: string }[] = [
  { arte: arte("zul-comemorando"), cor: "#fb7185" },
  { arte: arte("zul-pintando"), cor: "#c084fc" },
  { arte: arte("zul-lendo"), cor: "#60a5fa" },
  { arte: arte("zul-lagarta"), cor: "#34d399" },
  { arte: arte("zul-equilibrio"), cor: "#a3e635" },
  { arte: arte("zul-oculos"), cor: "#fbbf24" },
  { arte: arte("zul-mergulho"), cor: "#22d3ee" },
  { arte: arte("zul-correndo"), cor: "#fb923c" },
  { arte: arte("zul-lupa"), cor: "#f472b6" },
  { arte: arte("zul-programando"), cor: "#818cf8" },
  { arte: arte("zul-escrevendo"), cor: "#f59e0b" },
  { arte: arte("zul-derretido"), cor: "#38bdf8" },
];

/** A arte e a cor da medalha de um mês (0 = janeiro). */
export const medalhaDoMes = (mes: number) => MESES[((mes % 12) + 12) % 12];
