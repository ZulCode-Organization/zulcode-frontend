"use client";

import { useState } from "react";
import { Check, Copy, Globe, Link2Off, Loader2 } from "lucide-react";
import { compartilhar, pararDeCompartilhar } from "@/lib/playground/projetos";
import type { Projeto } from "@/lib/playground/tipos";
import { Dialogo } from "./dialogo";

/** O link público e o remix.
 *
 *  Quem abre o link vê o código e o resultado, e pode levar uma cópia para a
 *  própria conta. O original não muda — é isso que faz compartilhar não dar
 *  medo. */
export function PainelCompartilhar({
  projeto, aoMudarSlug, aoFechar,
}: {
  projeto: Projeto;
  aoMudarSlug: (slug: string | null) => void;
  aoFechar: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const endereco = projeto.slugPublico && typeof window !== "undefined"
    ? `${window.location.origin}/p/${projeto.slugPublico}`
    : null;

  const ligar = async () => {
    if (!projeto.id) return;
    setOcupado(true);
    setErro(null);
    try {
      const { slugPublico } = await compartilhar(projeto.id);
      aoMudarSlug(slugPublico);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não deu para gerar o link.");
    } finally {
      setOcupado(false);
    }
  };

  const desligar = async () => {
    if (!projeto.id) return;
    setOcupado(true);
    setErro(null);
    try {
      await pararDeCompartilhar(projeto.id);
      aoMudarSlug(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não deu para desativar o link.");
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async () => {
    if (!endereco) return;
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setErro("O navegador não deixou copiar. Selecione o endereço à mão.");
    }
  };

  return (
    <Dialogo titulo="Compartilhar" aoFechar={aoFechar} largura="estreita">
      <div className="flex flex-col gap-3 p-3">
        {!projeto.id ? (
          <p className="zc-pg-apagado text-[0.78rem] leading-5">
            Guarde o projeto na sua conta primeiro — Ctrl+K → Salvar projeto. O
            link aponta para o que está guardado, não para o que está na tela.
          </p>
        ) : endereco ? (
          <>
            <p className="zc-pg-apagado text-[0.75rem] leading-4">
              Qualquer pessoa com este link vê o código e o resultado, e pode
              remixar uma cópia. Quem abre não consegue mudar o seu.
            </p>
            <div className="zc-pg-fundo zc-pg-borda flex items-center gap-2 rounded-sm border px-2 py-1.5">
              <Globe className="zc-pg-acento size-3.5 shrink-0" />
              <code className="zc-pg-mono min-w-0 flex-1 truncate text-[0.72rem]">{endereco}</code>
              <button
                type="button"
                onClick={() => void copiar()}
                aria-label="Copiar o link"
                className="zc-pg-botao size-6 shrink-0"
              >
                {copiado ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void desligar()}
              disabled={ocupado}
              className="zc-pg-botao zc-pg-borda h-8 border text-[0.75rem]"
            >
              {ocupado ? <Loader2 className="size-3 animate-spin" /> : <Link2Off className="size-3" />}
              Desativar o link
            </button>
          </>
        ) : (
          <>
            <p className="zc-pg-apagado text-[0.78rem] leading-5">
              Gera um endereço público para este projeto. Dá para desativar
              depois, e o endereço deixa de funcionar na hora.
            </p>
            <button
              type="button"
              onClick={() => void ligar()}
              disabled={ocupado}
              className="flex h-9 items-center justify-center gap-2 rounded-sm text-[0.78rem] font-bold text-white disabled:opacity-60"
              style={{ background: "var(--pg-acento)" }}
            >
              {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
              Gerar link público
            </button>
          </>
        )}
        {erro && <p role="alert" className="zc-pg-erro text-[0.72rem] leading-4">{erro}</p>}
      </div>
    </Dialogo>
  );
}
