"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { FORMULARIO_DE_RETORNO } from "@/components/app-shell/nav-items";
import { Grupo, Linha } from "./linhas";
import { TelaDeConfig } from "./tela";

/** As perguntas da Central de ajuda, numeradas no arquivo de traduções (ele não aceita listas). */
const PERGUNTAS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

/** As dúvidas mais comuns, cada uma abrindo a resposta no lugar. */
export function AjudaContent() {
  const t = useTranslations("configuracoes.ajuda");
  const perguntas = PERGUNTAS.map((n) => ({ pergunta: t(`perguntas.${n}.pergunta`), resposta: t(`perguntas.${n}.resposta`) }));

  return (
    <TelaDeConfig titulo={t("titulo")} voltar>
      <Grupo>
        {perguntas.map(({ pergunta, resposta }) => (
          <details key={pergunta} className="group border-b-2 border-border last:border-0">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-[1rem] font-extrabold [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{pergunta}</span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-open:rotate-180" strokeWidth={2.6} />
            </summary>
            <p className="px-4 pb-4 text-[0.9rem] font-semibold leading-relaxed text-muted-foreground">{resposta}</p>
          </details>
        ))}
      </Grupo>

      <Grupo titulo={t("maisAjuda")}>
        <Linha titulo={t("escrever")} href={FORMULARIO_DE_RETORNO} externo />
      </Grupo>
    </TelaDeConfig>
  );
}
