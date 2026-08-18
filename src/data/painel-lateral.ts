export interface MetaDiaria {
  id: string;
  titulo: string;
  meta: number;
}

/**
 * Só a definição das metas (o que é e qual o alvo). O quanto já foi feito
 * hoje não mora aqui: vem do perfil, em use-metas-diarias.ts — assim nenhum
 * número de progresso fica escrito à mão no código.
 */
export const metasDiarias: MetaDiaria[] = [
  { id: "primeira_tentativa", titulo: "Resolver 3 desafios na primeira tentativa", meta: 3 },
  { id: "ganhar_xp", titulo: "Ganhar 95 XP", meta: 95 },
  { id: "completar_licoes", titulo: "Completar 4 lições", meta: 4 },
];

/** Só o alvo é fixo — o XP atual sai do perfil de verdade (GET /user). */
export const tabelaLideresBloqueio = {
  xpNecessario: 100,
};
