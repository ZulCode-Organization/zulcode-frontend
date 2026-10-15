import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { medalhaDoMes } from "@/lib/selos";
import { cn } from "@/lib/utils";

const chave = (ano: number, mes: number) => `${ano}-${String(mes + 1).padStart(2, "0")}`;
const nomeDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });

/** Quantas medalhas aparecem no perfil; o resto fica na página "ver todas". */
const NO_PERFIL = 4;

/**
 * Uma medalha: o círculo na cor do mês com a arte do Zul daquele mês. Sem a
 * medalha, a arte fica apagada; nos meses que ainda não chegaram, o cadeado.
 */
function Medalha({ mes, ganha, bloqueada, rotulo }: { mes: number; ganha: boolean; bloqueada: boolean; rotulo: string }) {
  const { arte, cor } = medalhaDoMes(mes);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "relative grid aspect-square w-full max-w-[92px] place-items-center overflow-hidden rounded-full",
          bloqueada ? "border-[3px] border-border bg-muted text-muted-foreground" : "shadow-[inset_0_-6px_0_rgba(0,0,0,0.18),0_4px_0_rgba(0,0,0,0.35)]",
        )}
        style={bloqueada ? undefined : { background: `radial-gradient(circle at 50% 30%, ${cor}, color-mix(in srgb, ${cor} 55%, #000))` }}
      >
        {bloqueada ? (
          <Lock className="size-6" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- arte estática pequena, já otimizada em WebP. */}
            <img src={arte} alt="" draggable={false} className={cn("absolute -bottom-[8%] left-1/2 max-h-[108%] w-[108%] -translate-x-1/2 object-contain", !ganha && "opacity-60 grayscale")} />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_4px_rgba(255,255,255,0.28)]" />
          </>
        )}
        {!bloqueada && !ganha && <span aria-hidden className="absolute inset-0 bg-black/45" />}
      </span>
      <span className={cn("text-center text-[0.78rem] font-bold capitalize", ganha ? "text-foreground" : "text-muted-foreground")}>{rotulo}</span>
    </div>
  );
}

/**
 * As medalhas no perfil: só 4, como as conquistas, e o "›" leva a todas.
 * Primeiro as ganhas mais recentes; o que faltar é completado pelo mês atual
 * e pelos próximos (com cadeado).
 */
export function MedalhasDoPerfil({ medalhas = [] }: { medalhas?: string[] }) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const atual = chave(anoAtual, agora.getMonth());
  const ganhas = new Set(medalhas);

  const itens = [...medalhas]
    .sort()
    .reverse()
    .slice(0, NO_PERFIL)
    .map((k) => ({ k, ganha: true, bloqueada: false }));
  for (let ano = anoAtual, mes = agora.getMonth(); itens.length < NO_PERFIL; mes === 11 ? ((mes = 0), ano++) : mes++) {
    const k = chave(ano, mes);
    if (!itens.some((item) => item.k === k)) itens.push({ k, ganha: ganhas.has(k), bloqueada: k > atual });
  }

  return (
    <section>
      <Link href="/perfil/medalhas" className="flex items-center justify-between text-[0.78rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
        Medalhas
        <ChevronRight className="size-4" />
      </Link>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {itens.map(({ k, ganha, bloqueada }) => {
          const ano = Number(k.slice(0, 4));
          const mes = Number(k.slice(5)) - 1;
          const rotulo = ano === anoAtual ? nomeDoMes(ano, mes) : `${nomeDoMes(ano, mes).slice(0, 3)}/${String(ano).slice(2)}`;
          return <Medalha key={k} mes={mes} ganha={ganha} bloqueada={bloqueada} rotulo={rotulo} />;
        })}
      </div>
    </section>
  );
}

/**
 * Todas as medalhas, um ano por bloco: quem fez um pódio numa semana do mês
 * ganha a medalha dele. Os anos vão do atual até o primeiro com medalha.
 */
export function TodasAsMedalhas({ medalhas = [] }: { medalhas?: string[] }) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const ganhas = new Set(medalhas);
  const primeiroAno = medalhas.length ? Math.min(...medalhas.map((m) => Number(m.slice(0, 4)))) : anoAtual;

  const anos: number[] = [];
  for (let ano = anoAtual; ano >= primeiroAno; ano--) anos.push(ano);

  return (
    <div className="flex flex-col gap-7">
      {anos.map((ano) => (
        <section key={ano}>
          <h2 className="text-[1.1rem] font-black text-foreground">Medalhas de {ano}</h2>
          <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-4">
            {Array.from({ length: 12 }, (_, mes) => (
              <Medalha
                key={mes}
                mes={mes}
                ganha={ganhas.has(chave(ano, mes))}
                bloqueada={ano === anoAtual && mes > agora.getMonth()}
                rotulo={nomeDoMes(ano, mes)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
