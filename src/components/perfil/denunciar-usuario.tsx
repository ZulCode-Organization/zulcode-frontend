"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Loader2, X } from "lucide-react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";

const MOTIVOS = [
  { valor: "ofensivo", texto: "Nome ou foto ofensivos" },
  { valor: "assedio", texto: "Assédio, ódio ou ameaça" },
  { valor: "golpe", texto: "Spam ou golpe" },
  { valor: "falso", texto: "Está se passando por outra pessoa" },
  { valor: "outro", texto: "Outro motivo" },
] as const;

type Motivo = (typeof MOTIVOS)[number]["valor"];

/**
 * O fim do perfil de outra pessoa: "Denunciar usuário", como no Duolingo. A
 * denúncia vai para a equipe no admin; quem denunciou não fica sabendo do
 * resultado, e a pessoa denunciada não fica sabendo de quem foi.
 */
export function DenunciarUsuario({ id, nome }: { id: string; nome: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="flex justify-center border-t border-border pt-5">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.82rem] font-black uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Flag className="size-4.5" strokeWidth={2.4} />
          Denunciar usuário
        </button>
      </div>
      {aberto && <JanelaDeDenuncia id={id} nome={nome} aoFechar={() => setAberto(false)} />}
    </>
  );
}

function JanelaDeDenuncia({ id, nome, aoFechar }: { id: string; nome: string; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => evento.key === "Escape" && aoFechar();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const enviar = async () => {
    if (!motivo || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const token = localStorage.getItem("accessToken");
      const resposta = await fetchComTimeout(`${API_BASE_URL}/user/public/${id}/denunciar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo, ...(detalhe.trim() && { detalhe: detalhe.trim() }) }),
      });
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(typeof corpo?.message === "string" ? corpo.message : "Não deu para enviar a denúncia.");
      }
      setEnviada(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para enviar a denúncia.");
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onPointerDown={(evento) => evento.target === evento.currentTarget && aoFechar()}
    >
      <div role="dialog" aria-modal aria-label="Denunciar usuário" className="w-full max-w-md rounded-t-[24px] border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-[24px]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">{enviada ? "Denúncia enviada" : `Denunciar ${nome}`}</h2>
            {!enviada && <p className="mt-0.5 text-sm text-muted-foreground">O que tem de errado com essa conta?</p>}
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {enviada ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Obrigado. A equipe do ZulCode vai olhar essa conta. {nome} não fica sabendo que foi você.
            </p>
            <button type="button" onClick={aoFechar} className="zc-press mt-5 w-full rounded-2xl bg-muted py-3 text-sm font-black uppercase tracking-[0.06em] text-foreground">
              Fechar
            </button>
          </>
        ) : (
          <>
            <div role="radiogroup" aria-label="Motivo" className="flex flex-col gap-2">
              {MOTIVOS.map(({ valor, texto }) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={motivo === valor}
                  onClick={() => setMotivo(valor)}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-3 text-left text-sm font-black transition-colors",
                    motivo === valor ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"
                  )}
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
              className="mt-3 w-full resize-none rounded-2xl border-2 border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
            {erro && <p role="alert" className="mt-2 text-sm font-bold text-rose-500">{erro}</p>}
            <button
              type="button"
              disabled={!motivo || enviando}
              onClick={() => void enviar()}
              className="zc-press zc-press-shadow mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm font-black uppercase tracking-[0.06em] text-white disabled:opacity-50"
              style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.3)" }}
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              Enviar denúncia
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
