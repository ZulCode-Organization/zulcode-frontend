import { redirect } from "next/navigation";

/** A entrada do administrativo é a visão geral. Professores são levados ao conteúdo pela casca. */
export default function Page() {
  redirect("/admin/visao");
}
