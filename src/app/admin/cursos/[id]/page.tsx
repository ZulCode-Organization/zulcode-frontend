import { CourseSections } from "@/components/admin/course-flow";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseSections courseId={id} />;
}
