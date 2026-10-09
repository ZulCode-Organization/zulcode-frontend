import { redirect } from "next/navigation";

/** Endereço do administrativo antigo: a lista de usuários virou "Pessoas". */
export default function Page() {
  redirect("/admin/pessoas");
}
