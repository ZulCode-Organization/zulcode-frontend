import Image from "next/image";
import { cn } from "@/lib/utils";
import { AVATARES_DESENHADOS, AVATARES_RAROS, resolverAvatar } from "@/lib/avatares";

/** Todos os ícones, para as listas de escolha da administração. */
export const AVATARES: { id: string; label: string }[] = [
  ...AVATARES_DESENHADOS.map((avatar) => ({ id: avatar.id, label: avatar.nome })),
  ...AVATARES_RAROS.map((avatar) => ({ id: avatar.id, label: `${avatar.nome} (raro)` })),
];

/**
 * O ícone do perfil, desenhado dentro do quadrado de quem o usa.
 *
 * O desenho ocupa 76% do quadrado, em qualquer tamanho, e pinta com a cor do
 * texto (currentColor): quem usa decide a cor, quase sempre branco sobre a cor
 * da capa. O raro é a arte oficial do app e cobre o quadrado inteiro, com os
 * mesmos cantos dele.
 */
export function AvatarIcon({ id, className }: { id?: string | null; className?: string }) {
  const resolvido = resolverAvatar(id);

  if (resolvido.tipo === "raro") {
    return (
      <Image
        src={resolvido.avatar.imagem}
        alt={resolvido.avatar.nome}
        width={256}
        height={256}
        draggable={false}
        className={cn("size-full shrink-0 select-none rounded-[inherit] object-cover", className)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={resolvido.avatar.nome}
      className={cn("size-[76%] shrink-0", className)}
      // O desenho é um texto fixo de src/lib/avatares.ts, nunca algo vindo de fora.
      dangerouslySetInnerHTML={{ __html: resolvido.avatar.desenho }}
    />
  );
}
