import { Menu, X } from "lucide-react";
import { useState } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { CorUnidade } from "@/data/trilha";
import { cn } from "@/lib/utils";
import { CursoDaJornada } from "@/hooks/use-jornada";
import { LanguageIcon } from "@/components/onboarding/language-icon";

interface UnitBannerProps {
  unidade: UnidadeTrilha;
  /** Cor da unidade ativa — o cabeçalho troca de cor junto com o nome
   * conforme a trilha rola e entra em cada unidade nova. */
  cor: CorUnidade;
  unidades: UnidadeTrilha[];
  cursos: CursoDaJornada[];
  cursoAtual: string;
  onCursoChange: (slug: string) => void;
  onUnidadeClick: (index: number) => void;
}

export function UnitBanner({ unidade, cor, unidades, cursos, cursoAtual, onCursoChange, onUnidadeClick }: UnitBannerProps) {
  const [aberto, setAberto] = useState(false);
  const total = unidade.licoes.length;
  const concluidas = unidade.licoes.filter((l) => l.estado === "concluida").length;

  return (
    // top-[72px] deixa o banner logo abaixo da barra de status, que é sticky em
    // top-0 — assim os dois empilham em vez de um passar por cima do outro.
    // A transição de cor/texto é suave (duration-300) pra não trocar num piscar.
    <div
      className={cn(
        "animate-fade-in-up sticky top-[72px] z-10 rounded-3xl px-7 py-5 text-white shadow-lg transition-colors duration-300",
        cor.bg,
        cor.sombra
      )}
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
          onClick={() => setAberto(v => !v)} aria-label="Abrir guia do curso"
          className="zc-press zc-press-shadow flex shrink-0 items-center justify-center rounded-2xl bg-black/15 p-3"
        >
          {aberto ? <X className="size-4.5" strokeWidth={2.4} /> : <Menu className="size-4.5" strokeWidth={2.4} />}
        </button>
      </div>

      {aberto && <div className="mt-5 border-t border-white/25 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {cursos.map(curso => <button key={curso.id} type="button" onClick={() => { onCursoChange(curso.id); setAberto(false); }} title={curso.name} className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15", curso.id === cursoAtual && "ring-2 ring-white") }>
            <LanguageIcon id={curso.id} name={curso.name} className="size-6" />
          </button>)}
        </div>
        <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.08em] opacity-80">Seções de {cursos.find(c => c.id === cursoAtual)?.name}</p>
        <div className="grid gap-2">
          {unidades.map((item, index) => <button key={item.id} type="button" onClick={() => { onUnidadeClick(index); setAberto(false); }} className="rounded-xl bg-black/15 px-3 py-2 text-left text-sm font-bold hover:bg-black/25">Unidade {index + 1}: {item.titulo}</button>)}
        </div>
      </div>}

      <div className="mt-3.5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-md bg-black/20">
          <div
            className="h-full rounded-md bg-white transition-[width] duration-300"
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
