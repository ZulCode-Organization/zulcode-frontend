import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PerfilUsuario } from "@/lib/types/perfil";
import { estiloDaConquista } from "@/lib/conquistas-icones";
import { cn } from "@/lib/utils";

type Conquista = NonNullable<PerfilUsuario["conquistas"]>[number];

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

/** A grade de tiles. Usada no perfil (4) e na página com todas. */
export function ListaDeConquistas({ conquistas }: { conquistas: Conquista[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {conquistas.map((item, indice) => {
        const { Icone, cor, fundo } = estiloDaConquista(item.id);
        return (
          <div
            key={item.id}
            style={{ animationDelay: `${Math.min(indice, 12) * 35}ms` }}
            className="animate-fade-in-up flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-3 py-4 text-center"
          >
            <span className={cn("grid size-20 place-items-center rounded-[24px]", fundo)}>
              <Icone className={cn("size-10", cor)} strokeWidth={2.2} />
            </span>
            <p className="line-clamp-1 w-full font-black text-foreground">{item.title}</p>
            <p className="line-clamp-2 w-full text-xs text-muted-foreground">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
