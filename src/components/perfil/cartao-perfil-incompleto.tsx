"use client";

import { PerfilUsuario } from "@/lib/types/perfil";

/**
 * O passo que falta para o perfil ficar completo, no estilo do Duolingo.
 * Some sozinho quando não falta nada. Hoje o passo é o avatar e a cor do
 * banner; o "continuar" abre o editor de perfil.
 */
export function CartaoPerfilIncompleto({ perfil, onContinuar }: { perfil: PerfilUsuario; onContinuar: () => void }) {
  const faltaAvatar = !perfil.avatarId;
  const faltaBanner = !perfil.bannerColor;
  if (!faltaAvatar && !faltaBanner) return null;

  const passo = faltaAvatar ? "Escolha o seu avatar" : "Escolha a cor do banner";

  return (
    <section className="rounded-[20px] border border-border bg-card p-4">
      <h2 className="text-[1.05rem] font-black text-foreground">Termine o seu perfil!</h2>
      <p className="mt-1 text-sm text-muted-foreground">Falta 1 passo: {passo.toLowerCase()}</p>
      <button
        type="button"
        onClick={onContinuar}
        className="zc-press zc-press-shadow mt-3 w-full rounded-2xl bg-primary py-3 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
        style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
      >
        Continuar
      </button>
    </section>
  );
}
