import { FichaDaPessoa } from "@/components/admin/pessoas/ficha";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaDaPessoa id={id} />;
}
