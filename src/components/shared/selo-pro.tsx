import Image from "next/image";
import { cn } from "@/lib/utils";

/** Medidas reais do arquivo. O next/image precisa delas pra reservar o espaço
 * antes de carregar; a altura de verdade vem do `className`. */
const LARGURA = 1103;
const ALTURA = 345;

/**
 * O selo PRO.
 *
 * É um recorte do próprio `banner-pro.png` — as barras claras e a palavra saem
 * da arte que já define o PRO no app. Redesenhar isso em CSS daria sempre um
 * parente aproximado: o degradê tem várias paradas e as letras têm um peso e um
 * arredondamento próprios. Usando a arte, o selo e o banner não divergem.
 *
 * O corte para logo depois do "O". No banner o raio branco vem quase colado
 * nele, e levar só a pontinha deixava uma lasca branca no canto, que lida como
 * defeito. A margem que falta à direita é o próprio degradê, amostrado acima e
 * abaixo da trava e estendido — as duas amostras diferem em menos de 2% por
 * canal, então a emenda não aparece.
 *
 * `priority` fica de fora de propósito: o selo vive no painel lateral, e
 * disputar a primeira carga com a trilha atrasaria o que a pessoa veio ver.
 */
export function SeloPro({ className }: { className?: string }) {
  return (
    <Image
      src="/pro/selo-pro.png"
      alt="PRO"
      width={LARGURA}
      height={ALTURA}
      className={cn("block h-7 w-auto select-none rounded-lg", className)}
    />
  );
}
