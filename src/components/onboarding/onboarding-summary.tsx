"use client";

import { Flag, Target, Zap } from "lucide-react";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { FalaDoZul } from "@/components/atividade/zul-da-aula";
import { LanguageIcon } from "./language-icon";

/** Onde a pessoa começa, vindo do POST /onboarding/placement (ausente para quem é iniciante). */
export type InicioDaTrilha = { unidade: number; titulo: string | null; xp: number } | null;

interface OnboardingSummaryProps {
  languageSlug: string;
  languageName: string;
  /** Minutos por dia escolhidos na pergunta "commitment". */
  metaMinutos: number | null;
  inicio: InicioDaTrilha;
  onContinue: () => void;
}

/**
 * O fim do onboarding: o plano montado de verdade (linguagem, meta diária e
 * onde a trilha começa), não só um "tudo pronto".
 */
export function OnboardingSummary({ languageSlug, languageName, metaMinutos, inicio, onContinue }: OnboardingSummaryProps) {
  const pulou = inicio && inicio.unidade > 1;
  const linhas = [
    {
      icone: <LanguageIcon id={languageSlug} name={languageName} className="size-5" />,
      rotulo: "Linguagem",
      valor: languageName,
    },
    {
      icone: <Target className="size-5 text-primary" />,
      rotulo: "Meta diária",
      valor: metaMinutos ? `${metaMinutos} min por dia` : "No seu ritmo",
    },
    {
      icone: <Flag className="size-5 text-emerald-500" />,
      rotulo: "Você começa em",
      valor: pulou ? `Unidade ${inicio.unidade}${inicio.titulo ? `: ${inicio.titulo}` : ""}` : "Unidade 1, do começo",
    },
  ];

  return (
    <div className="flex flex-col gap-7 px-4 pb-8 pt-2">
      <FalaDoZul pose="forte" className="animate-fade-in-up">
        {pulou
          ? `Você já sabe bastante! Marquei como feitas as unidades que você domina.`
          : "Tudo pronto! A gente começa do começo, uma aula curta de cada vez."}
      </FalaDoZul>

      <div>
        <h1 className="text-3xl font-extrabold leading-tight text-foreground">Seu plano está pronto</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dá para mudar a meta e a linguagem depois, nas configurações.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {linhas.map((linha, i) => (
          <li
            key={linha.rotulo}
            className="animate-fade-in-up flex items-center gap-3.5 rounded-2xl border-2 border-border bg-card px-4 py-3.5"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">{linha.icone}</span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{linha.rotulo}</span>
              <span className="text-base font-black text-foreground">{linha.valor}</span>
            </span>
          </li>
        ))}
      </ul>

      {pulou && inicio.xp > 0 && (
        <p className="animate-fade-in-up flex items-center gap-2 rounded-2xl bg-amber-400/15 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-300">
          <Zap className="size-4 fill-current" />
          Você ganhou {inicio.xp} XP pelas unidades que já sabia.
        </p>
      )}

      <BotaoRelevo className="w-full" faceClassName="py-4" onClick={onContinue}>
        Começar a estudar
      </BotaoRelevo>
    </div>
  );
}
