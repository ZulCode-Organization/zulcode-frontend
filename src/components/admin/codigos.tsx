"use client";

import { useState } from "react";
import { Copy, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Pagina } from "./shell";
import { Botao, Cabecalho, Entrada, Erro, Esqueleto, Interruptor, Rotulo, Selo, Vazio } from "./ui";
import { Dialogo, perguntar } from "./dialogo";
import { avisar } from "./avisos";
import { EscolhaDeCosmetico } from "./pessoas/presentes";
import { doCampoDeData, paraCampoDeData } from "./eventos";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { dataHora, numero } from "@/lib/admin/formato";
import type { CodigoPromocional } from "@/lib/admin/tipos";

const CHAVE = "/admin/codigos";

function situacao(c: CodigoPromocional) {
  if (!c.ativo) return { texto: "Desligado", tom: "neutro" as const };
  if (c.validoAte && Date.parse(c.validoAte) < Date.now()) return { texto: "Expirado", tom: "neutro" as const };
  if (c.limiteDeUsos !== null && c.usos >= c.limiteDeUsos) return { texto: "Esgotado", tom: "ambar" as const };
  return { texto: "Valendo", tom: "verde" as const };
}

/**
 * Códigos promocionais (ZULINSTA...): quem digita na loja do app ganha rupees,
 * dias de PRO e/ou um cosmético. Cada pessoa usa cada código uma vez.
 */
export function AdminCodigos() {
  const { dados, erro, carregando, recarregar } = useDados<CodigoPromocional[]>(CHAVE);
  const [editando, setEditando] = useState<CodigoPromocional | "novo" | null>(null);

  const apagar = async (c: CodigoPromocional) => {
    if (!(await perguntar({ titulo: `Apagar o código ${c.codigo}?`, texto: "Quem já usou fica com o que ganhou. Ninguém mais consegue usar.", sim: "Apagar", perigoso: true }))) return;
    try {
      await pedir(`${CHAVE}/${c.id}`, { method: "DELETE" });
      invalidar(CHAVE);
      avisar("Código apagado.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível apagar.", { tom: "erro" });
    }
  };

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Códigos promocionais"
        descricao="Para divulgar no Instagram, em lives ou para recompensar quem ajudou. A pessoa digita o código na loja do app."
        acoes={<Botao variante="primario" icone={<Plus className="size-4" />} onClick={() => setEditando("novo")}>Novo código</Botao>}
      />
      {erro && !dados && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!dados && carregando && <Esqueleto linhas={5} />}
      {dados && dados.length === 0 && (
        <Vazio titulo="Nenhum código ainda" icone={<Ticket className="size-5" />} acao={<Botao onClick={() => setEditando("novo")}>Criar o primeiro</Botao>}>
          Ex.: ZULINSTA, que dá 100 rupees para os primeiros 200 que usarem.
        </Vazio>
      )}
      {dados && dados.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">Código</th>
                  <th className="px-3 py-2.5 text-left font-bold">Dá</th>
                  <th className="px-3 py-2.5 text-right font-bold">Usos</th>
                  <th className="px-3 py-2.5 text-left font-bold">Validade</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {dados.map((c) => {
                  const s = situacao(c);
                  const da = [c.rupees ? `${numero(c.rupees)} rupees` : "", c.diasPro ? `${c.diasPro} dias de PRO` : "", c.cosmeticoId ? "cosmético" : ""].filter(Boolean).join(" + ");
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-black">{c.codigo}</code>
                          <button type="button" aria-label={`Copiar ${c.codigo}`} title="Copiar" className="text-muted-foreground hover:text-foreground" onClick={() => { void navigator.clipboard?.writeText(c.codigo); avisar("Copiado."); }}>
                            <Copy className="size-3.5" />
                          </button>
                          <Selo tom={s.tom}>{s.texto}</Selo>
                        </div>
                        {c.descricao && <p className="mt-0.5 text-xs text-muted-foreground">{c.descricao}</p>}
                      </td>
                      <td className="px-3 py-2.5">{da}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{numero(c.usos)}{c.limiteDeUsos !== null ? ` / ${numero(c.limiteDeUsos)}` : ""}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{c.validoAte ? `até ${dataHora(c.validoAte)}` : "Sem prazo"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <Botao tamanho="sm" variante="fantasma" icone={<Pencil className="size-4" />} aria-label={`Editar ${c.codigo}`} onClick={() => setEditando(c)} />
                        <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-4" />} aria-label={`Apagar ${c.codigo}`} onClick={() => void apagar(c)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editando && <FormularioDoCodigo codigo={editando === "novo" ? null : editando} aoFechar={() => setEditando(null)} />}
    </Pagina>
  );
}

function FormularioDoCodigo({ codigo, aoFechar }: { codigo: CodigoPromocional | null; aoFechar: () => void }) {
  const [f, setF] = useState({
    codigo: codigo?.codigo ?? "",
    descricao: codigo?.descricao ?? "",
    rupees: String(codigo?.rupees ?? 50),
    diasPro: String(codigo?.diasPro ?? 0),
    cosmeticoId: codigo?.cosmeticoId ?? "",
    limiteDeUsos: codigo?.limiteDeUsos ? String(codigo.limiteDeUsos) : "",
    validoAte: paraCampoDeData(codigo?.validoAte),
    ativo: codigo?.ativo ?? true,
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const mudar = (parte: Partial<typeof f>) => setF((x) => ({ ...x, ...parte }));
  const n = (v: string) => Math.trunc(Number(v) || 0);

  const salvar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const corpo = {
        codigo: f.codigo, descricao: f.descricao, rupees: n(f.rupees), diasPro: n(f.diasPro), cosmeticoId: f.cosmeticoId || null,
        limiteDeUsos: f.limiteDeUsos ? Math.max(1, n(f.limiteDeUsos)) : null, validoAte: doCampoDeData(f.validoAte), ativo: f.ativo,
      };
      await pedir(codigo ? `${CHAVE}/${codigo.id}` : CHAVE, { method: codigo ? "PATCH" : "POST", json: corpo });
      invalidar(CHAVE);
      avisar(codigo ? "Código salvo." : "Código criado.");
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={codigo ? `Editar ${codigo.codigo}` : "Novo código"}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={enviando} disabled={f.codigo.trim().length < 3} onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <Rotulo texto="Código" dica="Letras, números e hífen. Maiúsculas e minúsculas tanto faz.">
          <Entrada value={f.codigo} onChange={(e) => mudar({ codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })} maxLength={40} placeholder="ZULINSTA" className="font-mono font-black" />
        </Rotulo>
        <Rotulo texto="Descrição (só para a equipe)"><Entrada value={f.descricao} onChange={(e) => mudar({ descricao: e.target.value })} maxLength={200} placeholder="Ex.: post do Instagram de 25/11" /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Rupees"><Entrada inputMode="numeric" value={f.rupees} onChange={(e) => mudar({ rupees: e.target.value.replace(/\D/g, "") })} /></Rotulo>
          <Rotulo texto="Dias de PRO" dica="Quem já paga o PRO fica sem esta parte."><Entrada inputMode="numeric" value={f.diasPro} onChange={(e) => mudar({ diasPro: e.target.value.replace(/\D/g, "") })} /></Rotulo>
        </div>
        <EscolhaDeCosmetico valor={f.cosmeticoId} aoMudar={(cosmeticoId) => mudar({ cosmeticoId })} opcional />
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Limite de usos" dica="Vazio = sem limite."><Entrada inputMode="numeric" value={f.limiteDeUsos} onChange={(e) => mudar({ limiteDeUsos: e.target.value.replace(/\D/g, "") })} placeholder="Sem limite" /></Rotulo>
          <Rotulo texto="Vale até" dica="Vazio = sem prazo."><Entrada type="datetime-local" value={f.validoAte} onChange={(e) => mudar({ validoAte: e.target.value })} /></Rotulo>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <p className="text-sm font-black">Código ligado</p>
          <Interruptor ligado={f.ativo} aoMudar={(ativo) => mudar({ ativo })} rotulo="Código ligado" />
        </div>
        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
