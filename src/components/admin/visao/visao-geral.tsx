"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BookOpen, Crown, Flame, Gem, Radio, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";
import { Pagina } from "../shell";
import { BlocoNumero, Cabecalho, Cartao, Erro, Escolha, Esqueleto, Grade, Segmentado, Selo } from "../ui";
import { GraficoDeColunas, GraficoDeLinhas, MapaDeCalor, Ranking } from "../graficos";
import { useDados } from "@/lib/admin/api";
import { compacto, dia, numero, porcento, reais } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type {
  DesempenhoDeQuestao, Funil, Horarios, LinhaDeOrigem, LinhaDeRetencao, Periodo, VisaoAprendizado, VisaoEconomia, VisaoEngajamento,
  VisaoOfensivas, VisaoPessoas, VisaoPro,
} from "@/lib/admin/tipos";

const PARTES = [
  { id: "pessoas", rotulo: "Pessoas" },
  { id: "aprendizado", rotulo: "Aprendizado" },
  { id: "economia", rotulo: "Economia" },
  { id: "pro", rotulo: "PRO" },
  { id: "engajamento", rotulo: "Engajamento" },
];

/**
 * A visão geral. Cada bloco busca os próprios números e aparece quando chega —
 * a página não espera a consulta mais lenta para mostrar a mais rápida. O
 * período escolhido no topo vale para todos os blocos que dependem de data.
 */
export function VisaoGeral() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const pessoas = useDados<VisaoPessoas>(`/admin/visao/pessoas?periodo=${periodo}`);

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Visão geral"
        descricao="Como o ZulCode está indo. Cada número compara o período escolhido com o período anterior do mesmo tamanho."
        acoes={
          <>
            {pessoas.dados && (
              <Selo tom="verde" icone={<Radio className="size-3" />}>{numero(pessoas.dados.onlineAgora)} online agora</Selo>
            )}
            <Segmentado<Periodo>
              rotulo="Período"
              valor={periodo}
              aoMudar={setPeriodo}
              opcoes={[{ valor: 7, texto: "7 dias" }, { valor: 30, texto: "30 dias" }, { valor: 90, texto: "90 dias" }]}
            />
          </>
        }
      />

      <nav aria-label="Partes da visão geral" className="sticky top-0 z-10 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        {PARTES.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
            {p.rotulo}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        <ParteDePessoas periodo={periodo} pessoas={pessoas} />
        <ParteDeAprendizado periodo={periodo} />
        <ParteDeEconomia periodo={periodo} />
        <ParteDoPro />
        <ParteDeEngajamento periodo={periodo} />
      </div>
    </Pagina>
  );
}

function TituloDaParte({ id, children, nota }: { id: string; children: string; nota?: string }) {
  return (
    <div id={id} className="mb-3 scroll-mt-16">
      <h2 className="text-lg font-black">{children}</h2>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

const rotuloDoDia = (d: string) => dia(d);

// ── Pessoas ──────────────────────────────────────────────────────────────

function ParteDePessoas({ periodo, pessoas }: { periodo: Periodo; pessoas: ReturnType<typeof useDados<VisaoPessoas>> }) {
  const p = pessoas.dados;
  const retencao = useDados<LinhaDeRetencao[]>("/admin/visao/retencao");
  const origens = useDados<LinhaDeOrigem[]>("/admin/visao/origens");
  const horarios = useDados<Horarios>(`/admin/visao/horarios?periodo=${periodo}`);
  const ofensivas = useDados<VisaoOfensivas>("/admin/visao/ofensivas");

  return (
    <section>
      <TituloDaParte id="pessoas">Pessoas</TituloDaParte>
      {pessoas.erro && <Erro tentarDeNovo={pessoas.recarregar}>{pessoas.erro}</Erro>}
      <Grade>
        <BlocoNumero rotulo="Novos cadastros" carregando={!p} valor={compacto(p?.novos.atual)} variacao={p?.novos.variacao} nota={p && `${numero(p.total)} contas no total`} icone={<UsersRound className="size-4" />} />
        <BlocoNumero rotulo="Estudaram hoje" carregando={!p} valor={compacto(p?.estudaram.dia)} nota={p && `${numero(p.estudaram.semana)} na semana · ${numero(p.estudaram.mes)} no mês`} icone={<BookOpen className="size-4" />} />
        <BlocoNumero rotulo="Abriram o app (30 dias)" carregando={!p} valor={compacto(p?.abriram.mes)} nota={p && `${numero(p.abriram.dia)} hoje · ${numero(p.abriram.semana)} na semana`} icone={<Radio className="size-4" />} />
        <BlocoNumero rotulo="Bloqueadas" carregando={!p} valor={compacto(p?.bloqueados)} nota="contas sem acesso agora" icone={<ShieldCheck className="size-4" />} />
      </Grade>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Cartao titulo="Cadastros e estudo por dia" descricao="Quantas contas foram criadas e quantas pessoas estudaram, dia a dia" atualizando={pessoas.atualizando}>
          {p ? (
            <GraficoDeLinhas
              dados={p.serie}
              series={[{ chave: "estudaram", nome: "Estudaram", cor: 1 }, { chave: "cadastros", nome: "Cadastros", cor: 2 }]}
              rotuloX={rotuloDoDia}
            />
          ) : <Esqueleto linhas={6} />}
        </Cartao>
        <Cartao titulo="Ofensivas vivas" descricao="Quem estudou hoje ou ontem, por faixa de cor" atualizando={ofensivas.atualizando}>
          {ofensivas.dados ? <Ofensivas o={ofensivas.dados} /> : <Esqueleto linhas={5} />}
        </Cartao>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Cartao titulo="Retenção por semana de cadastro" descricao="Quantos de cada turma voltaram a estudar. Vazio = a turma ainda não chegou nesse prazo.">
          {retencao.dados ? <Retencao linhas={retencao.dados} /> : <Esqueleto linhas={6} />}
        </Cartao>
        <Cartao titulo="Quem fica, por como conheceu o ZulCode" descricao="Que canal traz gente que continua">
          {origens.dados ? <Origens linhas={origens.dados} /> : <Esqueleto linhas={6} />}
        </Cartao>
      </div>

      <Cartao className="mt-3" titulo="Quando as pessoas estudam" descricao="Dia da semana e hora (de Brasília) de cada registro de estudo no período" atualizando={horarios.atualizando}>
        {horarios.dados ? <MapaDeCalor matriz={horarios.dados.matriz} /> : <Esqueleto linhas={7} />}
      </Cartao>
    </section>
  );
}

function Ofensivas({ o }: { o: VisaoOfensivas }) {
  const faixas = [
    { nome: "Dourada (100+ dias)", valor: o.dourada, cor: "text-amber-500 fill-amber-400" },
    { nome: "Ciano (30 a 99 dias)", valor: o.ciano, cor: "text-cyan-300 fill-cyan-500" },
    { nome: "Azul (1 a 29 dias)", valor: o.azul, cor: "text-sky-400 fill-blue-600" },
  ];
  return (
    <div className="space-y-4">
      <Ranking itens={faixas.map((f) => ({ chave: f.nome, nome: <span className="inline-flex items-center gap-1.5"><Flame className={cn("size-4", f.cor)} />{f.nome}</span>, valor: f.valor }))} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-amber-500/10 px-3 py-2">
          <p className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300"><AlertTriangle className="size-3.5" /> Em risco hoje</p>
          <p className="text-xl font-black">{numero(o.emRisco)}</p>
          <p className="text-[0.7rem] text-muted-foreground">estudaram ontem, ainda não hoje</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-bold text-muted-foreground">Com proteção guardada</p>
          <p className="text-xl font-black">{numero(o.protegidas)}</p>
          <p className="text-[0.7rem] text-muted-foreground">de {numero(o.azul + o.ciano + o.dourada)} vivas</p>
        </div>
      </div>
    </div>
  );
}

/** A célula de porcentagem pinta o fundo numa cor só, mais forte quanto maior: a tabela vira um mapa. */
function CelulaPct({ v }: { v: number | null }) {
  if (v === null) return <td className="px-2 py-1.5 text-center text-muted-foreground/50">·</td>;
  const degrau = v <= 0 ? 0 : Math.min(6, 1 + Math.floor((v / 100) * 5.999));
  return (
    <td className="px-1 py-1">
      <span
        className={cn("block rounded-md px-2 py-1 text-center text-xs font-bold tabular-nums", degrau >= 4 && "text-white")}
        style={{ background: degrau ? `var(--viz-seq-${degrau})` : "var(--viz-vazio)" }}
      >
        {porcento(v, 0)}
      </span>
    </td>
  );
}

function Retencao({ linhas }: { linhas: LinhaDeRetencao[] }) {
  if (!linhas.length) return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há cadastros nas últimas semanas.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-bold">Semana</th>
            <th className="px-2 py-1.5 text-right font-bold">Pessoas</th>
            <th className="px-2 py-1.5 text-center font-bold">Dia seguinte</th>
            <th className="px-2 py-1.5 text-center font-bold">2ª semana</th>
            <th className="px-2 py-1.5 text-center font-bold">Depois de 1 mês</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.semana} className="border-t">
              <td className="px-2 py-1.5 font-bold">{dia(l.semana)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{numero(l.pessoas)}</td>
              <CelulaPct v={l.d1} />
              <CelulaPct v={l.d7} />
              <CelulaPct v={l.d30} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Origens({ linhas }: { linhas: LinhaDeOrigem[] }) {
  if (!linhas.length) return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há respostas do nivelamento.</p>;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-bold">Origem</th>
            <th className="px-2 py-1.5 text-right font-bold">Pessoas</th>
            <th className="px-2 py-1.5 text-center font-bold">Fizeram aula</th>
            <th className="px-2 py-1.5 text-center font-bold">Voltaram</th>
            <th className="px-2 py-1.5 text-center font-bold">PRO</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.origem} className="border-t">
              <td className="px-2 py-1.5 font-bold">{l.origem}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{numero(l.pessoas)}</td>
              <CelulaPct v={pct(l.fizeramAula, l.pessoas)} />
              <CelulaPct v={l.elegiveis ? pct(l.voltaram, l.elegiveis) : null} />
              <CelulaPct v={pct(l.pro, l.pessoas)} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">&ldquo;Voltaram&rdquo; = estudaram na segunda semana, entre quem já completou duas semanas de conta.</p>
    </div>
  );
}

// ── Aprendizado ──────────────────────────────────────────────────────────

function ParteDeAprendizado({ periodo }: { periodo: Periodo }) {
  const a = useDados<VisaoAprendizado>(`/admin/visao/aprendizado?periodo=${periodo}`);
  const cursos = useDados<{ id: string; name: string }[]>("/admin/visao/cursos");
  const [curso, setCurso] = useState("");
  const cursoAtivo = curso || cursos.dados?.[0]?.id || "";
  const funil = useDados<Funil>(cursoAtivo ? `/admin/visao/funil/${cursoAtivo}` : null);
  const questoes = useDados<DesempenhoDeQuestao[]>(`/admin/visao/questoes${curso ? `?curso=${curso}` : ""}`);
  const d = a.dados;

  return (
    <section>
      <TituloDaParte id="aprendizado">Aprendizado</TituloDaParte>
      {a.erro && <Erro tentarDeNovo={a.recarregar}>{a.erro}</Erro>}
      <Grade className="xl:grid-cols-3">
        <BlocoNumero rotulo="Lições concluídas" carregando={!d} valor={compacto(d?.licoes.atual)} variacao={d?.licoes.variacao} icone={<BookOpen className="size-4" />} />
        <BlocoNumero
          rotulo="Nota média"
          carregando={!d}
          valor={d?.notaMedia.atual ?? "—"}
          nota={d && d.notaMedia.anterior !== null ? `${d.notaMedia.anterior} no período anterior` : undefined}
          icone={<Sparkles className="size-4" />}
        />
        <BlocoNumero
          rotulo="Questões com acerto abaixo de 50%"
          carregando={!questoes.dados}
          valor={numero(questoes.dados?.filter((q) => q.taxa < 50).length)}
          nota="com 5 respostas ou mais"
          bomQuandoSobe={false}
          icone={<AlertTriangle className="size-4" />}
        />
      </Grade>

      <Cartao className="mt-3" titulo="Lições concluídas por dia" atualizando={a.atualizando}>
        {d ? <GraficoDeLinhas dados={d.serie} series={[{ chave: "licoes", nome: "Lições", cor: 1 }]} rotuloX={rotuloDoDia} altura={180} /> : <Esqueleto linhas={5} />}
      </Cartao>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        <Cartao titulo="Mais feitas" descricao="Aulas concluídas no período">
          {d ? <Ranking itens={d.maisFeitas.map((x) => ({ chave: x.id, nome: x.aula, detalhe: `${x.curso} · nota ${x.nota ?? "—"}`, valor: x.concluidas }))} /> : <Esqueleto />}
        </Cartao>
        <Cartao titulo="Nota mais baixa" descricao="Com 5 conclusões ou mais">
          {d ? <Ranking cor={2} itens={d.piorNota.map((x) => ({ chave: x.id, nome: x.aula, detalhe: `${x.curso} · ${x.concluidas} conclusões`, valor: x.nota ?? 0 }))} vazio="Nenhuma aula com base suficiente." /> : <Esqueleto />}
        </Cartao>
        <Cartao titulo="Mais erros" descricao="Respostas erradas no período">
          {d ? <Ranking cor={2} itens={d.maisErradas.map((x) => ({ chave: x.id, nome: x.aula, detalhe: `${x.curso} · ${numero(x.respostas)} respostas`, valor: x.erros }))} vazio="Sem respostas registradas ainda." /> : <Esqueleto />}
        </Cartao>
        <Cartao titulo="Penas gastas" descricao="Onde as pessoas perdem penas">
          {d ? <Ranking cor={2} itens={d.penasPorAula.map((x) => ({ chave: x.id, nome: x.aula, detalhe: x.curso, valor: x.penas }))} vazio="Nenhuma pena gasta com a aula registrada ainda." /> : <Esqueleto />}
        </Cartao>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
        <Cartao
          titulo="Onde as pessoas param"
          descricao={funil.dados ? `${numero(funil.dados.inscritos)} inscritos no curso` : "De cada aula, quantos terminaram"}
          acoes={
            cursos.dados && cursos.dados.length > 1 ? (
              <Escolha value={cursoAtivo} onChange={(e) => setCurso(e.target.value)} className="h-8 w-auto text-xs" aria-label="Curso">
                {cursos.dados.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Escolha>
            ) : undefined
          }
          atualizando={funil.atualizando}
        >
          {funil.dados ? <FunilDoCurso f={funil.dados} /> : <Esqueleto linhas={6} />}
        </Cartao>
        <Cartao titulo="Questões que mais derrubam" descricao="Taxa de acerto das questões com 5 respostas ou mais. Abaixo de 30%, costuma ser gabarito errado." atualizando={questoes.atualizando}>
          {questoes.dados ? <Questoes q={questoes.dados} /> : <Esqueleto linhas={6} />}
        </Cartao>
      </div>
    </section>
  );
}

function FunilDoCurso({ f }: { f: Funil }) {
  if (!f.aulas.length) return <p className="py-6 text-center text-sm text-muted-foreground">Este curso ainda não tem aulas.</p>;
  const base = Math.max(1, f.inscritos, ...f.aulas.map((a) => a.comecaram));
  return (
    <ol className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
      {f.aulas.map((a, i) => (
        <li key={a.id} className="grid grid-cols-[1.4rem_1fr_auto] items-center gap-2 text-xs">
          <span className="text-right font-bold text-muted-foreground tabular-nums">{i + 1}</span>
          <div className="min-w-0">
            <p className="truncate font-bold" title={`${a.unidade} · ${a.aula}`}>{a.aula}</p>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${(a.terminaram / base) * 100}%`, background: "var(--viz-1)" }} />
            </div>
          </div>
          <span className="w-16 text-right tabular-nums"><b>{numero(a.terminaram)}</b> <span className="text-muted-foreground">/ {numero(a.comecaram)}</span></span>
        </li>
      ))}
    </ol>
  );
}

function Questoes({ q }: { q: DesempenhoDeQuestao[] }) {
  if (!q.length) return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há questões com respostas suficientes. As respostas começaram a ser registradas com o administrativo novo.</p>;
  return (
    <ul className="max-h-80 divide-y overflow-y-auto">
      {q.slice(0, 20).map((x) => (
        <li key={x.id} className="flex items-center gap-3 py-2">
          <span className={cn("w-12 shrink-0 text-right text-sm font-black tabular-nums", x.taxa < 30 ? "text-rose-600 dark:text-rose-400" : x.taxa < 50 ? "text-amber-600 dark:text-amber-400" : "")}>{porcento(x.taxa, 0)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{x.pergunta}</p>
            <p className="truncate text-xs text-muted-foreground">{x.curso} · {x.aula} · {numero(x.respostas)} respostas</p>
          </div>
          {x.taxa < 30 && <Selo tom="vermelho">gabarito?</Selo>}
          <Link href={`/admin/conteudo/aula/${x.aulaId}?questao=${x.id}`} className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10">Abrir</Link>
        </li>
      ))}
    </ul>
  );
}

// ── Economia ─────────────────────────────────────────────────────────────

function ParteDeEconomia({ periodo }: { periodo: Periodo }) {
  const e = useDados<VisaoEconomia>(`/admin/visao/economia?periodo=${periodo}`);
  const d = e.dados;
  return (
    <section>
      <TituloDaParte id="economia">Economia de rupees</TituloDaParte>
      {e.erro && <Erro tentarDeNovo={e.recarregar}>{e.erro}</Erro>}
      <Grade className="xl:grid-cols-3">
        <BlocoNumero rotulo="Rupees ganhas" carregando={!d} valor={compacto(d?.ganhas.atual)} variacao={d?.ganhas.variacao} icone={<Gem className="size-4" />} />
        <BlocoNumero rotulo="Rupees gastas" carregando={!d} valor={compacto(d?.gastas.atual)} variacao={d?.gastas.variacao} icone={<Gem className="size-4" />} />
        <BlocoNumero rotulo="Saldo de quem está ativo" carregando={!d} valor={d ? `${numero(d.saldo.mediana)}` : "—"} nota={d && `mediana · média ${numero(d.saldo.media)}`} icone={<Gem className="size-4" />} />
      </Grade>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Cartao titulo="Ganhas e gastas por dia" atualizando={e.atualizando}>
          {d ? <GraficoDeLinhas dados={d.serie} series={[{ chave: "ganhas", nome: "Ganhas", cor: 1 }, { chave: "gastas", nome: "Gastas", cor: 2 }]} rotuloX={rotuloDoDia} /> : <Esqueleto linhas={6} />}
        </Cartao>
        <Cartao titulo="Mais vendidos" descricao="Itens de efeito e cosméticos">
          {d ? (
            <Ranking
              itens={d.maisVendidos.map((v) => ({ chave: `${v.tipo}-${v.item}`, nome: v.item, detalhe: `${v.tipo === "cosmetico" ? "Cosmético" : "Item"} · ${numero(v.rupees)} rupees`, valor: v.compras }))}
              vazio="Nenhuma compra no período."
            />
          ) : <Esqueleto />}
        </Cartao>
      </div>
    </section>
  );
}

// ── PRO ──────────────────────────────────────────────────────────────────

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function ParteDoPro() {
  const r = useDados<VisaoPro>("/admin/visao/pro");
  const d = r.dados;
  return (
    <section>
      <TituloDaParte id="pro" nota={d?.historicoDesde ? `O histórico de assinaturas é registrado desde ${dia(d.historicoDesde.slice(0, 10), { day: "2-digit", month: "short", year: "numeric" })}.` : "O histórico de testes, conversões e cancelamentos começa a ser registrado agora."}>PRO</TituloDaParte>
      {r.erro && <Erro tentarDeNovo={r.recarregar}>{r.erro}</Erro>}
      <Grade>
        <BlocoNumero rotulo="Pagantes" carregando={!d} valor={numero(d?.pagantes)} nota={d && `${numero(d.porPlano.mensal)} mensal · ${numero(d.porPlano.anual)} anual`} icone={<Crown className="size-4" />} />
        <BlocoNumero rotulo="Em teste" carregando={!d} valor={numero(d?.emTeste)} nota={d && `${numero(d.cortesia)} com cortesia`} icone={<Sparkles className="size-4" />} />
        <BlocoNumero
          rotulo="Receita mensal estimada"
          carregando={!d}
          valor={reais(d?.receitaMensalEstimada)}
          nota={d && (d.precos.fonte === "stripe" ? "preços do Stripe" : "preços padrão da tela")}
          icone={<Gem className="size-4" />}
        />
        <BlocoNumero
          rotulo="Conversão do teste"
          carregando={!d}
          valor={d?.conversaoDoTeste === null || d?.conversaoDoTeste === undefined ? "—" : porcento(d.conversaoDoTeste)}
          nota={d && `${numero(d.cancelandoNoFim)} cancelando · ${numero(d.atrasados)} com pagamento atrasado`}
          icone={<Target className="size-4" />}
        />
      </Grade>
      <Cartao className="mt-3" titulo="Por mês" descricao="Testes começados, conversões em pagante e cancelamentos">
        {d ? (
          d.porMes.length ? (
            <GraficoDeColunas
              rotulo="Mês"
              dados={d.porMes.map((m) => ({ rotulo: `${MESES[Number(m.mes.slice(5, 7)) - 1]}/${m.mes.slice(2, 4)}`, testes: m.testes, conversoes: m.conversoes, cancelamentos: m.cancelamentos }))}
              series={[{ chave: "testes", nome: "Testes", cor: 1 }, { chave: "conversoes", nome: "Conversões", cor: 3 }, { chave: "cancelamentos", nome: "Cancelamentos", cor: 2 }]}
            />
          ) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento de assinatura registrado ainda.</p>
        ) : <Esqueleto linhas={6} />}
      </Cartao>
    </section>
  );
}

// ── Engajamento ──────────────────────────────────────────────────────────

function ParteDeEngajamento({ periodo }: { periodo: Periodo }) {
  const e = useDados<VisaoEngajamento>(`/admin/visao/engajamento?periodo=${periodo}`);
  const d = e.dados;
  return (
    <section>
      <TituloDaParte id="engajamento">Engajamento</TituloDaParte>
      {e.erro && <Erro tentarDeNovo={e.recarregar}>{e.erro}</Erro>}
      <Grade>
        <BlocoNumero rotulo="Metas resgatadas" carregando={!d} valor={compacto(d?.metas.atual)} variacao={d?.metas.variacao} icone={<Target className="size-4" />} />
        <BlocoNumero rotulo="Barris abertos" carregando={!d} valor={compacto(d?.barris.atual)} variacao={d?.barris.variacao} icone={<Gem className="size-4" />} />
        <BlocoNumero rotulo="Projetos no playground" carregando={!d} valor={compacto(d?.projetos.atual)} variacao={d?.projetos.variacao} icone={<BookOpen className="size-4" />} />
        <BlocoNumero rotulo="Projetos compartilhados" carregando={!d} valor={compacto(d?.projetosCompartilhados)} nota="no total, com link público" icone={<UsersRound className="size-4" />} />
      </Grade>
      <Cartao className="mt-3" titulo="Por dia" atualizando={e.atualizando}>
        {d ? (
          <GraficoDeLinhas
            dados={d.serie}
            series={[{ chave: "barris", nome: "Barris", cor: 1 }, { chave: "metas", nome: "Metas", cor: 2 }, { chave: "projetos", nome: "Projetos", cor: 3 }]}
            rotuloX={rotuloDoDia}
          />
        ) : <Esqueleto linhas={6} />}
      </Cartao>
    </section>
  );
}
