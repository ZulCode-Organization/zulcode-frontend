"use client";

import Link from "next/link";
import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import {
  ArrowLeft, Award, BadgeCheck, Ban, Bell, BookOpen, Code2, Crown, Download, ExternalLink, Feather, Flame, Gem, Gift, MoreHorizontal, Pencil, Shield,
  ShoppingBag, Sparkles, StickyNote, Trash2, Trophy, Undo2, UserCog, UserPlus, Wallet,
} from "lucide-react";
import { Pagina } from "../shell";
import { AreaDeTexto, AvatarPequeno, Botao, Cartao, Erro, Esqueleto, Segmentado, Selo, Vazio } from "../ui";
import { avisar } from "../avisos";
import { perguntar } from "../dialogo";
import { CalendarioDeEstudo } from "./calendario";
import { AcoesDaFicha, exportarDados, type AcaoDaFicha } from "./acoes-da-ficha";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { data, dataHora, numero, relativo } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { AcaoDaEquipe, Calendario, EventoDaLinha, FichaDaPessoa, LinhaDeExtrato, Nota } from "@/lib/admin/tipos";
import { TEXTO_DA_ACAO, resumoDoAjuste } from "@/lib/admin/textos";

type Aba = "resumo" | "linha" | "extratos" | "equipe" | "projetos";

export function FichaDaPessoa({ id }: { id: string }) {
  const { dados: p, erro, recarregar, atualizando } = useDados<FichaDaPessoa>(`/admin/pessoas/${id}`);
  const [aba, setAba] = useState<Aba>("resumo");
  const [acao, setAcao] = useState<AcaoDaFicha | null>(null);

  if (erro && !p) return <Pagina><Erro tentarDeNovo={recarregar}>{erro}</Erro></Pagina>;
  if (!p) return <Pagina><Esqueleto linhas={10} /></Pagina>;

  const suspensa = p.isBanned && p.bannedUntil;

  return (
    <Pagina larga>
      <Link href="/admin/pessoas" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Pessoas
      </Link>

      {/* ── Cabeçalho ── */}
      <header className={cn("mb-5 flex flex-wrap items-start justify-between gap-4 transition-opacity", atualizando && "opacity-70")}>
        <div className="flex min-w-0 items-center gap-3.5">
          <AvatarPequeno id={p.avatarId} className="size-14 rounded-xl text-[1.6rem]" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 truncate text-[1.5rem] font-black leading-tight">
              {p.name}
              {p.isVerified && <BadgeCheck className="size-5 shrink-0 text-sky-500" aria-label="Verificada" />}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{p.email} · #{p.publicCode}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {p.plano !== "grátis" && <Selo tom="roxo" icone={<Crown className="size-3" />}>{p.plano === "teste" ? "PRO em teste" : p.plano === "cortesia" ? `PRO de cortesia até ${data(p.proCourtesyUntil)}` : "PRO"}</Selo>}
              {p.role !== "USER" && <Selo tom="azul">{p.role === "ADMIN" ? "Administrador" : "Professor"}</Selo>}
              {p.isDeveloper && <Selo tom="verde" icone={<Code2 className="size-3" />}>Desenvolvedor</Selo>}
              {p.isEarlyTester && <Selo tom="azul">Pioneiro</Selo>}
              {p.isBanned && <Selo tom="vermelho" icone={<Ban className="size-3" />}>{suspensa ? `Suspensa até ${data(p.bannedUntil)}` : "Bloqueada"}</Selo>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao icone={<Wallet className="size-4" />} onClick={() => setAcao("saldo")}>Ajustar saldo</Botao>
          <Botao icone={<Bell className="size-4" />} onClick={() => setAcao("notificar")}>Notificar</Botao>
          <MenuDeAcoes pessoa={p} aoEscolher={setAcao} />
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Segmentado<Aba>
            rotulo="Partes da ficha"
            valor={aba}
            aoMudar={setAba}
            opcoes={[
              { valor: "resumo", texto: "Resumo" },
              { valor: "linha", texto: "Linha do tempo" },
              { valor: "extratos", texto: "Extratos" },
              { valor: "equipe", texto: "Ações da equipe" },
              { valor: "projetos", texto: `Projetos (${p._count.playgroundProjects})` },
            ]}
          />
          {aba === "resumo" && <Resumo p={p} />}
          {aba === "linha" && <LinhaDoTempo id={p.id} />}
          {aba === "extratos" && <Extratos id={p.id} />}
          {aba === "equipe" && <AcoesDaEquipe id={p.id} />}
          {aba === "projetos" && <Projetos id={p.id} />}
        </div>

        <aside className="space-y-4">
          <Cartao titulo="Conta" corpo="p-0">
            <dl className="divide-y text-sm">
              {[
                ["Cadastro", data(p.createdAt)],
                ["Último acesso", relativo(p.lastSeenAt)],
                ["Último estudo", relativo(p.lastActivityAt)],
                ["Nivelamento", p.isNivelado ? "feito" : "não fez"],
                ["Meta diária", `${p.dailyGoalMinutes} min`],
                ["Seguidores", `${numero(p._count.seguidores)} · segue ${numero(p._count.seguindo)}`],
                ["Conquistas", numero(p._count.achievements)],
                ["Celulares com notificação", numero(p._count.pushTokens)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-4 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </Cartao>
          <Assinatura p={p} />
          <Anotacoes id={p.id} />
        </aside>
      </div>

      <AcoesDaFicha pessoa={p} acao={acao} aoFechar={() => setAcao(null)} />
    </Pagina>
  );
}

function MenuDeAcoes({ pessoa, aoEscolher }: { pessoa: FichaDaPessoa; aoEscolher: (a: AcaoDaFicha) => void }) {
  const item = "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Botao icone={<MoreHorizontal className="size-4" />} aria-label="Mais ações">Mais</Botao>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="zc-adm-entra z-50 min-w-56 rounded-xl border bg-popover p-1 shadow-xl">
          <DropdownMenu.Item className={item} onSelect={() => aoEscolher("selos")}><BadgeCheck className="size-4" /> Selos</DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => aoEscolher("cortesia")}><Gift className="size-4" /> PRO de cortesia</DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => aoEscolher("ofensiva")}><Flame className="size-4" /> Restaurar ofensiva</DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => aoEscolher("papel")}><UserCog className="size-4" /> Papel da conta</DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item className={item} onSelect={() => aoEscolher("bloquear")}>
            <Ban className="size-4" /> {pessoa.isBanned ? "Liberar a conta" : "Bloquear ou suspender"}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => void exportarDados(pessoa)}><Download className="size-4" /> Exportar dados (LGPD)</DropdownMenu.Item>
          <DropdownMenu.Item className={cn(item, "text-rose-600 dark:text-rose-400")} onSelect={() => aoEscolher("excluir")}><Trash2 className="size-4" /> Excluir conta</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ── Resumo ───────────────────────────────────────────────────────────────

function Resumo({ p }: { p: FichaDaPessoa }) {
  const calendario = useDados<Calendario>(`/admin/pessoas/${p.id}/calendario`);
  const numeros = [
    { rotulo: "XP", valor: numero(p.xp), icone: <Sparkles className="size-4 text-amber-500" /> },
    { rotulo: "Ofensiva", valor: `${numero(p.currentStreak)} ${p.currentStreak === 1 ? "dia" : "dias"}`, nota: `maior: ${numero(p.longestStreak)}`, icone: <Flame className="size-4 text-orange-500" /> },
    { rotulo: "Rupees", valor: numero(p.coins), icone: <Gem className="size-4 text-emerald-500" /> },
    { rotulo: "Penas", valor: `${p.lives}`, nota: `${p.errorShields} escudos · ${p.streakFreezes} protetores`, icone: <Feather className="size-4 text-rose-500" /> },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} className="rounded-xl border bg-card px-4 py-3">
            <p className="flex items-center justify-between text-xs font-bold text-muted-foreground">{n.rotulo}{n.icone}</p>
            <p className="mt-1 text-xl font-black">{n.valor}</p>
            {n.nota && <p className="text-xs text-muted-foreground">{n.nota}</p>}
          </div>
        ))}
      </div>

      <Cartao titulo="Calendário de estudo">
        {calendario.dados ? <CalendarioDeEstudo c={calendario.dados} /> : <div className="h-28 animate-pulse rounded-lg bg-muted" />}
      </Cartao>

      <Cartao titulo="Cursos" corpo="p-0">
        {p.cursos.length === 0 ? (
          <Vazio titulo="Ainda não começou nenhum curso" />
        ) : (
          <ul className="divide-y">
            {p.cursos.map((c) => {
              const pct = c.aulas ? Math.round((c.concluidas / c.aulas) * 100) : 0;
              return (
                <li key={c.cursoId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <BookOpen className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-bold">{c.curso}{c.atual && <Selo tom="azul">atual</Selo>}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.ondeParou ? `Próxima: ${c.ondeParou.aula} (${c.ondeParou.unidade})` : "Concluiu o curso"}
                      {c.notaMedia !== null && ` · nota média ${c.notaMedia}`}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--viz-1)" }} />
                    </div>
                  </div>
                  <span className="text-sm font-black tabular-nums">{c.concluidas}/{c.aulas}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Nivelamento" descricao="O que a pessoa respondeu ao entrar">
          {p.onboarding.length ? (
            <dl className="space-y-2 text-sm">
              {p.onboarding.map((o) => (
                <div key={o.pergunta}>
                  <dt className="text-xs text-muted-foreground">{o.pergunta}</dt>
                  <dd className="font-bold">{o.emoji ? `${o.emoji} ` : ""}{o.resposta}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-muted-foreground">Não respondeu.</p>}
        </Cartao>
        <Cartao titulo="Pódios semanais" descricao={`${numero(p._count.weeklyPodiums)} no total`}>
          {p.podios.length ? (
            <ul className="space-y-1.5 text-sm">
              {p.podios.map((x) => (
                <li key={`${x.weekStart}-${x.league}`} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Trophy className={cn("size-4", x.position === 1 ? "text-amber-500" : x.position === 2 ? "text-slate-400" : "text-orange-700")} />{x.position}º na liga {x.league}</span>
                  <span className="text-xs text-muted-foreground">{data(x.weekStart)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhum pódio ainda.</p>}
        </Cartao>
      </div>
    </div>
  );
}

function Assinatura({ p }: { p: FichaDaPessoa }) {
  const s = p.subscription;
  const status: Record<string, string> = { trialing: "Em teste", active: "Ativa", past_due: "Pagamento atrasado", canceled: "Cancelada", incomplete: "Incompleta", unpaid: "Não paga" };
  return (
    <Cartao
      titulo="Assinatura"
      acoes={p.linkStripe ? (
        <a href={p.linkStripe} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10">
          Stripe <ExternalLink className="size-3" />
        </a>
      ) : undefined}
    >
      {s && s.stripeSubscriptionId ? (
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Situação</dt><dd className="font-bold">{status[s.status] ?? s.status}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Plano</dt><dd className="font-bold">{s.plano === "anual" ? "Anual" : s.plano === "mensal" ? "Mensal" : "—"}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{s.status === "trialing" ? "Fim do teste" : s.canceladaNoFim ? "Termina em" : "Renova em"}</dt>
            <dd className="font-bold">{data(s.validoAte)}</dd>
          </div>
          {s.canceladaNoFim && <p className="pt-1 text-xs font-bold text-amber-700 dark:text-amber-300">Cancelada: não renova.</p>}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          {p.plano === "cortesia" ? `PRO de cortesia até ${data(p.proCourtesyUntil)}.` : p.isPro ? "PRO pelo selo permanente, sem cobrança." : "Nunca assinou."}
        </p>
      )}
    </Cartao>
  );
}

// ── Linha do tempo ───────────────────────────────────────────────────────

const ICONES_DA_LINHA: Record<EventoDaLinha["tipo"], React.ReactNode> = {
  cadastro: <UserPlus className="size-3.5" />,
  onboarding: <Pencil className="size-3.5" />,
  licao: <BookOpen className="size-3.5" />,
  compra: <ShoppingBag className="size-3.5" />,
  conquista: <Award className="size-3.5" />,
  assinatura: <Crown className="size-3.5" />,
  equipe: <Shield className="size-3.5" />,
  podio: <Trophy className="size-3.5" />,
};

function LinhaDoTempo({ id }: { id: string }) {
  const primeira = useDados<{ itens: EventoDaLinha[]; proximo: string | null }>(`/admin/pessoas/${id}/linha-do-tempo`);
  const [mais, setMais] = useState<EventoDaLinha[]>([]);
  const [proximo, setProximo] = useState<string | null | undefined>(undefined);
  const [carregando, setCarregando] = useState(false);
  const cursor = proximo === undefined ? primeira.dados?.proximo : proximo;
  const itens = [...(primeira.dados?.itens ?? []), ...mais];

  if (!primeira.dados) return <Cartao><Esqueleto linhas={8} /></Cartao>;
  return (
    <Cartao corpo="px-4 py-3">
      <ol className="relative">
        {itens.map((e, i) => (
          <li key={`${e.quando}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {i < itens.length - 1 && <span className="absolute bottom-0 left-[13px] top-7 w-px bg-border" />}
            <span className={cn("z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border bg-card", e.tipo === "equipe" ? "text-primary" : "text-muted-foreground")}>
              {ICONES_DA_LINHA[e.tipo]}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-bold">{e.titulo}</p>
              <p className="text-xs text-muted-foreground">{dataHora(e.quando)}{e.detalhe ? ` · ${e.detalhe}` : ""}</p>
            </div>
          </li>
        ))}
      </ol>
      {cursor && (
        <Botao
          className="mt-3 w-full"
          carregando={carregando}
          onClick={async () => {
            setCarregando(true);
            const r = await pedir<{ itens: EventoDaLinha[]; proximo: string | null }>(`/admin/pessoas/${id}/linha-do-tempo?antes=${encodeURIComponent(cursor)}`).catch(() => null);
            if (r) {
              setMais((m) => [...m, ...r.itens]);
              setProximo(r.proximo);
            }
            setCarregando(false);
          }}
        >
          Carregar mais antigos
        </Botao>
      )}
    </Cartao>
  );
}

// ── Extratos ─────────────────────────────────────────────────────────────

function Extratos({ id }: { id: string }) {
  const [tipo, setTipo] = useState<"rupees" | "xp" | "penas">("rupees");
  const { dados, atualizando } = useDados<{ itens: LinhaDeExtrato[]; proximo: string | null }>(`/admin/pessoas/${id}/extrato?tipo=${tipo}`);
  return (
    <Cartao
      titulo="Extrato"
      acoes={<Segmentado<"rupees" | "xp" | "penas"> rotulo="Tipo de extrato" valor={tipo} aoMudar={setTipo} opcoes={[{ valor: "rupees", texto: "Rupees" }, { valor: "xp", texto: "XP" }, { valor: "penas", texto: "Penas" }]} />}
      corpo="p-0"
      atualizando={atualizando}
    >
      {!dados ? <div className="p-4"><Esqueleto linhas={6} /></div> : dados.itens.length === 0 ? (
        <Vazio titulo="Nada por aqui ainda" />
      ) : (
        <ul className="max-h-[520px] divide-y overflow-y-auto">
          {dados.itens.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className={cn("w-16 shrink-0 text-right font-black tabular-nums", l.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : l.amount < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                {l.amount > 0 ? "+" : ""}{numero(l.amount)}
              </span>
              <span className="min-w-0 flex-1 truncate">{l.reason}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{dataHora(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {dados?.proximo && <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">Mostrando os 50 mais recentes.</p>}
    </Cartao>
  );
}

// ── Ações da equipe (com estorno) ────────────────────────────────────────

function AcoesDaEquipe({ id }: { id: string }) {
  const { dados, atualizando } = useDados<{ itens: AcaoDaEquipe[]; temMais: boolean }>(`/admin/acoes?alvo=usuario&alvoId=${id}&limite=80`);
  const [estornando, setEstornando] = useState<string | null>(null);

  const estornar = async (a: AcaoDaEquipe) => {
    if (!(await perguntar({ titulo: "Estornar o ajuste?", texto: <>Desfaz <b className="text-foreground">{resumoDoAjuste(a.dados)}</b>. Se a pessoa já gastou, o estorno leva só o que sobrou.</>, sim: "Estornar" }))) return;
    setEstornando(a.id);
    try {
      await pedir(`/admin/acoes/${a.id}/estornar`, { method: "POST" });
      invalidar("/admin/acoes");
      invalidar(`/admin/pessoas/${id}`);
      avisar("Ajuste estornado.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível estornar.", { tom: "erro" });
    } finally {
      setEstornando(null);
    }
  };

  return (
    <Cartao titulo="O que a equipe fez nesta conta" corpo="p-0" atualizando={atualizando}>
      {!dados ? <div className="p-4"><Esqueleto linhas={5} /></div> : dados.itens.length === 0 ? (
        <Vazio titulo="Nenhuma ação da equipe" icone={<Shield className="size-5" />} />
      ) : (
        <ul className="divide-y">
          {dados.itens.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <AvatarPequeno id={a.ator?.avatarId} className="size-7 rounded-md text-[0.8rem]" />
              <div className="min-w-0 flex-1">
                <p className={cn("font-bold", a.estornadaEm && "text-muted-foreground line-through")}>
                  {TEXTO_DA_ACAO[a.acao] ?? a.acao}
                  {a.acao === "conceder_recursos" && <span className="font-normal"> · {resumoDoAjuste(a.dados)}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.ator?.name ?? "alguém da equipe"} · {dataHora(a.quando)}
                  {typeof a.dados.motivo === "string" && a.dados.motivo ? ` · ${a.dados.motivo}` : ""}
                  {a.estornadaEm ? ` · estornada ${relativo(a.estornadaEm)}` : ""}
                </p>
              </div>
              {a.acao === "conceder_recursos" && !a.estornadaEm && (
                <Botao tamanho="sm" variante="fantasma" icone={<Undo2 className="size-3.5" />} carregando={estornando === a.id} onClick={() => estornar(a)}>Estornar</Botao>
              )}
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}

// ── Projetos ─────────────────────────────────────────────────────────────

function Projetos({ id }: { id: string }) {
  const { dados } = useDados<{ id: string; name: string; mode: string; publicSlug: string | null; createdAt: string; updatedAt: string }[]>(`/admin/pessoas/${id}/projetos`);
  return (
    <Cartao titulo="Projetos do playground" corpo="p-0">
      {!dados ? <div className="p-4"><Esqueleto linhas={4} /></div> : dados.length === 0 ? (
        <Vazio titulo="Nenhum projeto salvo" icone={<Code2 className="size-5" />} />
      ) : (
        <ul className="divide-y">
          {dados.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Code2 className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{x.name}</p>
                <p className="text-xs text-muted-foreground">{x.mode === "js" ? "JavaScript" : "Web"} · editado {relativo(x.updatedAt)}</p>
              </div>
              {x.publicSlug ? (
                <a href={`/p/${x.publicSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10">
                  Abrir <ExternalLink className="size-3" />
                </a>
              ) : <span className="text-xs text-muted-foreground">privado</span>}
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}

// ── Anotações ────────────────────────────────────────────────────────────

function Anotacoes({ id }: { id: string }) {
  const chave = `/admin/pessoas/${id}/notas`;
  const { dados } = useDados<Nota[]>(chave);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    try {
      await pedir(chave, { method: "POST", json: { texto } });
      setTexto("");
      invalidar(chave);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Cartao titulo={<span className="flex items-center gap-1.5"><StickyNote className="size-4" /> Anotações da equipe</span>} descricao="A pessoa nunca vê.">
      <div className="space-y-2">
        <AreaDeTexto
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: pediu reembolso por e-mail em 12/10"
          className="min-h-16 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void salvar();
          }}
        />
        <Botao tamanho="sm" variante="primario" disabled={!texto.trim()} carregando={salvando} onClick={salvar}>Anotar</Botao>
      </div>
      <ul className="mt-3 space-y-2">
        {dados?.map((n) => (
          <li key={n.id} className="group rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p className="whitespace-pre-wrap">{n.text}</p>
            <p className="mt-1 flex items-center justify-between text-[0.7rem] text-muted-foreground">
              <span>{n.author?.name ?? "alguém da equipe"} · {dataHora(n.createdAt)}</span>
              <button
                type="button"
                className="opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
                onClick={async () => {
                  if (!(await perguntar({ titulo: "Apagar esta anotação?", sim: "Apagar", perigoso: true }))) return;
                  await pedir(`/admin/notas/${n.id}`, { method: "DELETE" }).catch((e: unknown) => avisar(e instanceof Error ? e.message : "Não foi possível apagar.", { tom: "erro" }));
                  invalidar(chave);
                }}
              >
                apagar
              </button>
            </p>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}
