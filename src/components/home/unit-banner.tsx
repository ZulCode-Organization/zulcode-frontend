import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { CorUnidade } from "@/data/trilha";
import { cn } from "@/lib/utils";

interface UnitBannerProps {
  unidade: UnidadeTrilha;
  /** Cor da unidade ativa — o cabeçalho troca de cor junto com o nome
   * conforme a trilha rola e entra em cada unidade nova. */
  cor: CorUnidade;
  unidades: UnidadeTrilha[];
  onUnidadeClick: (index: number) => void;
}

export function UnitBanner({ unidade, cor, unidades, onUnidadeClick }: UnitBannerProps) {
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
    // --zc-topbar-h é a altura medida da barra de status (a AppTopBar publica
    // ela), que é sticky em top-0 — o banner encosta exatamente embaixo dela
    // em vez de depender de um 72px fixo, que errava sempre que a barra mudava
    // de altura entre breakpoints. O 72px continua só como valor de partida,
    // até a primeira medição.
    // A transição de cor/texto é suave (duration-300) pra não trocar num piscar.
    <div ref={bannerRef}
      className={cn(
        "animate-fade-in-up relative sticky z-10 px-7 py-5 text-white shadow-lg transition-colors duration-300",
        aberto ? "rounded-t-3xl" : "rounded-3xl",
        cor.bg,
        cor.sombra
      )}
      style={{ top: "var(--zc-topbar-h, 72px)", ["--zc-press-color" as string]: "rgba(0,0,0,0.18)" }}
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
        {/* A troca de curso saiu daqui: agora ela mora na barra de status, ao
            lado da ofensiva. Este botão voltou a ser só o guia do curso. */}
        <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.08em] opacity-80">Seções do curso</p>
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
