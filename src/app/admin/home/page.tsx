import { redirect } from "next/navigation";

/** Endereço do administrativo antigo: quem tinha o link salvo cai na visão geral. */
export default function Page() {
  redirect("/admin/visao");
}
