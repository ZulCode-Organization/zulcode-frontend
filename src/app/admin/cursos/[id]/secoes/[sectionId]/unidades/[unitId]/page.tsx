import { UnitLessons } from "@/components/admin/course-flow";
export default async function Page({ params }: { params: Promise<{ id: string; sectionId: string; unitId: string }> }) { const p = await params; return <UnitLessons courseId={p.id} sectionId={p.sectionId} unitId={p.unitId} />; }
