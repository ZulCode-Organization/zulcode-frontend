import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Quanto a base sólida assoma embaixo da face, e quanto a face desce ao ser
 * apertada. A face não afunda os 5px inteiros: parar 1px antes deixa uma
 * lasquinha de base à mostra no fim do gesto, que é o que faz o botão parecer
 * encostar no fundo em vez de sumir dentro dele.
 */
const BASE = 5;

/**
 * Botão com corpo de verdade.
 *
 * São duas camadas sólidas: a de trás, mais escura, assomando embaixo; e a
 * face, que desce em cima dela no clique. Não é `box-shadow` — é uma peça
 * atrás, do mesmo jeito que os nós da trilha e o cabeçalho da Jornada são
 * montados. A diferença aparece no gesto: com sombra o botão só escurece, com
 * a peça ele realmente afunda.
 *
 * O `primario` tira a cor da base do próprio `--primary` em brightness-75,
 * então ele acompanha a paleta que a pessoa escolher. O `neutro` usa a cor da
 * borda: um card escurecido ficaria quase igual ao fundo no tema escuro, e a
 * profundidade sumiria justamente onde ela precisa aparecer.
 */
export function BotaoRelevo({
  children,
  href,
  onClick,
  variante = "primario",
  className,
  faceClassName,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variante?: "primario" | "neutro";
  className?: string;
  /** Ajusta a face sem mexer nas camadas: tamanho, caixa do texto, espaçamento. */
  faceClassName?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const face =
    variante === "primario"
      ? "bg-primary text-primary-foreground"
      : "border-2 border-border bg-card text-foreground";

  const corpo = (
    <span className="relative block">
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 rounded-xl",
          variante === "primario" ? "bg-primary brightness-75" : "bg-border"
        )}
        style={{ top: BASE, bottom: -BASE }}
      />
      <span
        className={cn(
          "relative top-0 flex items-center justify-center rounded-xl px-6 py-4 text-[0.85rem] font-black uppercase tracking-[0.08em] transition-[top,filter] duration-100",
          face,
          !disabled && "group-active:top-[4px] group-hover:brightness-105",
          faceClassName
        )}
      >
        {children}
      </span>
    </span>
  );

  // O `group` fica no elemento que recebe o clique: é o `:active` dele que faz
  // a face descer, e no celular o toque chega nele e não na face.
  const classeExterna = cn("group block w-full", disabled && "pointer-events-none opacity-60", className);

  if (href && !disabled) {
    return (
      <Link href={href} className={classeExterna}>
        {corpo}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classeExterna}>
      {corpo}
    </button>
  );
}
