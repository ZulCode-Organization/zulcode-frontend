import { ArvoreDoCurso } from "@/components/admin/conteudo/arvore";

export default async function Page({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;
  return <ArvoreDoCurso cursoId={cursoId} />;
}
