"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ExternalLink, MessageSquareWarning, X } from "lucide-react";
import { Pagina } from "./shell";
import { AvatarPequeno, Botao, Cabecalho, Entrada, Erro, Esqueleto, Interruptor, Rotulo, Segmentado, Selo, Vazio } from "./ui";
import { Dialogo } from "./dialogo";
import { avisar } from "./avisos";
import { invalidar, pedir, query, useDados } from "@/lib/admin/api";
import { relativo } from "@/lib/admin/formato";
import type { ErroAgrupado, MotivoDeErro } from "@/lib/admin/tipos";

type Status = "aberto" | "resolvido" | "descartado";

export const MOTIVO: Record<MotivoDeErro, string> = {
  gabarito: "A resposta certa está errada",
  confusa: "A pergunta está confusa",
  digitacao: "Erro de digitação",
  outro: "Outro problema",
};

/**
 * Os erros que os alunos apontaram nas questões ("Reportar erro" na aula), uma
 * linha por questão: as mais apontadas primeiro. Daqui abre a aula no editor
 * para corrigir e, depois, marca como resolvido (podendo agradecer quem avisou).
 */
export function AdminErrosNasQuestoes() {
  const [status, setStatus] = useState<Status>("aberto");
  const endereco = `/admin/erros-nas-questoes${query({ status })}`;
  const { dados, erro, carregando, atualizando, recarregar } = useDados<ErroAgrupado[]>(endereco, { velhoDepoisDe: 20_000 });
  const [fechando, setFechando] = useState<ErroAgrupado | null>(null);

  const descartar = async (g: ErroAgrupado) => {
    try {
      await pedir("/admin/erros-nas-questoes/fechar", { method: "POST", json: { exerciseId: g.exerciseId, status: "descartado" } });
      invalidar("/admin/erros-nas-questoes");
      avisar("Descartado.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível descartar.", { tom: "erro" });
    }
  };

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Erros nas questões"
        descricao="O que os alunos apontaram com o botão “Reportar erro” da aula. Corrija no editor e marque como resolvido."
      />
      <div className="mb-4">
        <Segmentado<Status>
          rotulo="Mostrar"
          valor={status}
          aoMudar={setStatus}
          opcoes={[{ valor: "aberto", texto: "Abertos" }, { valor: "resolvido", texto: "Resolvidos" }, { valor: "descartado", texto: "Descartados" }]}
        />
      </div>

      {erro && !dados && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!dados && carregando && <Esqueleto linhas={6} />}
      {dados && dados.length === 0 && (
        <Vazio titulo={status === "aberto" ? "Nenhum erro aberto" : "Nada por aqui"} icone={<MessageSquareWarning className="size-5" />}>
          {status === "aberto" ? "Quando alguém apontar um erro numa questão, ele aparece aqui." : "Ainda não há relatos com esta situação."}
        </Vazio>
      )}

      <div className={atualizando ? "space-y-3 opacity-60 transition-opacity" : "space-y-3 transition-opacity"}>
        {dados?.map((g) => (
          <article key={g.exerciseId} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">{g.curso} › {g.unidade} › {g.aula}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-black">{g.enunciado}</p>
              </div>
              <Selo tom={g.total >= 3 ? "vermelho" : "ambar"}>{g.total} {g.total === 1 ? "pessoa apontou" : "pessoas apontaram"}</Selo>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(g.motivos).map(([m, n]) => (
                <span key={m} className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold">{MOTIVO[m as MotivoDeErro] ?? m} · {n}</span>
              ))}
              {!g.existe && <Selo tom="neutro">A questão já não existe (aula reimportada)</Selo>}
            </div>

            <ul className="mt-3 space-y-2 border-t pt-3">
              {g.relatos.slice(0, 5).map((r) => (
                <li key={r.id} className="flex gap-2.5 text-sm">
                  <AvatarPequeno id={r.pessoa?.avatarId} className="size-6 rounded-md text-[0.6rem]" />
                  <div className="min-w-0">
                    <p>
                      {r.pessoa ? <Link href={`/admin/pessoas/${r.pessoa.id}`} className="font-bold hover:text-primary">{r.pessoa.name}</Link> : <b>Conta apagada</b>}
                      <span className="text-muted-foreground"> · {MOTIVO[r.motivo] ?? r.motivo} · {relativo(r.quando)}</span>
                    </p>
                    {r.comentario && <p className="mt-0.5 text-muted-foreground">“{r.comentario}”</p>}
                    {r.resposta && <p className="mt-0.5 text-xs text-muted-foreground">Respondeu: <code className="rounded bg-muted px-1">{r.resposta}</code></p>}
                  </div>
                </li>
              ))}
              {g.relatos.length > 5 && <li className="text-xs text-muted-foreground">e mais {g.relatos.length - 5}…</li>}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/admin/conteudo/aula/${g.lessonId}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold hover:bg-muted"
              >
                <ExternalLink className="size-4" /> Abrir a aula no editor
              </Link>
              {status === "aberto" && (
                <>
                  <Botao variante="primario" icone={<Check className="size-4" />} onClick={() => setFechando(g)}>Corrigi, marcar resolvido</Botao>
                  <Botao variante="fantasma" icone={<X className="size-4" />} onClick={() => void descartar(g)}>Descartar</Botao>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {fechando && <MarcarResolvido grupo={fechando} aoFechar={() => setFechando(null)} />}
    </Pagina>
  );
}

function MarcarResolvido({ grupo, aoFechar }: { grupo: ErroAgrupado; aoFechar: () => void }) {
  const [agradecer, setAgradecer] = useState(true);
  const [rupees, setRupees] = useState("10");
  const [enviando, setEnviando] = useState(false);
  const pessoas = new Set(grupo.relatos.map((r) => r.pessoa?.id).filter(Boolean)).size;

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await pedir<{ agradecidas: number }>("/admin/erros-nas-questoes/fechar", {
        method: "POST",
        json: { exerciseId: grupo.exerciseId, status: "resolvido", agradecer, rupees: Math.min(100, Math.max(0, Number(rupees) || 0)) },
      });
      invalidar("/admin/erros-nas-questoes");
      avisar(r.agradecidas ? `Resolvido. ${r.agradecidas} ${r.agradecidas === 1 ? "pessoa agradecida" : "pessoas agradecidas"}.` : "Resolvido.");
      aoFechar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível concluir.", { tom: "erro" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Marcar como resolvido"
      descricao="Confirme que a questão já foi corrigida no editor."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={enviando} onClick={enviar}>Marcar resolvido</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-black">Agradecer quem avisou</p>
            <p className="text-xs text-muted-foreground">{pessoas} {pessoas === 1 ? "pessoa recebe" : "pessoas recebem"} uma notificação dizendo que a questão foi corrigida.</p>
          </div>
          <Interruptor ligado={agradecer} aoMudar={setAgradecer} rotulo="Agradecer quem avisou" />
        </div>
        {agradecer && (
          <Rotulo texto="Rupees de agradecimento" dica="Por pessoa, de 0 a 100. Zero manda só a notificação.">
            <Entrada inputMode="numeric" value={rupees} onChange={(e) => setRupees(e.target.value.replace(/\D/g, ""))} />
          </Rotulo>
        )}
      </div>
    </Dialogo>
  );
}
