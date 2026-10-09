import { Suspense } from "react";
import { ListaDePessoas } from "@/components/admin/pessoas/lista";

export default function Page() {
  return (
    <Suspense>
      <ListaDePessoas />
    </Suspense>
  );
}
