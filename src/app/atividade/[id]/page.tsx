import { unidadesTrilha } from "@/data/trilha";
import { AtividadeClient } from "./atividade-client";

// output: "export" (build estático, usado pro app mobile via Capacitor)
// exige que toda rota dinâmica declare de antemão quais [id] existem.
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
