"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * A faixa da resposta, presa ao pé da tela e na largura toda. Antes ela vinha
 * no fim da página: numa questão comprida ficava em parte fora da tela (no
 * computador) e o "Continuar" sumia lá embaixo, pedindo rolagem. No lugar
 * dela fica um espaço da mesma altura, para o fim da questão ainda poder
 * subir até aparecer acima da faixa.
 */
export function FaixaDaResposta({ correto, children }: { correto: boolean; children: ReactNode }) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    const faixa = faixaRef.current;
    if (!faixa || typeof ResizeObserver === "undefined") return;
    // O observador avisa logo ao começar, já com a altura inicial.
    const observador = new ResizeObserver(() => setAltura(faixa.offsetHeight));
    observador.observe(faixa);
    return () => observador.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden style={{ height: altura }} />
      <div
        ref={faixaRef}
        className="zc-aula-faixa fixed inset-x-0 bottom-0 z-40 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5"
        data-certo={correto}
        role="status"
      >
        {/* A mesma grade da aula (a questão e, no computador, o vão do
            Playground ao lado): o texto fica alinhado com a questão. */}
        <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 lg:px-8">
          <div className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-xl">{children}</div>
          </div>
          <div className="hidden w-[380px] shrink-0 lg:block" />
        </div>
      </div>
    </>
  );
}
