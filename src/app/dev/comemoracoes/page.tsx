import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PreviaDasComemoracoes } from "./previa";

/**
 * Prévia das comemorações em tela cheia, para ajustar o visual sem precisar
 * completar lições de verdade (o que mexe em XP, ofensiva e conquistas).
 * Só existe em desenvolvimento.
 *
 *   /dev/comemoracoes?antes=6&depois=7
 *   /dev/comemoracoes?so=conquista
 */
export default function Pagina() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <PreviaDasComemoracoes />
    </Suspense>
  );
}
