"use client";

import type { Modo } from "@/lib/playground/tipos";
import { ZulDaAula, type PoseDoZul } from "@/components/atividade/zul-da-aula";
import { Dialogo } from "./dialogo";

const OPCOES: { modo: Modo; titulo: string; descricao: string; pose: PoseDoZul; cor: string }[] = [
  { modo: "web", titulo: "Página", descricao: "HTML, CSS e JavaScript, com a página aparecendo ao lado.", pose: "oculos", cor: "#e8743b" },
  { modo: "js", titulo: "JavaScript", descricao: "Só o código e o console, para treinar lógica.", pose: "escrevendo", cor: "#e0b336" },
  { modo: "python", titulo: "Python", descricao: "Roda no seu aparelho, sem precisar de internet depois da primeira vez.", pose: "lagarta", cor: "#3776ab" },
];

/** Começar um projeto do zero: página, JavaScript ou Python, cada um com o seu Zul. */
export function DialogoNovo({ aoEscolher, aoFechar }: { aoEscolher: (modo: Modo) => void; aoFechar: () => void }) {
  return (
    <Dialogo titulo="Novo projeto" descricao="O que você quer criar?" aoFechar={aoFechar} largura="media">
      <div className="grid gap-2.5">
        {OPCOES.map(({ modo, titulo, descricao, pose, cor }) => (
          <button
            key={modo}
            type="button"
            onClick={() => aoEscolher(modo)}
            className="zc-pg-borda flex items-center gap-3 rounded-2xl border-2 p-3 text-left shadow-[0_4px_0_var(--pg-borda)] transition-transform active:translate-y-1 active:shadow-none"
          >
            <ZulDaAula pose={pose} className="size-16" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] font-black" style={{ color: cor }}>{titulo}</span>
              <span className="mt-0.5 block text-[0.78rem] font-semibold leading-snug [color:var(--pg-apagado)]">{descricao}</span>
            </span>
          </button>
        ))}
      </div>
    </Dialogo>
  );
}
