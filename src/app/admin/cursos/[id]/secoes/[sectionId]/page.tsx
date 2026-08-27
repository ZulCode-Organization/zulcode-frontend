import { SectionUnits } from "@/components/admin/course-flow";
export default async function Page({ params }: { params: Promise<{ id: string; sectionId: string }> }) { const p = await params; return <SectionUnits courseId={p.id} sectionId={p.sectionId} />; }
