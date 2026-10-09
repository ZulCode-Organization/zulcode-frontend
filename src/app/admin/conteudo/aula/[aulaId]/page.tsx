import { EditorDeAula } from "@/components/admin/editor/editor-de-aula";

export default async function Page({ params }: { params: Promise<{ aulaId: string }> }) {
  const { aulaId } = await params;
  return <EditorDeAula aulaId={aulaId} />;
}
