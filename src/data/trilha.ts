import { UnidadeTrilha } from "@/lib/types/trilha";

export const trilhaAtual: UnidadeTrilha = {
  id: "unidade_1",
  secao: 1,
  unidade: 1,
  titulo: "Fundamentos do HTML",
  duracaoEstimada: "~30 min",
  licoes: [
    { id: "licao_1", titulo: "Intro ao HTML", subtitulo: "Intro ao HTML", xp: 20, estado: "atual" },
    { id: "licao_2", titulo: "Estrutura", subtitulo: "Tags básicas", xp: 25, estado: "disponivel" },
    { id: "licao_3", titulo: "Interação", subtitulo: "Links e formulários", xp: 20, estado: "bloqueada" },
    { id: "licao_4", titulo: "Semântica", subtitulo: "Tags semânticas", xp: 25, estado: "bloqueada" },
    { id: "licao_5", titulo: "Projeto Final", subtitulo: "Construa uma página", xp: 30, estado: "bloqueada" },
  ],
};
