import { PerfilUsuario } from "@/lib/types/perfil";
import { estiloDaConquista } from "@/lib/conquistas-icones";
import { cn } from "@/lib/utils";

/**
 * As conquistas desbloqueadas.
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
    <section className="rounded-[20px] border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">Conquistas</h2>
        {lista.length > 0 && (
          <span className="shrink-0 text-[0.78rem] font-black text-muted-foreground">{lista.length}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Seus emblemas, banners e presentes desbloqueados aparecem aqui.
      </p>

      {lista.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {lista.map((item, indice) => {
            const { Icone, cor, fundo } = estiloDaConquista(item.id);
            return (
              <div
                key={item.id}
                style={{ animationDelay: `${Math.min(indice, 12) * 35}ms` }}
                className="animate-fade-in-up flex items-center gap-3 rounded-2xl bg-muted/50 p-3 transition-colors duration-150 hover:bg-muted"
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-[14px]", fundo)}>
                  <Icone className={cn("size-5.5", cor)} strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-black text-foreground">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Conclua missões especiais para desbloquear suas primeiras conquistas.
        </div>
      )}
    </section>
  );
}
