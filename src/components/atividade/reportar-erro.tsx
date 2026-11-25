"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Flag, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import "./aula.css";

export type MotivoDoErro = "gabarito" | "confusa" | "digitacao" | "outro";
export type ResultadoDoRelato = { ok: true } | { ok: false; mensagem: string };

const MOTIVOS: { valor: MotivoDoErro; texto: string; dica: string }[] = [
  { valor: "gabarito", texto: "A resposta certa está errada", dica: "A minha resposta também deveria valer." },
  { valor: "confusa", texto: "A pergunta está confusa", dica: "Não dá para entender o que ela pede." },
  { valor: "digitacao", texto: "Tem um erro de digitação", dica: "Uma palavra ou um código escrito errado." },
  { valor: "outro", texto: "Outro problema", dica: "Conte nos detalhes abaixo." },
];

/**
 * O "Reportar" da faixa de resposta: abre uma folha com o motivo e um
 * comentário opcional. Vai para a fila de "Erros nas questões" do
 * administrativo, e quem avisou recebe um obrigado quando a questão é corrigida.
 */
export function BotaoReportarErro({ aoReportar }: { aoReportar: (motivo: MotivoDoErro, comentario: string) => Promise<ResultadoDoRelato> }) {
  const [aberto, setAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <span className="zc-aula-faixa-porque inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[0.78rem] font-black">
        <Check className="size-3.5" strokeWidth={3} /> Reportado
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="zc-aula-faixa-porque inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[0.78rem] font-black opacity-80 transition-opacity hover:opacity-100"
      >
        <Flag className="size-3.5" strokeWidth={2.5} /> Reportar
      </button>
      {/* Direto no body: dentro da faixa (fixa e animada) a folha ficaria
          presa às camadas dela em vez de cobrir a tela toda. */}
      {aberto &&
        createPortal(
          <FolhaDoRelato
            aoFechar={() => setAberto(false)}
            aoEnviar={async (motivo, comentario) => {
              const r = await aoReportar(motivo, comentario);
              if (r.ok) {
                setEnviado(true);
                setAberto(false);
              }
              return r;
            }}
          />,
          document.body,
        )}
    </>
  );
}

function FolhaDoRelato({ aoFechar, aoEnviar }: { aoFechar: () => void; aoEnviar: (motivo: MotivoDoErro, comentario: string) => Promise<ResultadoDoRelato> }) {
  const [motivo, setMotivo] = useState<MotivoDoErro | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const painelRef = useRef<HTMLDivElement>(null);
  // Pela ref: a aula pode redesenhar com a folha aberta (a pena gasta chega
  // depois), e o efeito não pode rodar de novo e tirar o foco do comentário.
  const fecharRef = useRef(aoFechar);
  useEffect(() => {
    fecharRef.current = aoFechar;
  });

  // Esc fecha; o foco entra na folha para o teclado e o leitor de tela.
  useEffect(() => {
    painelRef.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharRef.current();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const precisaDeComentario = motivo === "outro" && !comentario.trim();

  const enviar = async () => {
    if (!motivo || precisaDeComentario) return;
    setEnviando(true);
    setErro("");
    const r = await aoEnviar(motivo, comentario.trim());
    setEnviando(false);
    if (r.ok === false) setErro(r.mensagem);
  };

  return (
    // zc-aula: as cores e as molas da aula, que fora da faixa não chegariam por herança.
    <div className="zc-aula fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onClick={aoFechar}>
      <div
        ref={painelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="relato-titulo"
        onClick={(e) => e.stopPropagation()}
        className="zc-aula-entra w-full max-w-md rounded-t-[28px] bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 text-foreground shadow-2xl outline-none sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="relato-titulo" className="text-xl font-black">O que tem de errado?</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">A equipe confere e corrige a questão. Obrigado por avisar!</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div role="radiogroup" aria-label="Motivo" className="mt-4 space-y-2">
          {MOTIVOS.map((m) => (
            <button
              key={m.valor}
              type="button"
              role="radio"
              aria-checked={motivo === m.valor}
              onClick={() => setMotivo(m.valor)}
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                motivo === m.valor ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60",
              )}
            >
              <span className="block text-[0.95rem] font-black">{m.texto}</span>
              <span className="block text-xs font-semibold text-muted-foreground">{m.dica}</span>
            </button>
          ))}
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{motivo === "outro" ? "Conte o que aconteceu" : "Quer contar mais? (opcional)"}</span>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ex.: a linha 3 também imprime 10, então a B também está certa."
            className="w-full resize-none rounded-2xl border-2 border-border bg-background px-4 py-3 text-[0.95rem] outline-none focus:border-primary"
          />
        </label>

        {erro && <p role="alert" className="mt-2 text-sm font-bold text-destructive">{erro}</p>}

        <button type="button" onClick={() => void enviar()} disabled={!motivo || precisaDeComentario || enviando} className="zc-aula-botao mt-4">
          {enviando && <Loader2 className="size-5 animate-spin" />}
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
