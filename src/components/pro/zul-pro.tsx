import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** O arco-íris do Zul PRO: puxado para a marca, do ciano ao rosa. */
export const ARCO_DO_ZUL = "linear-gradient(135deg, #22d3ee 0%, #4f63e3 30%, #8a63e6 50%, #c026d3 72%, #ff6fb5 100%)";

const ARTE = "/mascot.png";

/**
 * O Zul do PRO: a arte de sempre (`public/mascot.png`), tingida e com contorno
 * de adesivo.
 *
 * O tingimento não redesenha nada. A imagem vai para cinza e um gradiente por
 * cima, em `mix-blend-mode: color`, empresta as cores mantendo a luz e a
 * sombra de cada ponto — por isso olho, bico e penas continuam lá. A máscara
 * com a mesma imagem recorta o gradiente na silhueta do Zul.
 *
 * O contorno branco é a própria silhueta repetida em oito direções por
 * `drop-shadow`: segue a forma exata, em qualquer tamanho.
 *
 * `arte` é o lugar das animações futuras do mascote (Rive, Lottie, vídeo):
 * quem chegar entra aqui e herda o tingimento e o contorno sem mexer nas
 * telas.
 */
export function ZulPro({ className, style, arte }: { className?: string; style?: CSSProperties; arte?: ReactNode }) {
  return (
    <div className={cn("zc-zul-pro relative aspect-square", className)} style={style}>
      <div
        className="relative isolate size-full"
        style={{
          WebkitMaskImage: `url(${ARTE})`,
          maskImage: `url(${ARTE})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      >
        {arte ?? (
          // eslint-disable-next-line @next/next/no-img-element -- a máscara usa o mesmo arquivo; o Image do Next trocaria a URL.
          <img src={ARTE} alt="" draggable={false} className="size-full select-none" style={{ filter: "grayscale(1) brightness(1.2) contrast(1.1)" }} />
        )}
        <div className="absolute inset-0" style={{ background: ARCO_DO_ZUL, mixBlendMode: "color" }} />
      </div>
    </div>
  );
}
