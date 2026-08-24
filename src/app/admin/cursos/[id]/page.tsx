import { CourseContentManager } from "@/components/admin/course-content-manager";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseContentManager courseId={id} />;
}
