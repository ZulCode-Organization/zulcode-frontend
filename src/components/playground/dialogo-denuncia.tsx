"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { denunciar, MOTIVOS_DE_DENUNCIA, type MotivoDaDenuncia } from "@/lib/playground/projetos";
import { Dialogo } from "./dialogo";

/** Denunciar um projeto aberto pelo link público. A equipe vê no admin e
 *  decide se o link sai do ar; quem denunciou não fica sabendo do resultado. */
export function DialogoDenuncia({ slug, aoFechar }: { slug: string; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState<MotivoDaDenuncia | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState("");

  if (enviada) {
    return (
      <Dialogo titulo="Denúncia enviada" aoFechar={aoFechar} largura="estreita">
        <div className="flex flex-col gap-3 p-3">
          <p className="text-[0.8rem] leading-5">
            Obrigado. A equipe do ZulCode vai olhar este projeto e, se ele quebrar as regras, o link sai do ar.
          </p>
          <div className="flex justify-end">
            <button type="button" onClick={aoFechar} className="zc-pg-botao zc-pg-borda h-8 border px-3 text-[0.75rem]">
              Fechar
            </button>
          </div>
        </div>
      </Dialogo>
    );
  }

  return (
    <Dialogo titulo="Denunciar projeto" descricao="O que tem de errado neste projeto?" aoFechar={aoFechar} largura="estreita">
      <form
        className="flex flex-col gap-3 p-3"
        onSubmit={async (evento) => {
          evento.preventDefault();
          if (!motivo || enviando) return;
          setEnviando(true);
          setErro("");
          try {
            await denunciar(slug, motivo, detalhe);
            setEnviada(true);
          } catch (falha) {
            setErro(falha instanceof Error ? falha.message : "Não deu para enviar a denúncia.");
          } finally {
            setEnviando(false);
          }
        }}
      >
        <div role="radiogroup" aria-label="Motivo" className="flex flex-col gap-1.5">
          {MOTIVOS_DE_DENUNCIA.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={motivo === valor}
              onClick={() => setMotivo(valor)}
              className={cn(
                "zc-pg-borda h-9 rounded-sm border px-2.5 text-left text-[0.78rem]",
                motivo === valor ? "font-bold" : "zc-pg-apagado hover:[background:var(--pg-ativo)]",
              )}
              style={motivo === valor ? { borderColor: "var(--pg-acento)", color: "var(--pg-acento)" } : undefined}
            >
              {texto}
            </button>
          ))}
        </div>
        <textarea
          value={detalhe}
          onChange={(evento) => setDetalhe(evento.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Quer contar mais? (opcional)"
          aria-label="Detalhes da denúncia"
          className="zc-pg-fundo zc-pg-borda zc-pg-texto resize-none rounded-sm border p-2 text-[0.78rem] outline-none"
        />
        {erro && <p role="alert" className="zc-pg-erro text-[0.72rem]">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="zc-pg-botao zc-pg-borda h-8 border px-3 text-[0.75rem]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!motivo || enviando}
            className="flex h-8 items-center gap-1.5 rounded-sm px-3 text-[0.75rem] font-bold text-white disabled:opacity-50"
            style={{ background: "var(--pg-erro)" }}
          >
            {enviando && <Loader2 className="size-3.5 animate-spin" />}
            Enviar denúncia
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
