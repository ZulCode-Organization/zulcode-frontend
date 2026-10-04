/**
 * As divisões das ligas. As faixas são as mesmas do backend
 * (leaderboard.service.ts) — quem decide em qual liga alguém está é o XP, não
 * a colocação. Ficam aqui porque a tabela de líderes e o perfil precisam das
 * duas coisas: o nome da divisão e a cor dela.
 */
export interface Divisao {
  id: string;
  nome: string;
  /** Classe Tailwind de fundo, pro escudo. */
  cor: string;
  /** Classe de texto, pra quando a divisão é só um rótulo. */
  texto: string;
  /** Preenchimento e contorno do escudo, quando ele aparece cheio. São
   * classes literais porque o Tailwind só gera o que consegue ler no código —
   * trocar "text-" por "fill-" em tempo de execução não geraria CSS nenhum. */
  preenchimento: string;
  contorno: string;
  minXp: number;
}

export const DIVISOES: Divisao[] = [
  { id: "bronze", nome: "Bronze", cor: "bg-[#C08457]", texto: "text-[#C08457]", preenchimento: "fill-[#C08457]", contorno: "text-[#8A5B38]", minXp: 0 },
  { id: "prata", nome: "Prata", cor: "bg-slate-300", texto: "text-slate-300", preenchimento: "fill-slate-300", contorno: "text-slate-500", minXp: 300 },
  { id: "ouro", nome: "Ouro", cor: "bg-amber-400", texto: "text-amber-400", preenchimento: "fill-amber-400", contorno: "text-amber-600", minXp: 1000 },
  { id: "platina", nome: "Platina", cor: "bg-emerald-500", texto: "text-emerald-500", preenchimento: "fill-emerald-500", contorno: "text-emerald-700", minXp: 3000 },
  { id: "diamante", nome: "Diamante", cor: "bg-sky-500", texto: "text-sky-500", preenchimento: "fill-sky-500", contorno: "text-sky-700", minXp: 6000 },
  { id: "mestre", nome: "Mestre", cor: "bg-rose-400", texto: "text-rose-400", preenchimento: "fill-rose-400", contorno: "text-rose-700", minXp: 10000 },
];

/** Ids da liga como o backend os nomeia, pro parâmetro de /leaderboard. */
export const RANK_IDS: Record<string, string> = {
  bronze: "BRONZE",
  prata: "SILVER",
  ouro: "GOLD",
  platina: "PLATINUM",
  diamante: "DIAMOND",
  mestre: "MASTER",
};

/** Em qual divisão um XP cai. */
export function divisaoDoXp(xp: number): Divisao {
  return [...DIVISOES].reverse().find((divisao) => xp >= divisao.minXp) ?? DIVISOES[0];
}

/** A próxima divisão acima do XP dado, ou null se já está na última. */
export function proximaDivisao(xp: number): Divisao | null {
  return DIVISOES.find((divisao) => divisao.minXp > xp) ?? null;
}
