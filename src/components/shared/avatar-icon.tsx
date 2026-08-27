"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Atom, BadgeCheck, Bot, Code2, Crown, Ghost, Rocket, ShieldCheck, Sparkles, Orbit, Terminal, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** O único avatar que não é ícone de traço: é o logo da marca, em imagem. */
export const AVATAR_MARCA = "zulcode";

/** Conta oficial, a única que pode escolher o logo como avatar. */
const EMAIL_DA_MARCA = "contato.zulcode@gmail.com";

/**
 * Quem pode usar o avatar da marca.
 *
 * ATENÇÃO: isto é só a trava da interface — esconde a opção de quem não é a
 * conta oficial. Não é segurança: qualquer pessoa pode mandar
 * `avatarId: "zulcode"` direto pro PUT /user. Pra valer de verdade, o backend
 * precisa recusar esse id quando o dono da requisição não for essa conta.
 */
export function podeUsarAvatarDaMarca(email?: string | null) {
  return email?.trim().toLowerCase() === EMAIL_DA_MARCA;
}

export const AVATARES = [
  { id: "orbit", label: "Órbita", Icon: Atom },
  { id: "code", label: "Código", Icon: Code2 },
  { id: "rocket", label: "Foguete", Icon: Rocket },
  { id: "shield", label: "Escudo", Icon: ShieldCheck },
  { id: "bot", label: "Bot", Icon: Bot },
  { id: "spark", label: "Faísca", Icon: Sparkles },
  { id: "crown", label: "Coroa", Icon: Crown },
  { id: "ghost", label: "Fantasma", Icon: Ghost },
  { id: "comet", label: "Cometa", Icon: Orbit },
  { id: "pro", label: "Emblema PRO", Icon: BadgeCheck },
  { id: "developer", label: "Desenvolvedor", Icon: Terminal },
  { id: "early-tester", label: "Pioneiro", Icon: FlaskConical },
  // O Icon aqui nunca é usado: o ZulCode cai no ramo da imagem logo abaixo.
  { id: AVATAR_MARCA, label: "ZulCode", Icon: Atom },
] as const;

export type AvatarId = (typeof AVATARES)[number]["id"];

export function AvatarIcon({ id, className }: { id?: string | null; className?: string }) {
  const { resolvedTheme } = useTheme();
  const avatar = AVATARES.find((item) => item.id === id) ?? AVATARES[0];

  if (avatar.id === AVATAR_MARCA) {
    // Segue o tema pelo mesmo motivo da sidebar: o logo aparece tanto sobre a
    // cor da capa quanto sobre o fundo neutro da grade de escolha, e a versão
    // errada some contra o claro.
    const arquivo = resolvedTheme === "dark" ? "/icon-only-dark.svg" : "/icon-only.svg";
    return (
      <Image
        src={arquivo}
        alt={avatar.label}
        width={64}
        height={64}
        className={cn("size-[0.9em] object-contain", className)}
      />
    );
  }

  const Icon = avatar.Icon;
  return <Icon aria-label={avatar.label} className={cn("size-[0.9em] stroke-[2.4]", className)} />;
}
