import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { CorUnidade } from "@/data/trilha";
import { cn } from "@/lib/utils";
import { UnidadeGuia } from "./unidade-guia";

interface UnitBannerProps {
  unidade: UnidadeTrilha;
  /** Cor da unidade ativa — o cabeçalho troca de cor junto com o nome
   * conforme a trilha rola e entra em cada unidade nova. */
  cor: CorUnidade;
  unidades: UnidadeTrilha[];
  onUnidadeClick: (index: number) => void;
}

/* Mesmas medidas dos nós da trilha (lesson-node): a base fica 9px abaixo da
 * face, e a face desce 7px ao ser apertada — sobra 2px de base aparecendo, que
 * é o que mantém o botão com corpo enquanto está afundado. */
const ALTURA_BASE = 9;
const AFUNDA = 7;
/** Quanto o afundar leva. Curto de propósito: é resposta ao toque. */
const AFUNDA_MS = 100;
/**
 * A troca de cor ao rolar entre unidades. Precisa ser idêntica na face e na
 * base, senão a face muda de cor na hora e a sombra fica desbotando atrás —
 * e as duas propriedades têm durações diferentes (cor lenta, afundar rápido),
 * o que não cabe numa classe só do Tailwind.
 */
const TROCA_DE_COR = "background-color 300ms ease";

export function UnitBanner({ unidade, cor, unidades, onUnidadeClick }: UnitBannerProps) {
  const [aberto, setAberto] = useState(false);
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [afundado, setAfundado] = useState(false);
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
    // A camada de fora só cuida de grudar no topo: --zc-banner-top é a altura
    // medida da barra de status no celular, e 12px do lg pra cima, onde o
    // cabeçalho sobe pra dentro da faixa vazia da barra (zc-banner-topo).
    // Nenhum visual mora aqui — o corpo do botão são as duas camadas de dentro.
    <div
      ref={bannerRef}
      className="zc-banner-topo animate-fade-in-up sticky z-10"
      style={{ top: "var(--zc-banner-top, 72px)" }}
    >
      <div className="relative">
        {/* Base sólida: a mesma cor da unidade em brightness-75, assomando na
            borda de baixo. É exatamente como os nós da trilha são montados —
            não é box-shadow, é uma peça de verdade atrás, e é ela que dá o
            corpo do botão. Some quando o guia abre, porque aí o cabeçalho
            deixa de ser um bloco solto e vira o topo de um painel. */}
        {!aberto && (
          <div
            className={cn("absolute inset-x-0 rounded-3xl brightness-75", cor.bg)}
            style={{ top: ALTURA_BASE, bottom: -ALTURA_BASE, transition: TROCA_DE_COR }}
            aria-hidden
          />
        )}

        {/* Face clicável: é ela que desce na base ao ser apertada. É um div com
            role=button, e não um <button>, porque o botão do guia mora dentro
            dele — e botão dentro de botão é HTML inválido. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Ver a unidade ${unidade.unidade}: ${unidade.titulo}`}
          onClick={() => setGuiaAberto(true)}
          onKeyDown={(evento) => {
            if (evento.key !== "Enter" && evento.key !== " ") return;
            evento.preventDefault();
            setGuiaAberto(true);
          }}
          onPointerDown={() => setAfundado(true)}
          onPointerUp={() => setAfundado(false)}
          onPointerCancel={() => setAfundado(false)}
          onPointerLeave={() => setAfundado(false)}
          className={cn(
            "relative cursor-pointer px-7 py-5 text-left text-white",
            aberto ? "rounded-t-3xl" : "rounded-3xl",
            cor.bg
          )}
          style={{ top: afundado ? AFUNDA : 0, transition: `top ${AFUNDA_MS}ms ease, ${TROCA_DE_COR}` }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1 basis-50">
              <p className="text-xs font-black uppercase tracking-[0.08em] opacity-85">
                Seção {unidade.secao} • Unidade {unidade.unidade}
              </p>
              <h2 className="mt-1 text-xl font-black sm:text-[1.45rem]">{unidade.titulo}</h2>
            </div>

            {/* O guia é outro destino: stopPropagation no clique pra não abrir
                a tela da unidade junto, e no pointerdown pra o cabeçalho não
                afundar enquanto quem está sendo apertado é este botão. */}
            <button
              type="button"
              onClick={(evento) => { evento.stopPropagation(); setAberto(v => !v); }}
              onPointerDown={(evento) => evento.stopPropagation()}
              aria-label="Abrir guia do curso"
              className="zc-press zc-press-shadow flex shrink-0 items-center justify-center rounded-2xl bg-black/15 p-3"
            >
              {aberto ? <X className="size-4.5" strokeWidth={2.4} /> : <Menu className="size-4.5" strokeWidth={2.4} />}
            </button>
          </div>

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

        {aberto && (
          // Abre desenrolando de cima pra baixo, como se o painel saísse de
          // dentro do cabeçalho, e as unidades entram em cascata atrás.
          <div
            className={cn(
              "zc-guia-abre absolute left-0 right-0 top-full z-20 origin-top overflow-hidden rounded-b-3xl px-7 pb-5 pt-4 text-white shadow-lg",
              cor.bg
            )}
          >
            {/* A troca de curso saiu daqui: agora ela mora na barra de status,
                ao lado da ofensiva. Este botão voltou a ser só o guia. */}
            <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.08em] opacity-80">Seções do curso</p>
            <div className="grid gap-2">
              {unidades.map((item, index) => {
                const ehAtual = item.id === unidade.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(evento) => { evento.stopPropagation(); onUnidadeClick(index); setAberto(false); }}
                    style={{ animationDelay: `${120 + index * 40}ms` }}
                    className={cn(
                      "animate-fade-in-up flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors duration-150",
                      ehAtual ? "bg-white/90 text-black" : "bg-black/15 hover:bg-black/25"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black",
                        ehAtual ? "bg-black/15" : "bg-white/15"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {guiaAberto && <UnidadeGuia unidade={unidade} cor={cor} onClose={() => setGuiaAberto(false)} />}
    </div>
  );
}
