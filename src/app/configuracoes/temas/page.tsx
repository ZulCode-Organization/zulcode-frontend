import { redirect } from "next/navigation";

/** A antiga tela de temas: o claro/escuro agora mora nas Preferências. */
export default function TemasPage() {
  redirect("/configuracoes/preferencias");
}
