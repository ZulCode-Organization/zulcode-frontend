import Link from "next/link";
import { ChevronRight, Lock, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const chave = (ano: number, mes: number) => `${ano}-${String(mes + 1).padStart(2, "0")}`;
const nomeDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });

/** Quantas medalhas aparecem no perfil; o resto fica na página "ver todas". */
const NO_PERFIL = 4;

/** Uma medalha: acesa quando ganha, cinza quando não, com cadeado nos meses que ainda não chegaram. */
function Medalha({ ganha, bloqueada, rotulo }: { ganha: boolean; bloqueada: boolean; rotulo: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "grid aspect-square w-full max-w-[92px] place-items-center rounded-full border-[3px]",
          ganha
            ? "border-purple-300/60 bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white shadow-[0_6px_0_rgba(88,28,135,0.6)]"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {bloqueada ? <Lock className="size-6" /> : <Medal className={cn("size-8", ganha && "text-amber-300")} strokeWidth={2.2} />}
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
          return <Medalha key={k} ganha={ganha} bloqueada={bloqueada} rotulo={rotulo} />;
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
