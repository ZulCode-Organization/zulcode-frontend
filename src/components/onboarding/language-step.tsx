"use client";

import { useState } from "react";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { LanguageOption, OnboardingQuestion } from "@/lib/onboarding/types";
import { sugerirLinguagem } from "@/lib/onboarding/sugestao";
import { cn } from "@/lib/utils";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { LanguageIcon } from "./language-icon";
import { OptionCard } from "./option-card";

interface LanguageStepProps {
  languages: LanguageOption[];
  /** A pergunta "Do que você mais gosta?", quando a API a tem. Sem ela, o "Não sei qual escolher" some. */
  interesse?: OnboardingQuestion;
  onSelect: (languageId: string) => void;
  /** Guarda o gosto escolhido para ir junto com as outras respostas. */
  onInteresse?: (optionId: string) => void;
  /** Avisa a tela de fora em que parte deste passo a pessoa está (o Zul ao lado reage). */
  onFase?: (fase: Fase) => void;
}

export type Fase = { tipo: "lista" } | { tipo: "gosto" } | { tipo: "sugestao"; slug: string; porque: string };

/**
 * A escolha da linguagem. Quem não sabe qual escolher toca em "Não sei qual
 * escolher", responde do que gosta e recebe uma sugestão, com o porquê. Dá
 * sempre para voltar e escolher outra na mão.
 */
export function LanguageStep({ languages, interesse, onSelect, onInteresse, onFase }: LanguageStepProps) {
  const [fase, setFaseLocal] = useState<Fase>({ tipo: "lista" });
  const mudar = (nova: Fase) => {
    setFaseLocal(nova);
    onFase?.(nova);
  };

  if (fase.tipo === "gosto" && interesse) {
    return (
      <div className="animate-slide-in-right flex flex-col gap-6 px-4 pb-8 pt-2 lg:px-0">
        <button
          type="button"
          onClick={() => mudar({ tipo: "lista" })}
          className="-mb-2 flex w-fit items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Ver todas as linguagens
        </button>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight text-foreground lg:text-3xl">{interesse.title}</h1>
          {interesse.subtitle && <p className="mt-2 text-sm text-muted-foreground lg:text-base">{interesse.subtitle}</p>}
        </div>
        <div className="flex flex-col gap-3">
          {interesse.options.map((opcao, i) => (
            <div key={opcao.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <OptionCard
                label={opcao.label}
                optionId={opcao.id}
                onClick={() => {
                  onInteresse?.(opcao.id);
                  const sugestao = sugerirLinguagem(opcao.id, languages.map((l) => l.id));
                  if (sugestao) mudar({ tipo: "sugestao", slug: sugestao.slug, porque: sugestao.porque });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fase.tipo === "sugestao") {
    const linguagem = languages.find((l) => l.id === fase.slug);
    const porque = fase.porque;
    return (
      <div className="animate-pop-in flex flex-col items-center gap-6 px-4 pb-8 pt-6 text-center lg:px-0">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-primary">Nossa sugestão</p>
        <span className="flex size-24 items-center justify-center rounded-[28px] border-2 border-primary/30 bg-primary/10">
          <LanguageIcon id={fase.slug} name={linguagem?.name} className="size-12" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-foreground">Comece com {linguagem?.name}</h1>
          {porque && <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">{porque}</p>}
        </div>
        <BotaoRelevo className="w-full max-w-sm" faceClassName="py-4" onClick={() => onSelect(fase.slug)}>
          Começar com {linguagem?.name}
        </BotaoRelevo>
        <button
          type="button"
          onClick={() => mudar({ tipo: "lista" })}
          className="text-sm font-bold text-muted-foreground hover:text-primary"
        >
          Prefiro escolher outra
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-in-right flex flex-col gap-6 px-4 pb-8 pt-2 lg:px-0">
      <h1 className="text-2xl font-extrabold leading-tight text-foreground lg:text-3xl">
        Qual linguagem você quer aprender?
      </h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {languages.map((lang, index) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onSelect(lang.id)}
            className={cn(
              "group animate-fade-in-up flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-6",
              "transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
              "active:scale-[0.98]"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary/10">
              <LanguageIcon id={lang.id} name={lang.name} className="size-6" />
            </span>
            <span className="text-sm font-semibold text-card-foreground">{lang.name}</span>
          </button>
        ))}
      </div>

      {interesse && (
        <button
          type="button"
          onClick={() => mudar({ tipo: "gosto" })}
          className="animate-fade-in-up flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-4 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          style={{ animationDelay: `${languages.length * 50}ms` }}
        >
          <HelpCircle className="size-4.5" />
          Não sei qual escolher
        </button>
      )}
    </div>
  );
}
