import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (event: MouseEvent | TouchEvent) => {
      if (bannerRef.current && !bannerRef.current.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("touchstart", fecharFora);
    return () => { document.removeEventListener("mousedown", fecharFora); document.removeEventListener("touchstart", fecharFora); };
  }, [aberto]);
  const total = unidade?.licoes?.length ?? 0;
  const concluidas = unidade?.licoes?.filter((l) => l.estado === "concluida").length ?? 0;

  return (
    // top-[72px] deixa o banner logo abaixo da barra de status, que é sticky em
    // top-0 — assim os dois empilham em vez de um passar por cima do outro.
    // A transição de cor/texto é suave (duration-300) pra não trocar num piscar.
    <div ref={bannerRef}
      className={cn(
        "animate-fade-in-up relative sticky top-[72px] z-10 px-7 py-5 text-white shadow-lg transition-colors duration-300",
        aberto ? "rounded-t-3xl" : "rounded-3xl",
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

      {aberto && <>
        <div className={cn("absolute left-0 right-0 top-full z-20 rounded-b-3xl px-7 pb-5 pt-4 text-white shadow-lg", cor.bg)}>
        <div className="grid grid-cols-3 gap-3 pb-4 sm:grid-cols-6">
          {cursos.map(curso => <button key={curso.id} type="button" onClick={() => { onCursoChange(curso.id); setAberto(false); }} title={`Trocar para ${curso.name}`} className={cn(
            "group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-transparent px-1 py-1.5 text-white transition-all duration-150",
            curso.id === cursoAtual
              ? "border-white/90"
              : "opacity-70 hover:border-white/45 hover:opacity-100"
          )}>
            <span className="flex size-11 items-center justify-center text-white">
              <LanguageIcon id={curso.id} name={curso.name} className="size-[26px]" monochrome />
            </span>
            <span className="w-full text-center text-[0.6rem] font-black uppercase leading-tight tracking-[0.02em]">{curso.name}</span>
          </button>)}
        </div>
        <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.08em] opacity-80">Seções de {cursos.find(c => c.id === cursoAtual)?.name}</p>
        <div className="grid gap-2">
          {unidades.map((item, index) => <button key={item.id} type="button" onClick={() => { onUnidadeClick(index); setAberto(false); }} className="rounded-xl bg-black/15 px-3 py-2 text-left text-sm font-bold hover:bg-black/25">Unidade {index + 1}: {item.titulo}</button>)}
        </div>
        </div>
      </>}

      <div className="mt-3.5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-md bg-black/20">
          <div
            className="h-full rounded-md bg-white transition-[width] duration-300"
            style={{ width: `${total ? Math.round((concluidas / total) * 100) : 0}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-black opacity-90">
          {concluidas}/{total}
        </span>
      </div>
    </div>
  );
}
