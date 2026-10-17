"use client";

import { useEffect, useState } from "react";
import { Sparkles, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { reagir } from "@/lib/reacoes";
import { ZulDaAula } from "./zul-da-aula";
import "./aula.css";

interface TelaConclusaoProps {
  xp: number;
  acertos: number;
  total: number;
  onRevisar: () => void;
  onContinuar: () => void;
  /** true enquanto o XP de verdade ainda está sendo confirmado no backend
   * (POST /lessons/:id/complete) — só existe pra lição conectada de
   * verdade; nas outras, xp já chega pronto e isso nunca é true. */
  salvando?: boolean;
  /** POST falhou (rede caiu, sessão expirou etc.) — avisa em vez de fingir
   * que o XP foi salvo. */
  erroSalvar?: boolean;
  /** XP que a lição vale sem bônus. Quando o XP confirmado vem dobrado, é a
   * comparação com esse valor que revela o power-up ativo. */
  xpBase?: number;
  /** O cartão de revisão da aula: o que vale guardar dela. */
  resumo?: { texto: string; codigo?: string };
}

function qualificador(percentual: number): string {
  if (percentual === 100) return "Incrível";
  if (percentual >= 75) return "Muito bem";
  if (percentual >= 50) return "Bom";
  return "Continue tentando";
}

function prefereMenosMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Conta de `inicio` até `alvo` com desaceleração. Trocar o alvo no meio
 * recomeça a contagem do ponto novo — é isso que encadeia a segunda subida
 * quando o bônus entra. Com movimento reduzido, devolve o alvo direto. */
function useContador(alvo: number, inicio: number, duracao: number, comecar: boolean, semMovimento: boolean) {
  const [valor, setValor] = useState(inicio);

  useEffect(() => {
    if (!comecar || semMovimento) return;

    let quadro = 0;
    const partida = performance.now();
    const passo = (agora: number) => {
      const progresso = Math.min(1, (agora - partida) / duracao);
      const suave = 1 - Math.pow(1 - progresso, 3);
      setValor(Math.round(inicio + (alvo - inicio) * suave));
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, inicio, duracao, comecar, semMovimento]);

  return semMovimento ? alvo : valor;
}

export function TelaConclusao({ xp, acertos, total, onRevisar, onContinuar, salvando, erroSalvar, xpBase, resumo }: TelaConclusaoProps) {
  const percentual = Math.round((acertos / total) * 100);

  // A vinheta de fim de lição toca uma vez, quando a tela aparece.
  useEffect(() => reagir("licaoConcluida"), []);

  // O backend já entrega o XP dobrado quando o power-up está valendo; aqui só
  // reconhecemos isso comparando com o que a lição vale sem bônus. Nada é
  // multiplicado na tela — o número mostrado é o que foi salvo de verdade.
  const dobrado = !!xpBase && xpBase > 0 && xp === xpBase * 2;
  const [bonusVisivel, setBonusVisivel] = useState(false);
  const [semMovimento] = useState(prefereMenosMovimento);

  // A contagem só começa depois que o XP foi confirmado, senão ela subiria
  // até o valor provisório e teria que corrigir na frente do usuário.
  const contando = !salvando;

  // Sobe até o XP normal, respira um instante e só então o bônus entra e a
  // contagem continua até o total — é o que faz o "2×" ser percebido.
  useEffect(() => {
    if (!dobrado || !contando || semMovimento) return;
    const id = window.setTimeout(() => setBonusVisivel(true), 750);
    return () => window.clearTimeout(id);
  }, [dobrado, contando, semMovimento]);

  const emBonus = dobrado && (bonusVisivel || semMovimento);
  const xpVisivel = useContador(
    emBonus ? xp : dobrado ? xpBase! : xp,
    emBonus ? xpBase! : 0,
    emBonus ? 700 : 550,
    contando,
    semMovimento
  );

  return (
    <div className="zc-aula flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <ZulDaAula pose="oculos" caiu className="size-44" />
        <h1 className="text-3xl font-black text-foreground">Lição concluída!</h1>

        <div className="flex gap-4">
          <div
            className={cn(
              "relative rounded-2xl border-2 px-7 py-4 transition-colors duration-300",
              emBonus ? "border-violet-500 bg-violet-500/10" : "border-amber-400 bg-amber-400/10"
            )}
          >
            {/* Selo do power-up: entra com o mesmo "pop" dos acertos da lição. */}
            {emBonus && (
              <span className="animate-check-pop absolute -right-3 -top-3 flex items-center gap-0.5 rounded-full bg-violet-600 px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.06em] text-white shadow-lg">
                <Zap className="size-3 fill-current" />
                2×
              </span>
            )}

            <p
              className={cn(
                "text-[0.7rem] font-black uppercase tracking-[0.08em] transition-colors duration-300",
                emBonus ? "text-violet-500" : "text-amber-600"
              )}
            >
              Total de XP
            </p>
            <p
              className={cn(
                "mt-1 flex items-center justify-center gap-1.5 text-2xl font-black tabular-nums transition-colors duration-300",
                emBonus ? "text-violet-500" : "text-amber-600"
              )}
            >
              <Zap className="size-5 fill-current" />
              {xpVisivel}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#22c55e] bg-[#22c55e]/10 px-7 py-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[#16a34a] dark:text-[#4ade80]">
              {qualificador(percentual)}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-2xl font-black text-[#16a34a] dark:text-[#4ade80]">
              <Target className="size-5" />
              {percentual}%
            </p>
          </div>
        </div>

        {emBonus && (
          <p className="animate-fade-in-up text-sm font-black text-violet-500">
            XP em dobro aplicado! {xpBase} + {xpBase} de bônus.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Você acertou {acertos} de {total} perguntas.
        </p>
        {resumo && (
          <div className="zc-aula-entra-um w-full max-w-md rounded-2xl border-2 border-border p-4 text-left [animation-delay:0.8s]">
            <p className="flex items-center gap-1.5 text-[0.72rem] font-black uppercase tracking-[0.08em] text-[#1892ff]">
              <Sparkles className="size-4" />
              Seu cartão de revisão
            </p>
            {resumo.codigo && (
              <pre className="mt-2.5 overflow-x-auto rounded-xl bg-muted/60 px-3 py-2.5 font-mono text-[0.8rem] leading-relaxed text-foreground">{resumo.codigo}</pre>
            )}
            <p className="mt-2.5 text-[0.85rem] font-semibold leading-relaxed text-muted-foreground">{resumo.texto}</p>
          </div>
        )}
        {salvando && <p className="text-xs font-bold text-primary">Confirmando conclusão e recompensas…</p>}
        {erroSalvar && (
          <p className="text-xs font-bold text-red-500">
            Não deu pra confirmar seu XP agora. Verifica sua conexão e tenta de novo mais tarde.
          </p>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md gap-3 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={salvando}
          onClick={onRevisar}
          data-cor="contorno"
          className="zc-aula-botao flex-1 disabled:cursor-wait disabled:opacity-50"
        >
          Revisar lição
        </button>
        <button
          type="button"
          disabled={salvando}
          onClick={onContinuar}
          data-cor="verde"
          className="zc-aula-botao flex-1 disabled:cursor-wait disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
