import { useId } from "react";
import { seloDaConquista } from "@/lib/selos";
import { cn } from "@/lib/utils";

/**
 * O selo de uma conquista, no estilo da referência: moldura hexagonal na cor
 * da família, o Zul saindo por cima e o número do nível embaixo. "NOVA"
 * aparece nas desbloqueadas há pouco.
 *
 * O tamanho vem de `className` (largura); tudo dentro é proporcional.
 */
export function SeloConquista({ id, nova = false, className }: { id: string; nova?: boolean; className?: string }) {
  const { arte, cores, numero } = seloDaConquista(id);
  const gradiente = useId();
  const hexagono = "M62 4 L114 33 L114 93 L62 122 L10 93 L10 33 Z";

  return (
    <span className={cn("relative inline-block aspect-[132/140] w-[132px] shrink-0 [container-type:inline-size]", className)} aria-hidden>
      <svg viewBox="0 0 124 126" className="absolute bottom-0 left-[3%] h-[90%] w-[94%] overflow-visible">
        <defs>
          <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={cores.topo} />
            <stop offset="1" stopColor={cores.base} />
          </linearGradient>
        </defs>
        <path d={hexagono} fill={cores.escuro} stroke={cores.escuro} strokeWidth="12" strokeLinejoin="round" transform="translate(0,4)" />
        <path d={hexagono} fill={`url(#${gradiente})`} stroke={cores.borda} strokeWidth="10" strokeLinejoin="round" />
        <path d="M10 70 L114 50 L114 93 L62 122 L10 93 Z" fill={cores.escuro} opacity=".22" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte estática pequena, já otimizada em WebP. */}
      <img
        src={arte}
        alt=""
        draggable={false}
        className="absolute bottom-[17%] left-1/2 max-h-[84%] max-w-[92%] -translate-x-1/2 object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.18)]"
      />
      <span
        className="absolute bottom-[2%] left-1/2 -translate-x-1/2 font-black leading-none text-white [paint-order:stroke_fill]"
        style={{ WebkitTextStroke: `0.28em ${cores.escuro}`, fontSize: "clamp(12px, 17cqw, 26px)" }}
      >
        {numero}
      </span>
      {nova && (
        <span className="absolute right-0 top-[3%] rounded-[5px] bg-[#ff4b4b] px-1.5 py-0.5 text-[10px] font-black text-white shadow-[0_2px_0_#c21f1f]">
          NOVA
        </span>
      )}
    </span>
  );
}
