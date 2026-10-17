import { LeituraDaAula } from "@/components/admin/editor/leitura-da-aula";

export default async function Page({ params }: { params: Promise<{ aulaId: string }> }) {
  const { aulaId } = await params;
  return <LeituraDaAula aulaId={aulaId} />;
}
