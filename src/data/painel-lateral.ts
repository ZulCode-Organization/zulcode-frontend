export interface MetaDiaria {
  id: string;
  titulo: string;
  atual: number;
  meta: number;
}

export const metasDiarias: MetaDiaria[] = [
  { id: "primeira_tentativa", titulo: "Resolver 3 desafios na primeira tentativa", atual: 0, meta: 3 },
  { id: "ganhar_xp", titulo: "Ganhar 95 XP", atual: 20, meta: 95 },
  { id: "completar_licoes", titulo: "Completar 4 lições", atual: 1, meta: 4 },
];

export const tabelaLideresBloqueio = {
  xpAtual: 20,
  xpNecessario: 100,
};
