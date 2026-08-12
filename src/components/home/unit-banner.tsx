import { Menu } from "lucide-react";
import { UnidadeTrilha } from "@/lib/types/trilha";

interface UnitBannerProps {
  unidade: UnidadeTrilha;
}

export function UnitBanner({ unidade }: UnitBannerProps) {
  const total = unidade.licoes.length;
  const concluidas = unidade.licoes.filter((l) => l.estado === "concluida").length;

  return (
    // top-[72px] deixa o banner logo abaixo da barra de status, que é sticky em
    // top-0 — assim os dois empilham em vez de um passar por cima do outro.
    <div
      className="animate-fade-in-up sticky top-[72px] z-10 rounded-3xl bg-primary px-7 py-5 text-primary-foreground shadow-lg shadow-primary/20"
      style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.18)" }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 basis-50">
          <p className="text-xs font-black uppercase tracking-[0.08em] opacity-85">
            Seção {unidade.secao} • Unidade {unidade.unidade}
          </p>
          <h2 className="mt-1 text-xl font-black sm:text-[1.45rem]">{unidade.titulo}</h2>
        </div>

        <button
          type="button"
          className="zc-press zc-press-shadow flex shrink-0 items-center gap-2 rounded-2xl bg-black/15 px-4.5 py-3"
        >
          <Menu className="size-4.5" strokeWidth={2.4} />
          <span className="text-[0.8rem] font-black uppercase tracking-[0.06em]">Guia</span>
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-md bg-black/20">
          <div
            className="h-full rounded-md bg-primary-foreground transition-[width] duration-300"
            style={{ width: `${Math.round((concluidas / total) * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-black opacity-90">
          {concluidas}/{total}
        </span>
      </div>
    </div>
  );
}
