import { redirect } from "next/navigation";

/** Endereços do administrativo antigo (/admin/cursos/...): o conteúdo agora mora em /admin/conteudo. */
export default async function Page({ params }: { params: Promise<{ resto?: string[] }> }) {
  const { resto } = await params;
  const cursoId = resto?.[0];
  redirect(cursoId && cursoId !== "novo" ? `/admin/conteudo/${cursoId}` : "/admin/conteudo");
}
