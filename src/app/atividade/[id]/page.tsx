import { AtividadeClient } from "./atividade-client";

interface AtividadePageProps {
  params: Promise<{ id: string }>;
}

export default async function AtividadePage({ params }: AtividadePageProps) {
  const { id } = await params;
  return <AtividadeClient id={id} />;
}
