"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PerfilUsuario } from "@/lib/types/perfil";
import { SeloConquista } from "@/components/shared/selo-conquista";

type Conquista = NonNullable<PerfilUsuario["conquistas"]>[number];

/** Desbloqueada há menos que isso: o selo leva a etiqueta "NOVA". */
const NOVA_POR = 7 * 24 * 60 * 60 * 1000;

/** Quantas conquistas aparecem no perfil; o resto fica na página "ver todas". */
const NO_PERFIL = 4;

/**
 * As conquistas desbloqueadas, em grade de tiles como no Duolingo. No perfil
 * aparecem só as primeiras; o "›" leva a todas.
 *
 * O ícone é desenhado aqui, a partir do id da conquista — antes vinha como SVG
 * cru do banco e era injetado com `dangerouslySetInnerHTML`. Além de feio,
 * aquilo era HTML de dentro do banco entrando direto na página: qualquer
 * conteúdo mal cadastrado virava marcação executada no navegador de quem olha
 * o perfil. Agora o banco manda o id, e quem escolhe o desenho é o front.
 */
export function AchievementsSection({ conquistas = [] }: { conquistas?: PerfilUsuario["conquistas"] }) {
  const lista = conquistas ?? [];

  return (
    <section>
      <Link href="/perfil/conquistas" className="flex items-center justify-between text-[0.78rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
        Conquistas
        <ChevronRight className="size-4" />
      </Link>

      {lista.length ? (
        <>
          <ListaDeConquistas conquistas={lista.slice(0, NO_PERFIL)} />
          {lista.length > NO_PERFIL && (
            <Link href="/perfil/conquistas" className="mt-4 block text-center text-sm font-black text-primary">
              Ver todas ({lista.length})
            </Link>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Conclua missões especiais para desbloquear suas primeiras conquistas.
        </div>
      )}
    </section>
  );
}

/** A grade de selos. Usada no perfil (4) e na página com todas. */
export function ListaDeConquistas({ conquistas }: { conquistas: Conquista[] }) {
  // O agora é lido uma vez, ao montar: o "NOVA" não precisa mudar com a tela aberta.
  const [agora] = useState(() => Date.now());
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
      {conquistas.map((item, indice) => (
        <div
          key={item.id}
          style={{ animationDelay: `${Math.min(indice, 12) * 35}ms` }}
          className="animate-fade-in-up flex flex-col items-center text-center"
        >
          <SeloConquista id={item.id} nova={agora - new Date(item.unlockedAt).getTime() < NOVA_POR} className="w-[118px]" />
          <p className="mt-1.5 line-clamp-1 w-full font-black text-foreground">{item.title}</p>
          <p className="line-clamp-2 w-full text-xs text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
