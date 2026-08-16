"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { ElementoTile } from "@/components/elementos/elemento-tile";
import { categoriasElementos } from "@/data/elementos";

function ElementosContent() {
  return (
    <div className="pt-3">
      <h1 className="text-2xl font-black text-foreground sm:text-[1.7rem]">Vamos rever os elementos de JS!</h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Toque num elemento pra ver o significado e um exemplo de novo.
      </p>

      {categoriasElementos.map((categoria) => (
        <div key={categoria.titulo} className="mt-8">
          <div className="flex items-center gap-3.5">
            <h2 className="shrink-0 text-lg font-black text-foreground">{categoria.titulo}</h2>
            <div className="h-px flex-1 bg-border" aria-hidden />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoria.itens.map((elemento) => (
              <ElementoTile key={elemento.id} elemento={elemento} />
            ))}
          </div>
        </div>
      ))}

      <p className="mt-10 text-center text-[0.85rem] text-muted-foreground">
        Mais elementos entram aqui conforme as próximas lições forem ganhando conteúdo.
      </p>
    </div>
  );
}

export default function ElementosPage() {
  useRequireAuth();

  return (
    <AppShell rightPanel={<SideFooter />}>
      <ElementosContent />
    </AppShell>
  );
}
