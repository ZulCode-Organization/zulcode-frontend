import { CascaDoAdmin } from "@/components/admin/shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <CascaDoAdmin>{children}</CascaDoAdmin>;
}
