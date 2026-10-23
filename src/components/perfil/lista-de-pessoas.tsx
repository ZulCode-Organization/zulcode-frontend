"use client";

import Link from "next/link";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { usePerfil } from "@/hooks/use-perfil";
import { useSeguir } from "@/hooks/use-seguir";
import { PessoaSocial } from "@/lib/social";
import { cn } from "@/lib/utils";

/**
 * Uma lista de pessoas num cartão só, como no Duolingo: avatar, nome e nível.
 * Quem eu ainda não sigo tem o botão de seguir à direita; quem eu já sigo (e
 * eu mesmo) tem a setinha, e a linha leva ao perfil.
 */
export function ListaDePessoas({ pessoas, vazio }: { pessoas: PessoaSocial[] | null; vazio: string }) {
  const { perfil } = usePerfil();
  const { sigo, ocupado, alternar } = useSeguir();

  if (pessoas === null) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("flex items-center gap-3 px-4 py-3.5", i > 0 && "border-t border-border")}>
            <span className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
            <span className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!pessoas.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-border px-5 py-10 text-center">
        <Users className="size-8 text-muted-foreground/60" />
        <p className="text-sm font-black text-muted-foreground">{vazio}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-border">
      {pessoas.map((pessoa, posicao) => {
        const souEu = pessoa.id === perfil?.id;
        const jaSigo = sigo(pessoa.id);
        return (
          <div key={pessoa.id} className={cn("flex items-center gap-3 px-4 py-3", posicao > 0 && "border-t border-border")}>
            <Link href={`/perfil/${pessoa.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar
                iniciais={pessoa.name.slice(0, 2).toUpperCase()}
                avatarId={pessoa.avatarId}
                bannerColor={pessoa.bannerColor}
                size="sm"
                className="[&>div]:size-11 [&>div]:rounded-full [&>div]:text-base [&>div]:ring-0"
              />
              <span className="min-w-0">
                <b className="block truncate text-[0.95rem] text-foreground">
                  {pessoa.name}
                  {pessoa.isVerified && <SeloVerificado className="ml-1 text-[0.85rem]" />}
                </b>
                <span className="text-xs font-bold text-muted-foreground">Nível {pessoa.nivel}</span>
              </span>
            </Link>
            {souEu || jaSigo ? (
              <Link href={`/perfil/${pessoa.id}`} aria-hidden tabIndex={-1} className="text-muted-foreground">
                <ChevronRight className="size-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => alternar(pessoa.id)}
                disabled={ocupado(pessoa.id)}
                aria-label={`Seguir ${pessoa.name}`}
                className="zc-press zc-press-shadow grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
                style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
              >
                <UserPlus className="size-5" strokeWidth={2.6} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
