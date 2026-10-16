import { BookOpen, Bug, ClipboardCheck, Code2, FileCode2, Flag, Target, Timer, Trophy } from "lucide-react";
import { Atividade, TipoDeAula } from "@/data/atividades";
import { PoseDoZul, ZulDaAula } from "./zul-da-aula";

/** Como cada tipo de aula se apresenta: o Zul faz o papel do tipo, em vez de um selo. */
export const CAPA_DO_TIPO: Record<TipoDeAula, { nome: string; pose: PoseDoZul; cor: string; fala: string; item: (n: number) => string }> = {
  conceito: { nome: "Aula de conceito", pose: "lendo", cor: "#1892ff", fala: "Primeiro o conceito, com exemplo que roda. Depois, você pratica.", item: (n) => `${n} ${n === 1 ? "pergunta" : "perguntas"}` },
  codigo: { nome: "Aula de código", pose: "escrevendo", cor: "#22c55e", fala: "Você escreve, os testes conferem. Sem decorar: fazendo.", item: (n) => `${n} ${n === 1 ? "desafio" : "desafios"}` },
  depuracao: { nome: "Aula de depuração", pose: "lagarta", cor: "#ff9600", fala: "Tem um bug escondido em cada código. Toque na linha certa.", item: (n) => `${n} ${n === 1 ? "bug" : "bugs"}` },
  prova: { nome: "Aula de prova", pose: "oculos", cor: "#ff4b4b", fala: "Sem resposta na hora, como numa prova de verdade. No fim, o gabarito comentado.", item: (n) => `${n} ${n === 1 ? "questão" : "questões"}` },
  projeto: { nome: "Projeto guiado", pose: "forte", cor: "#ce82ff", fala: "Um programa de verdade, passo a passo. No fim, ele funciona e é seu.", item: (n) => `${n} ${n === 1 ? "passo" : "passos"}` },
  "prova-da-unidade": { nome: "Prova da unidade", pose: "equilibrio", cor: "#ffc800", fala: "Tudo da unidade numa prova só. Com 70% você libera a próxima.", item: (n) => `${n} ${n === 1 ? "questão" : "questões"}` },
};

const ICONE_DO_TIPO: Record<TipoDeAula, typeof Code2> = {
  conceito: BookOpen,
  codigo: Code2,
  depuracao: Bug,
  prova: ClipboardCheck,
  projeto: FileCode2,
  "prova-da-unidade": Trophy,
};

/** A primeira tela da aula do formato novo. */
export function AberturaDaAula({ atividade }: { atividade: Atividade & { tipoDeAula: TipoDeAula } }) {
  const tipo = CAPA_DO_TIPO[atividade.tipoDeAula];
  const Icone = ICONE_DO_TIPO[atividade.tipoDeAula];

  if (atividade.tipoDeAula === "conceito") {
    return (
      <div className="zc-aula-entra flex flex-col gap-4">
        <span className="flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-[0.08em]" style={{ color: tipo.cor }}>
          <Icone className="size-4" strokeWidth={2.6} />
          {tipo.nome}
          {atividade.minutos ? ` · ${atividade.minutos} min` : ""}
        </span>
        <h1 className="text-[1.7rem] font-black leading-tight text-foreground">{atividade.titulo}</h1>
        <div className="flex items-end gap-3">
          <ZulDaAula pose={tipo.pose} className="size-28" />
          <div className="zc-aula-balao mb-6 text-[0.95rem] text-foreground">{tipo.fala}</div>
        </div>
        {!!atividade.metas?.length && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.08em] text-muted-foreground">Ao final desta aula você consegue</p>
            {atividade.metas.map((meta) => (
              <p key={meta} className="flex items-start gap-2.5 text-[0.95rem] font-bold leading-snug text-foreground">
                <Target className="mt-0.5 size-[18px] shrink-0 text-[#22c55e]" strokeWidth={2.6} />
                {meta}
              </p>
            ))}
          </div>
        )}
        {atividade.fonte && <p className="text-[0.75rem] font-bold text-muted-foreground">Baseada em: {atividade.fonte}</p>}
      </div>
    );
  }

  const quantos = atividade.perguntas.length;
  return (
    <div className="zc-aula-entra flex flex-col items-center gap-4 text-center">
      <ZulDaAula pose={tipo.pose} caiu className="size-48" />
      <div>
        <h1 className="text-[1.7rem] font-black leading-tight text-foreground">{atividade.titulo}</h1>
        <p className="mt-1 text-sm font-black" style={{ color: tipo.cor }}>{tipo.nome}</p>
      </div>
      <p className="max-w-sm text-[1rem] font-semibold leading-relaxed text-foreground/80">{tipo.fala}</p>
      <div className="flex gap-4 text-[0.82rem] font-extrabold text-muted-foreground">
        {atividade.minutos ? (
          <span className="flex items-center gap-1.5">
            <Timer className="size-4 text-amber-500" strokeWidth={2.6} />
            {atividade.minutos} min
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          {atividade.tipoDeAula === "prova-da-unidade" ? <Flag className="size-4 text-[#22c55e]" strokeWidth={2.6} /> : <Icone className="size-4" style={{ color: tipo.cor }} strokeWidth={2.6} />}
          {atividade.tipoDeAula === "prova-da-unidade" ? "mínimo 70%" : tipo.item(quantos)}
        </span>
      </div>
    </div>
  );
}
