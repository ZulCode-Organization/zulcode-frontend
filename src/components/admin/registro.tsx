"use client";

import Link from "next/link";
import { useState } from "react";
import { History } from "lucide-react";
import { Pagina } from "./shell";
import { AvatarPequeno, Botao, Cabecalho, Cartao, Escolha, Esqueleto, Selo, Vazio } from "./ui";
import { TEXTO_DA_ACAO, resumoDoAjuste } from "@/lib/admin/textos";
import { pedir, query, useDados } from "@/lib/admin/api";
import { dataHora } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { AcaoDaEquipe } from "@/lib/admin/tipos";

const ALVOS = [
  { valor: "", texto: "Tudo" },
  { valor: "usuario", texto: "Pessoas" },
  { valor: "curso", texto: "Cursos" },
  { valor: "secao", texto: "Seções" },
  { valor: "unidade", texto: "Unidades" },
  { valor: "aula", texto: "Aulas" },
  { valor: "loja", texto: "Loja" },
  { valor: "segmento", texto: "Segmentos" },
];

/** Para onde leva cada linha: a pessoa, a aula, o curso. */
function destino(a: AcaoDaEquipe) {
  if (!a.alvoId) return null;
  if (a.alvo === "usuario" && a.acao !== "excluir_conta") return `/admin/pessoas/${a.alvoId}`;
  if (a.alvo === "aula" && !a.acao.startsWith("apagar")) return `/admin/conteudo/aula/${a.alvoId}`;
  if (a.alvo === "curso" && !a.acao.startsWith("apagar")) return `/admin/conteudo/${a.alvoId}`;
  return null;
}

function nomeDoAlvo(a: AcaoDaEquipe) {
  if (a.alvoNome) return a.alvoNome;
  const d = a.dados;
  for (const k of ["nome", "titulo"]) if (typeof d[k] === "string" && d[k]) return d[k] as string;
  return null;
}

/**
 * Tudo que a equipe fez pelo administrativo, do mais recente para o mais
 * antigo: quem, o quê, em quem e quando. É o rastro que permite achar uma
 * concessão errada semanas depois.
 */
export function RegistroDeAcoes() {
  const [alvo, setAlvo] = useState("");
  const primeira = useDados<{ itens: AcaoDaEquipe[]; temMais: boolean }>(`/admin/acoes${query({ alvo, limite: 60 })}`);
  const [mais, setMais] = useState<{ chave: string; itens: AcaoDaEquipe[]; temMais: boolean } | null>(null);
  const [carregando, setCarregando] = useState(false);

  // As páginas extras pertencem ao filtro em que foram carregadas; trocar o
  // filtro descarta, sem precisar de efeito para limpar.
  const extras = mais?.chave === alvo ? mais : null;
  const itens = [...(primeira.dados?.itens ?? []), ...(extras?.itens ?? [])];
  const temMais = extras ? extras.temMais : primeira.dados?.temMais;

  return (
    <Pagina>
      <Cabecalho
        titulo="Registro de ações"
        descricao="Tudo que a equipe fez pelo administrativo. Ajustes de saldo podem ser estornados na ficha da pessoa."
        acoes={
          <Escolha value={alvo} onChange={(e) => setAlvo(e.target.value)} className="w-40" aria-label="Filtrar por tipo">
            {ALVOS.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
          </Escolha>
        }
      />
      <Cartao corpo="p-0" atualizando={primeira.atualizando}>
        {!primeira.dados ? <div className="p-4"><Esqueleto linhas={10} /></div> : itens.length === 0 ? (
          <Vazio titulo="Nada registrado ainda" icone={<History className="size-5" />}>As ações da equipe passam a aparecer aqui a partir do administrativo novo.</Vazio>
        ) : (
          <ul className="divide-y">
            {itens.map((a) => {
              const href = destino(a);
              const nome = nomeDoAlvo(a);
              const ajuste = a.acao === "conceder_recursos" || a.acao === "estornar" ? resumoDoAjuste(a.dados) : "";
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <AvatarPequeno id={a.ator?.avatarId} className="size-7 rounded-md text-[0.8rem]" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate", a.estornadaEm && "text-muted-foreground line-through")}>
                      <b>{a.ator?.name ?? "Alguém da equipe"}</b> {(TEXTO_DA_ACAO[a.acao] ?? a.acao).toLowerCase()}
                      {nome && <> · {href ? <Link href={href} className="font-bold text-primary hover:underline">{nome}</Link> : <b>{nome}</b>}</>}
                      {ajuste && <span className="text-muted-foreground"> · {ajuste}</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {dataHora(a.quando)}
                      {typeof a.dados.motivo === "string" && a.dados.motivo ? ` · ${a.dados.motivo}` : ""}
                    </p>
                  </div>
                  {a.estornadaEm && <Selo>estornada</Selo>}
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
      {temMais && itens.length > 0 && (
        <Botao
          className="mt-3 w-full"
          carregando={carregando}
          onClick={async () => {
            setCarregando(true);
            const ultimo = itens[itens.length - 1];
            const r = await pedir<{ itens: AcaoDaEquipe[]; temMais: boolean }>(`/admin/acoes${query({ alvo, limite: 60, antes: ultimo.quando })}`).catch(() => null);
            if (r) setMais({ chave: alvo, itens: [...(extras?.itens ?? []), ...r.itens], temMais: r.temMais });
            setCarregando(false);
          }}
        >
          Carregar mais antigas
        </Botao>
      )}
    </Pagina>
  );
}
