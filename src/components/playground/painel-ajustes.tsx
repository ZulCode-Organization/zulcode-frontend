"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AJUSTES_PADRAO, FONTE_MAX, FONTE_MIN, type Ajustes } from "@/lib/playground/ajustes";
import { Dialogo } from "./dialogo";

/** Preferências do editor. Cada chave vem com uma frase do que ela faz — a
 *  diferença entre "Emmet" e "fechar pares" não é óbvia para quem está
 *  aprendendo, e um rótulo seco obrigaria a testar para descobrir. */

function Interruptor({
  titulo, descricao, ligado, aoMudar,
}: {
  titulo: string;
  descricao: string;
  ligado: boolean;
  aoMudar: (valor: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => aoMudar(!ligado)}
      className="zc-pg-borda flex w-full items-start gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:[background:var(--pg-ativo)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.78rem] font-bold">{titulo}</span>
        <span className="zc-pg-apagado mt-0.5 block text-[0.7rem] leading-4">{descricao}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
          ligado ? "[background:var(--pg-acento)]" : "[background:var(--pg-borda)]",
        )}
      >
        <span
          className={cn(
            "size-3 rounded-full bg-white transition-transform",
            ligado && "translate-x-3",
          )}
        />
      </span>
    </button>
  );
}

function Numero({
  titulo, descricao, valor, min, max, sufixo, aoMudar,
}: {
  titulo: string;
  descricao: string;
  valor: number;
  min: number;
  max: number;
  sufixo?: string;
  aoMudar: (valor: number) => void;
}) {
  return (
    <div className="zc-pg-borda flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.78rem] font-bold">{titulo}</span>
        <span className="zc-pg-apagado mt-0.5 block text-[0.7rem] leading-4">{descricao}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => aoMudar(valor - 1)}
          disabled={valor <= min}
          aria-label={`Diminuir ${titulo}`}
          className="zc-pg-botao zc-pg-borda size-6 border"
        >
          <Minus className="size-3" />
        </button>
        <span className="zc-pg-mono w-12 text-center text-[0.75rem]">
          {valor}{sufixo}
        </span>
        <button
          type="button"
          onClick={() => aoMudar(valor + 1)}
          disabled={valor >= max}
          aria-label={`Aumentar ${titulo}`}
          className="zc-pg-botao zc-pg-borda size-6 border"
        >
          <Plus className="size-3" />
        </button>
      </span>
    </div>
  );
}

export function PainelAjustes({
  ajustes, aoMudar, aoFechar,
}: {
  ajustes: Ajustes;
  aoMudar: (partes: Partial<Ajustes>) => void;
  aoFechar: () => void;
}) {
  return (
    <Dialogo titulo="Ajustes do editor" aoFechar={aoFechar}>
      <Numero
        titulo="Tamanho da letra"
        descricao="Vale a pena aumentar no celular."
        valor={ajustes.fonte}
        min={FONTE_MIN}
        max={FONTE_MAX}
        sufixo="px"
        aoMudar={(fonte) => aoMudar({ fonte })}
      />
      <Numero
        titulo="Tabulação"
        descricao="Quantos espaços o Tab escreve."
        valor={ajustes.tabulacao}
        min={2}
        max={8}
        aoMudar={(tabulacao) => aoMudar({ tabulacao })}
      />
      <Interruptor
        titulo="Quebrar linha"
        descricao="Linha comprida continua embaixo em vez de precisar rolar de lado."
        ligado={ajustes.quebrarLinha}
        aoMudar={(quebrarLinha) => aoMudar({ quebrarLinha })}
      />
      <Interruptor
        titulo="Números de linha"
        descricao="A coluna de números na margem esquerda."
        ligado={ajustes.numerosDeLinha}
        aoMudar={(numerosDeLinha) => aoMudar({ numerosDeLinha })}
      />
      <Interruptor
        titulo="Fechar parênteses e aspas"
        descricao={'Ao abrir um ( ou um ", o par aparece fechado com o cursor no meio.'}
        ligado={ajustes.fecharPares}
        aoMudar={(fecharPares) => aoMudar({ fecharPares })}
      />
      <Interruptor
        titulo="Abreviações do Emmet"
        descricao="Em HTML e CSS: digite ! e aperte Tab para o esqueleto da página; div.cartao vira a tag com a classe; ul>li*3 vira a lista com três itens."
        ligado={ajustes.emmet}
        aoMudar={(emmet) => aoMudar({ emmet })}
      />
      <Interruptor
        titulo="Rodar sozinho"
        descricao="Atualiza o preview pouco depois de você parar de digitar. Desligue se o código estiver no meio e atrapalhar."
        ligado={ajustes.rodarSozinho}
        aoMudar={(rodarSozinho) => aoMudar({ rodarSozinho })}
      />
      <Interruptor
        titulo="Barra de símbolos no celular"
        descricao="A fileira com < > { } ; acima do teclado, para não abrir o teclado de símbolos toda hora."
        ligado={ajustes.barraDeTeclas}
        aoMudar={(barraDeTeclas) => aoMudar({ barraDeTeclas })}
      />

      <div className="p-3">
        <button
          type="button"
          onClick={() => aoMudar({ ...AJUSTES_PADRAO, tema: ajustes.tema })}
          className="zc-pg-botao zc-pg-borda h-8 w-full border text-[0.75rem]"
        >
          Voltar aos ajustes padrão
        </button>
      </div>
    </Dialogo>
  );
}
