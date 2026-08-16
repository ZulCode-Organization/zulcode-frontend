import { unidadesTrilha } from "@/data/trilha";
import { LICAO_REAL_VARIAVEIS_ID } from "@/data/atividades";
import { AtividadeClient } from "./atividade-client";

// output: "export" (build estático, usado pro app mobile via Capacitor)
// exige que toda rota dinâmica declare de antemão quais [id] existem — não
// dá pra enumerar ids que só existem no banco em runtime, então além dos ids
// mockados incluímos explicitamente o único id real que hoje existe no
// backend (prisma/seed.ts). Quando o backend semear mais lições, os ids
// delas precisam entrar nessa lista também.
export function generateStaticParams() {
  const idsMockados = unidadesTrilha.flatMap((unidade) => unidade.licoes).map((licao) => ({ id: licao.id }));
  return [...idsMockados, { id: LICAO_REAL_VARIAVEIS_ID }];
}

interface AtividadePageProps {
  params: Promise<{ id: string }>;
}

export default async function AtividadePage({ params }: AtividadePageProps) {
  const { id } = await params;
  return <AtividadeClient id={id} />;
}
