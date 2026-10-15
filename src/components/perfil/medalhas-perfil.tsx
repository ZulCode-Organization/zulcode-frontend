import { Lock, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const chave = (ano: number, mes: number) => `${ano}-${String(mes + 1).padStart(2, "0")}`;
const nomeDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long" });

/**
 * As medalhas do mês: quem fez um pódio numa semana do mês ganha a medalha
 * dele. Os anos aparecem do atual até o primeiro com medalha; os meses que
 * ainda não chegaram ficam com cadeado.
 */
export function MedalhasDoPerfil({ medalhas = [] }: { medalhas?: string[] }) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const ganhas = new Set(medalhas);
  const primeiroAno = medalhas.length ? Math.min(...medalhas.map((m) => Number(m.slice(0, 4)))) : anoAtual;

  const anos: number[] = [];
  for (let ano = anoAtual; ano >= primeiroAno; ano--) anos.push(ano);

  return (
    <section>
      <h2 className="text-[0.78rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Medalhas</h2>
      <div className="mt-4 flex flex-col gap-6">
        {anos.map((ano) => (
          <div key={ano}>
            <p className="text-[0.95rem] font-black text-foreground">Medalhas de {ano}</p>
            <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-4">
              {Array.from({ length: 12 }, (_, mes) => {
                const ganha = ganhas.has(chave(ano, mes));
                const bloqueada = ano === anoAtual && mes > agora.getMonth();
                return (
                  <div key={mes} className="flex flex-col items-center gap-1.5">
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
                    <span className={cn("text-[0.78rem] font-bold capitalize", ganha ? "text-foreground" : "text-muted-foreground")}>
                      {nomeDoMes(ano, mes)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
