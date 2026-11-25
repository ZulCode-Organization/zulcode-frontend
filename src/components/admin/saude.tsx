"use client";

import { AlertTriangle, CheckCircle2, Database, Server, Siren, BellRing } from "lucide-react";
import { Pagina } from "./shell";
import { BlocoNumero, Botao, Cabecalho, Cartao, Erro, Esqueleto } from "./ui";
import { useDados } from "@/lib/admin/api";
import { dataHora, numero, relativo } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { SaudeDoSistema } from "@/lib/admin/tipos";

function tamanho(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * A saúde do sistema: o espaço do banco (o limite que derrubou o Neon), quanto
 * ele demora para responder, os erros do servidor, as notificações que
 * falharam e a versão no ar. No topo, o que pede atenção.
 */
export function AdminSaude() {
  const { dados: s, erro, atualizando, recarregar } = useDados<SaudeDoSistema>("/admin/saude", { velhoDepoisDe: 15_000 });

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Saúde do sistema"
        descricao={s ? `Conferido ${relativo(s.verificadoEm)}.` : "Banco, servidor, erros e notificações."}
        acoes={<Botao onClick={recarregar} carregando={atualizando}>Conferir de novo</Botao>}
      />
      {erro && !s && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!s && !erro && <Esqueleto linhas={8} />}
      {s && (
        <div className="space-y-4">
          {s.avisos.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-5" /> Tudo certo por aqui.
            </div>
          ) : (
            <ul className="space-y-2">
              {s.avisos.map((a) => (
                <li
                  key={a.texto}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold",
                    a.nivel === "grave" ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300" : "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
                  )}
                >
                  {a.nivel === "grave" ? <Siren className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
                  {a.texto}
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <BlocoNumero rotulo="Espaço do banco" valor={`${s.banco.percentual}%`} nota={`${tamanho(s.banco.usadoBytes)} de ${tamanho(s.banco.limiteBytes)}`} icone={<Database className="size-4" />} />
            <BlocoNumero rotulo="Resposta do banco" valor={`${s.banco.latenciaMs} ms`} nota={s.banco.latenciaMs < 60 ? "rápido" : s.banco.latenciaMs < 200 ? "ok" : "lento"} icone={<Database className="size-4" />} />
            <BlocoNumero rotulo="Erros do servidor (24 h)" valor={numero(s.erros.total)} nota={`desde ${dataHora(s.erros.desde)}`} icone={<Server className="size-4" />} />
            <BlocoNumero rotulo="Online agora" valor={numero(s.servidor.online)} nota="nos últimos 5 minutos" icone={<CheckCircle2 className="size-4" />} />
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={s.banco.percentual} aria-valuemin={0} aria-valuemax={100} aria-label="Espaço usado do banco">
            <div
              className={cn("h-full rounded-full", s.banco.percentual >= 90 ? "bg-rose-500" : s.banco.percentual >= 80 ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: `${Math.min(100, Math.max(1, s.banco.percentual))}%` }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao titulo="Erros do servidor" descricao="Agrupados por rota, nas últimas 24 horas. O detalhe completo fica no log do Render." corpo="p-0">
              {s.erros.porRota.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nenhum erro. 🎉</p>
              ) : (
                <ul className="divide-y">
                  {s.erros.porRota.map((e) => (
                    <li key={`${e.metodo}${e.rota}${e.status}`} className="px-4 py-2.5 text-sm">
                      <p className="flex items-center gap-2 font-mono text-xs">
                        <b className="rounded bg-rose-500/15 px-1.5 text-rose-700 dark:text-rose-300">{e.status}</b>
                        <span className="font-bold">{e.metodo}</span>
                        <span className="truncate">{e.rota}</span>
                        <span className="ml-auto shrink-0 font-sans font-bold">{e.vezes}×</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.mensagem} · {relativo(e.ultima)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>

            <Cartao titulo="Maiores tabelas do banco" corpo="p-0">
              <ul className="divide-y">
                {s.banco.tabelas.map((t) => (
                  <li key={t.tabela} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <span className="truncate font-mono text-xs">{t.tabela}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{numero(t.linhas)} linhas · <b className="text-foreground">{tamanho(t.bytes)}</b></span>
                  </li>
                ))}
              </ul>
            </Cartao>

            <Cartao titulo="Notificações (7 dias)" corpo="grid grid-cols-3 gap-3 p-4">
              <div><p className="text-xs font-bold text-muted-foreground">Enviadas</p><p className="text-xl font-black">{numero(s.notificacoes.enviadas)}</p></div>
              <div><p className="text-xs font-bold text-muted-foreground">Chegaram</p><p className="text-xl font-black">{numero(s.notificacoes.entregues)}</p></div>
              <div><p className="text-xs font-bold text-muted-foreground">Falharam</p><p className={cn("text-xl font-black", s.notificacoes.falhas > 0 && "text-amber-600")}>{numero(s.notificacoes.falhas)}</p></div>
              {s.notificacoes.naoEnviadas > 0 && <p className="col-span-3 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><BellRing className="size-4" /> {s.notificacoes.naoEnviadas} não chegaram a ser enviadas.</p>}
            </Cartao>

            <Cartao titulo="Servidor no ar" corpo="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm">
              <p className="text-muted-foreground">Versão</p><p className="font-bold">{s.servidor.versao ?? "—"}{s.servidor.commit ? ` · ${s.servidor.commit}` : ""}</p>
              <p className="text-muted-foreground">Ligado desde</p><p className="font-bold">{dataHora(s.servidor.ligadoDesde)}</p>
              <p className="text-muted-foreground">Memória</p><p className="font-bold">{numero(s.servidor.memoriaMb)} MB</p>
              <p className="text-muted-foreground">Node</p><p className="font-bold">{s.servidor.node}</p>
              <p className="text-muted-foreground">PostgreSQL</p><p className="font-bold">{s.banco.versao ?? "—"}</p>
              <p className="text-muted-foreground">Conexões</p><p className="font-bold">{s.banco.conexoes ?? "—"}{s.banco.maxConexoes ? ` de ${s.banco.maxConexoes}` : ""}</p>
            </Cartao>
          </div>
        </div>
      )}
    </Pagina>
  );
}
