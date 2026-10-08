import type { Icon as IconePhosphor } from "@phosphor-icons/react";
import { GearSix, Lightning } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { DESENHOS_SOLAR } from "./desenhos-solar";

/**
 * Ícones de duas camadas da navegação.
 *
 * A linguagem é a da referência que guiou a troca: a camada clara é o volume
 * do objeto, sem contorno em volta, e a camada escura desenha só o detalhe que
 * dá sentido a ele. Tudo arredondado, nada de canto vivo.
 *
 * A maioria vem da Solar, peso "bold duotone", que é desenhada exatamente
 * assim. Metas e Configurações ficaram na Phosphor porque foram as duas
 * aprovadas da primeira rodada; lá o corpo vem do peso "duotone" e o traço do
 * "bold", sobrepostos no mesmo grid.
 *
 * Tudo usa `currentColor`: cinza no quadradinho apagado, branco no quadrado
 * azul do ativo. A força da camada clara e o hover ficam em globals.css.
 */

type Props = { className?: string };

/** A Solar ocupa ~83% da caixa e a Phosphor ~75%. Desenhada a 91% da caixa,
 *  a Solar fica com o mesmo tamanho aparente das duas da Phosphor ao lado. */
function solar(chave: keyof typeof DESENHOS_SOLAR, nome: string) {
  function IconeSolar({ className }: Props) {
    return (
      <span aria-hidden className={cn("zc-duo zc-duo-solar relative inline-grid size-[30px] shrink-0 place-items-center", className)}>
        <svg
          viewBox="0 0 24 24"
          className="size-[91%]"
          // Os caminhos são dados fixos do arquivo gerado, nunca texto de fora.
          dangerouslySetInnerHTML={{ __html: DESENHOS_SOLAR[chave] }}
        />
      </span>
    );
  }
  IconeSolar.displayName = nome;
  return IconeSolar;
}

function phosphor(Icone: IconePhosphor, nome: string) {
  function IconeDuo({ className }: Props) {
    return (
      <span aria-hidden className={cn("zc-duo relative inline-block size-[30px] shrink-0", className)}>
        <Icone weight="duotone" className="zc-duo-corpo absolute inset-0 size-full" />
        <Icone weight="bold" className="zc-duo-traco absolute inset-0 size-full" />
      </span>
    );
  }
  IconeDuo.displayName = nome;
  return IconeDuo;
}

export const DuoJornada = solar("Jornada", "DuoJornada");
export const DuoElementos = solar("Elementos", "DuoElementos");
export const DuoLideres = solar("Lideres", "DuoLideres");
export const DuoLoja = solar("Loja", "DuoLoja");
export const DuoPerfil = solar("Perfil", "DuoPerfil");
export const DuoMais = solar("Mais", "DuoMais");
export const DuoPlayground = solar("Playground", "DuoPlayground");
export const DuoBug = solar("Bug", "DuoBug");
export const DuoMetas = phosphor(Lightning, "DuoMetas");
export const DuoConfiguracoes = phosphor(GearSix, "DuoConfiguracoes");
