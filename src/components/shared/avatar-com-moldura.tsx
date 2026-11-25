import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "./avatar-icon";
import { Moldura } from "./moldura";

/**
 * O ícone do perfil como ele aparece no perfil: o quadrado arredondado na cor
 * da capa, o desenho em branco e a moldura em volta.
 *
 * O tamanho, os cantos e a borda vêm de quem usa (className). Sem
 * `overflow-hidden`, de propósito: a moldura sai para fora do quadrado.
 * `children` fica por cima de tudo (o selo de nível do perfil, por exemplo).
 */
export function AvatarComMoldura({
  avatarId,
  molduraId,
  capa,
  animar = true,
  className,
  style,
  children,
}: {
  avatarId?: string | null;
  molduraId?: string | null;
  /** O fundo do quadrado: a cor (ou o gradiente) da capa. */
  capa: string;
  animar?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center text-white", className)} style={{ background: capa, ...style }}>
      <AvatarIcon id={avatarId} />
      <Moldura id={molduraId} animar={animar} />
      {children}
    </span>
  );
}
