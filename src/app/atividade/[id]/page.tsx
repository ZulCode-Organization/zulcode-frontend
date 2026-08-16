import { unidadesTrilha } from "@/data/trilha";
import { AtividadeClient } from "./atividade-client";

// output: "export" (build estático, usado pro app mobile via Capacitor)
// exige que toda rota dinâmica declare de antemão quais [id] existem. Todas
// as rotas de atividade usam ids mockados (mesmo a lição conectada ao
// backend, ver ID_LICAO_CONECTADA em hooks/use-jornada.ts) — o id real do
// banco (LICAO_REAL_VARIAVEIS_ID) só é usado internamente nas chamadas de
// API, nunca como parte da URL.
export function generateStaticParams() {
  return unidadesTrilha.flatMap((unidade) => unidade.licoes).map((licao) => ({ id: licao.id }));
}

interface AtividadePageProps {
  params: Promise<{ id: string }>;
}

export default async function AtividadePage({ params }: AtividadePageProps) {
  const { id } = await params;
  return <AtividadeClient id={id} />;
}
