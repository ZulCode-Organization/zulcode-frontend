"use client";

import { useSyncExternalStore } from "react";
import { CircleAlert, Cloud, CloudOff, Loader2, Palette } from "lucide-react";
import {
  assinarEstadoEditor, lerEstadoEditor, lerEstadoEditorNoServidor,
} from "@/lib/playground/estado-editor";
import { paleta } from "@/lib/playground/temas";
import type { Ajustes } from "@/lib/playground/ajustes";
import type { Linguagem, Modo } from "@/lib/playground/tipos";

/** A barra de status de um editor: tudo o que a pessoa precisa saber sem ter de
 *  abrir nada. Cada pedaço é clicável e leva ao lugar que o muda — é o atalho
 *  que se descobre sozinho, sem precisar decorar a paleta de comandos. */

export type EstadoDoSalvamento =
  | { tipo: "local" }
  | { tipo: "salvando" }
  | { tipo: "salvo"; quando: number }
  | { tipo: "erro"; mensagem: string };

const NOME_DA_LINGUAGEM: Record<Linguagem, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
};

function Item({
  children, aoClicar, titulo, destaque,
}: {
  children: React.ReactNode;
  aoClicar?: () => void;
  titulo?: string;
  destaque?: boolean;
}) {
  const conteudo = (
    <span className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1">{children}</span>
  );
  if (!aoClicar) return <span className="zc-pg-apagado" title={titulo}>{conteudo}</span>;
  return (
    <button
      type="button"
      onClick={aoClicar}
      title={titulo}
      className="zc-pg-botao shrink-0"
      style={destaque ? { color: "var(--pg-erro)" } : undefined}
    >
      {conteudo}
    </button>
  );
}

export function BarraStatus({
  linguagem, modo, ajustes, salvamento, temConta,
  aoAbrirAjustes, aoAbrirTemas, aoIrParaErro, aoAlternarModo,
}: {
  linguagem: Linguagem;
  modo: Modo;
  ajustes: Ajustes;
  salvamento: EstadoDoSalvamento;
  temConta: boolean;
  aoAbrirAjustes: () => void;
  aoAbrirTemas: () => void;
  aoIrParaErro: () => void;
  aoAlternarModo: () => void;
}) {
  const { linha, coluna, erros } = useSyncExternalStore(
    assinarEstadoEditor, lerEstadoEditor, lerEstadoEditorNoServidor,
  );

  return (
    <div
      className="zc-pg-barra zc-pg-borda zc-barra-teclas flex h-7 shrink-0 items-stretch gap-0.5 overflow-x-auto border-t text-[0.7rem]"
    >
      <Item
        aoClicar={aoAlternarModo}
        titulo={modo === "web" ? "Modo página: HTML, CSS e JavaScript" : "Modo JavaScript: só o console"}
      >
        <span className="zc-pg-acento font-bold">{modo === "web" ? "PÁGINA" : "JS"}</span>
      </Item>

      <Item titulo="Linguagem do arquivo aberto">{NOME_DA_LINGUAGEM[linguagem]}</Item>

      <Item titulo="Linha e coluna do cursor">
        <span className="zc-pg-mono">{linha}:{coluna}</span>
      </Item>

      <Item aoClicar={aoAbrirAjustes} titulo="Tamanho da tabulação">
        {ajustes.tabulacao} espaços
      </Item>

      <Item aoClicar={aoAbrirTemas} titulo="Trocar o tema do código">
        <Palette className="size-3" />
        {paleta(ajustes.tema).nome}
      </Item>

      <div className="flex-1" />

      {erros > 0 ? (
        <Item aoClicar={aoIrParaErro} destaque titulo="Ir para o primeiro erro">
          <CircleAlert className="size-3" />
          {erros} {erros === 1 ? "erro" : "erros"}
        </Item>
      ) : (
        <Item titulo="Nenhum erro de escrita neste arquivo">sem erros</Item>
      )}

      <Item titulo={rotuloDoSalvamento(salvamento, temConta)}>
        {salvamento.tipo === "salvando" ? <Loader2 className="size-3 animate-spin" />
          : salvamento.tipo === "salvo" ? <Cloud className="size-3" />
            : <CloudOff className="size-3" />}
        <span className={salvamento.tipo === "erro" ? "zc-pg-erro" : undefined}>
          {textoDoSalvamento(salvamento, temConta)}
        </span>
      </Item>
    </div>
  );
}

function textoDoSalvamento(estado: EstadoDoSalvamento, temConta: boolean) {
  if (estado.tipo === "salvando") return "salvando";
  if (estado.tipo === "salvo") return "salvo";
  if (estado.tipo === "erro") return "não salvou";
  return temConta ? "só neste aparelho" : "não salvo";
}

function rotuloDoSalvamento(estado: EstadoDoSalvamento, temConta: boolean) {
  if (estado.tipo === "erro") return estado.mensagem;
  if (estado.tipo === "salvo") {
    return `Guardado na sua conta às ${new Date(estado.quando).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit",
    })}`;
  }
  if (estado.tipo === "salvando") return "Guardando na sua conta…";
  return temConta
    ? "O rascunho fica neste aparelho. Guarde na conta pelo Ctrl+K → Salvar projeto."
    : "Entre na sua conta para guardar o projeto.";
}
