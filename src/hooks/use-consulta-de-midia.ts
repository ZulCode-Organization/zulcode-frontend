"use client";

import { useEffect, useState } from "react";

/** Responde a uma media query em JavaScript.
 *
 *  Serve para quando os dois layouts não podem coexistir no DOM. Esconder um
 *  com `lg:hidden` é mais simples, mas monta os dois — e, quando o layout
 *  contém um editor, isso significa dois editores de verdade: dois analisadores
 *  rodando, duas assinaturas de estado e um "qual deles o botão controla?" que
 *  não tem resposta boa.
 *
 *  Só use onde o custo de montar duas vezes é real; para o resto, as classes
 *  do Tailwind continuam melhores.
 */
export function useConsultaDeMidia(consulta: string) {
  // Só é chamado no cliente: quem usa este hook monta depois da hidratação.
  const [combina, setCombina] = useState(
    () => typeof window !== "undefined" && window.matchMedia(consulta).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(consulta);
    const aoMudar = () => setCombina(media.matches);
    aoMudar();
    media.addEventListener("change", aoMudar);
    return () => media.removeEventListener("change", aoMudar);
  }, [consulta]);

  return combina;
}
