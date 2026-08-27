import { LessonStages } from "@/components/admin/course-flow";
export default async function Page({ params }: { params: Promise<{ id: string; sectionId: string; unitId: string; lessonId: string }> }) { const p = await params; return <LessonStages courseId={p.id} sectionId={p.sectionId} unitId={p.unitId} lessonId={p.lessonId} />; }
