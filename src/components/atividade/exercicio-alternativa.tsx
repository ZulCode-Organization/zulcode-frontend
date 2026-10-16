"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PerguntaAlternativa } from "@/data/atividades";
import { TextoDestacado } from "./selo-pergunta";

interface ExercicioAlternativaProps {
  pergunta: PerguntaAlternativa;
  selecionada: string | null;
  onSelecionar: (id: string) => void;
  verificado: boolean;
}

/** Texto que parece código vai em fonte de código; frase comum, não. */
const pareceCodigo = (texto: string) => /[(){}[\];=<>"'`]|=>|\.\w+\(/.test(texto);

/** Faíscas saindo do meio da alternativa certa. */
function soltarFaiscas(el: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const caixa = el.getBoundingClientRect();
  for (let k = 0; k < 10; k++) {
    const faisca = document.createElement("span");
    const angulo = (k / 10) * Math.PI * 2;
    const distancia = 40 + Math.random() * 30;
    faisca.className = "zc-aula-faisca";
    faisca.style.background = ["#22c55e", "#ffc800", "#1cb0f6"][k % 3];
    faisca.style.left = `${caixa.left + caixa.width / 2}px`;
    faisca.style.top = `${caixa.top + caixa.height / 2}px`;
    document.body.appendChild(faisca);
    requestAnimationFrame(() => {
      faisca.style.transform = `translate(${Math.cos(angulo) * distancia}px, ${Math.sin(angulo) * distancia}px) rotate(${k * 40}deg)`;
      faisca.style.opacity = "0";
    });
    window.setTimeout(() => faisca.remove(), 700);
  }
}

/** Múltipla escolha — usada tanto pro tipo "alternativa" quanto "logica"
 * (que só soma um trecho de código pra analisar antes das opções). */
export function ExercicioAlternativa({ pergunta, selecionada, onSelecionar, verificado }: ExercicioAlternativaProps) {
  const certaRef = useRef<HTMLButtonElement>(null);
  const acertou = verificado && selecionada === pergunta.respostaCorretaId;

  useEffect(() => {
    if (acertou && certaRef.current) soltarFaiscas(certaRef.current);
  }, [acertou]);

  const estado = (id: string) => {
    if (!verificado) return selecionada === id ? "escolhida" : undefined;
    if (id === pergunta.respostaCorretaId) return "certa";
    if (id === selecionada) return "errada";
    return "apagada";
  };

  return (
    <>
      <h1 className="text-xl font-black leading-snug text-foreground sm:text-2xl">
        <TextoDestacado texto={pergunta.enunciado} termo={pergunta.termoDestacado} />
      </h1>

      {pergunta.codigo && (
        <pre className="mt-4 overflow-x-auto rounded-2xl border-2 border-border bg-muted/50 px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-foreground">
          <TextoDestacado texto={pergunta.codigo} termo={pergunta.termoDestacado} />
        </pre>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {pergunta.alternativas.map((alt, indice) => (
          <button
            key={alt.id}
            ref={alt.id === pergunta.respostaCorretaId ? certaRef : undefined}
            type="button"
            disabled={verificado}
            onClick={() => onSelecionar(alt.id)}
            data-estado={estado(alt.id)}
            className={cn("zc-aula-opcao text-[0.95rem]", pareceCodigo(alt.texto) && "font-mono text-[0.88rem]")}
          >
            <span className="zc-aula-opcao-numero">{indice + 1}</span>
            <span className="min-w-0 break-words">{alt.texto}</span>
          </button>
        ))}
      </div>
    </>
  );
}
