"use client";

import { useState } from "react";
import { CalendarHeart, Pencil, Plus, Trash2 } from "lucide-react";
import { Pagina } from "./shell";
import { AreaDeTexto, Botao, Cabecalho, Entrada, Erro, Escolha, Esqueleto, Interruptor, Rotulo, Selo, Vazio } from "./ui";
import { Dialogo, perguntar } from "./dialogo";
import { avisar } from "./avisos";
import { EscolhaDeCosmetico } from "./pessoas/presentes";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { dataHora, numero } from "@/lib/admin/formato";
import type { EventoDoAdmin } from "@/lib/admin/tipos";

const CHAVE = "/admin/eventos";

export const TEMAS_DOS_EVENTOS: { valor: string; nome: string }[] = [
  { valor: "", nome: "Não mexer no tema" },
  { valor: "halloween", nome: "Halloween" },
  { valor: "natal", nome: "Natal" },
  { valor: "carnaval", nome: "Carnaval" },
  { valor: "pascoa", nome: "Páscoa" },
  { valor: "programador", nome: "Dia do Programador" },
  { valor: "miami", nome: "Miami" },
  { valor: "doomsday", nome: "Doomsday" },
];

/** "2026-12-20T00:00:00.000Z" → "2026-12-19T21:00", no horário do navegador, para o campo datetime-local. */
export function paraCampoDeData(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
export const doCampoDeData = (valor: string) => (valor ? new Date(valor).toISOString() : null);

function situacao(e: EventoDoAdmin) {
  const agora = Date.now();
  if (!e.ativo) return { texto: "Desligado", tom: "neutro" as const };
  if (Date.parse(e.inicio) > agora) return { texto: "Agendado", tom: "azul" as const };
  if (Date.parse(e.fim) > agora) return { texto: "Acontecendo", tom: "verde" as const };
  return { texto: "Encerrado", tom: "neutro" as const };
}

/**
 * Eventos com data marcada: enquanto duram, ligam o tema escolhido (e o XP em
 * dobro, se marcado) e mostram um cartão na home com a meta. Quem bate a meta
 * resgata os prêmios: rupees, dias de PRO e um cosmético (inclusive exclusivo).
 */
export function AdminEventos() {
  const { dados, erro, carregando, recarregar } = useDados<EventoDoAdmin[]>(CHAVE);
  const [editando, setEditando] = useState<EventoDoAdmin | "novo" | null>(null);

  const apagar = async (e: EventoDoAdmin) => {
    if (!(await perguntar({ titulo: `Apagar "${e.nome}"?`, texto: "Quem já resgatou fica com os prêmios. O cartão some da home na hora.", sim: "Apagar", perigoso: true }))) return;
    try {
      await pedir(`${CHAVE}/${e.id}`, { method: "DELETE" });
      invalidar(CHAVE);
      avisar("Evento apagado.");
    } catch (err) {
      avisar(err instanceof Error ? err.message : "Não foi possível apagar.", { tom: "erro" });
    }
  };

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Eventos"
        descricao="Datas especiais: ligam o tema da barra sozinhas, mostram a meta na home e dão prêmios para quem cumprir."
        acoes={<Botao variante="primario" icone={<Plus className="size-4" />} onClick={() => setEditando("novo")}>Novo evento</Botao>}
      />
      {erro && !dados && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!dados && carregando && <Esqueleto linhas={5} />}
      {dados && dados.length === 0 && (
        <Vazio titulo="Nenhum evento ainda" icone={<CalendarHeart className="size-5" />} acao={<Botao onClick={() => setEditando("novo")}>Criar o primeiro</Botao>}>
          Que tal um evento de Natal com o tema ligado sozinho e um avatar exclusivo para quem fizer 10 aulas?
        </Vazio>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {dados?.map((e) => {
          const s = situacao(e);
          return (
            <article key={e.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">{dataHora(e.inicio)} → {dataHora(e.fim)}</p>
                </div>
                <Selo tom={s.tom}>{s.texto}</Selo>
              </div>
              {e.descricao && <p className="mt-2 text-sm text-muted-foreground">{e.descricao}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                <span className="rounded-md bg-muted px-2 py-0.5">Meta: {numero(e.metaAlvo)} {e.metaTipo === "xp" ? "XP" : "aulas"}</span>
                {e.tema && <span className="rounded-md bg-muted px-2 py-0.5">Tema: {TEMAS_DOS_EVENTOS.find((t) => t.valor === e.tema)?.nome ?? e.tema}</span>}
                {e.xpEmDobro && <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">XP em dobro</span>}
                {e.rupees > 0 && <span className="rounded-md bg-muted px-2 py-0.5">{numero(e.rupees)} rupees</span>}
                {e.diasPro > 0 && <span className="rounded-md bg-muted px-2 py-0.5">{e.diasPro} dias de PRO</span>}
                {e.cosmeticoId && <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-violet-700 dark:text-violet-300">Cosmético</span>}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground">{numero(e.resgates)} {e.resgates === 1 ? "resgate" : "resgates"}</span>
                <div className="flex gap-1">
                  <Botao tamanho="sm" variante="fantasma" icone={<Pencil className="size-4" />} onClick={() => setEditando(e)}>Editar</Botao>
                  <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-4" />} aria-label={`Apagar ${e.nome}`} onClick={() => void apagar(e)} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {editando && <FormularioDoEvento evento={editando === "novo" ? null : editando} aoFechar={() => setEditando(null)} />}
    </Pagina>
  );
}

function FormularioDoEvento({ evento, aoFechar }: { evento: EventoDoAdmin | null; aoFechar: () => void }) {
  // Só na montagem: um evento novo começa agora e acaba amanhã.
  const [f, setF] = useState(() => ({
    nome: evento?.nome ?? "",
    descricao: evento?.descricao ?? "",
    inicio: paraCampoDeData(evento?.inicio ?? new Date().toISOString()),
    fim: paraCampoDeData(evento?.fim ?? new Date(Date.now() + 86_400_000).toISOString()),
    tema: evento?.tema ?? "",
    xpEmDobro: evento?.xpEmDobro ?? false,
    metaTipo: evento?.metaTipo ?? "aulas",
    metaAlvo: String(evento?.metaAlvo ?? 10),
    rupees: String(evento?.rupees ?? 0),
    diasPro: String(evento?.diasPro ?? 0),
    cosmeticoId: evento?.cosmeticoId ?? "",
    ativo: evento?.ativo ?? true,
  }));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const mudar = (parte: Partial<typeof f>) => setF((x) => ({ ...x, ...parte }));
  const n = (v: string) => Math.trunc(Number(v) || 0);

  const salvar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const corpo = {
        nome: f.nome, descricao: f.descricao, inicio: doCampoDeData(f.inicio), fim: doCampoDeData(f.fim),
        tema: f.tema || null, xpEmDobro: f.xpEmDobro, metaTipo: f.metaTipo, metaAlvo: Math.max(1, n(f.metaAlvo)),
        rupees: n(f.rupees), diasPro: n(f.diasPro), cosmeticoId: f.cosmeticoId || null, ativo: f.ativo,
      };
      await pedir(evento ? `${CHAVE}/${evento.id}` : CHAVE, { method: evento ? "PATCH" : "POST", json: corpo });
      invalidar(CHAVE);
      avisar(evento ? "Evento salvo." : "Evento criado.");
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
      titulo={evento ? "Editar evento" : "Novo evento"}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={enviando} disabled={!f.nome.trim() || !f.inicio || !f.fim} onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <Rotulo texto="Nome"><Entrada value={f.nome} onChange={(e) => mudar({ nome: e.target.value })} maxLength={80} placeholder="Ex.: Natal do Zul" /></Rotulo>
        <Rotulo texto="Descrição" dica="Aparece no cartão da home."><AreaDeTexto value={f.descricao} onChange={(e) => mudar({ descricao: e.target.value })} maxLength={300} placeholder="Faça 10 aulas até o Natal e ganhe o gorro do Zul!" /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Começa em"><Entrada type="datetime-local" value={f.inicio} onChange={(e) => mudar({ inicio: e.target.value })} /></Rotulo>
          <Rotulo texto="Termina em"><Entrada type="datetime-local" value={f.fim} onChange={(e) => mudar({ fim: e.target.value })} /></Rotulo>
        </div>
        <Rotulo texto="Tema da barra durante o evento" dica="Liga sozinho no começo e volta ao normal no fim.">
          <Escolha value={f.tema} onChange={(e) => mudar({ tema: e.target.value })}>
            {TEMAS_DOS_EVENTOS.map((t) => <option key={t.valor} value={t.valor}>{t.nome}</option>)}
          </Escolha>
        </Rotulo>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-black">XP em dobro para todos</p>
            <p className="text-xs text-muted-foreground">Enquanto o evento durar.</p>
          </div>
          <Interruptor ligado={f.xpEmDobro} aoMudar={(xpEmDobro) => mudar({ xpEmDobro })} rotulo="XP em dobro para todos" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="A meta conta">
            <Escolha value={f.metaTipo} onChange={(e) => mudar({ metaTipo: e.target.value as "aulas" | "xp" })}>
              <option value="aulas">Aulas concluídas no evento</option>
              <option value="xp">XP ganho no evento</option>
            </Escolha>
          </Rotulo>
          <Rotulo texto="Quantas"><Entrada inputMode="numeric" value={f.metaAlvo} onChange={(e) => mudar({ metaAlvo: e.target.value.replace(/\D/g, "") })} /></Rotulo>
        </div>
        <p className="pt-1 text-xs font-black uppercase tracking-wide text-muted-foreground">Prêmios para quem bater a meta</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Rupees"><Entrada inputMode="numeric" value={f.rupees} onChange={(e) => mudar({ rupees: e.target.value.replace(/\D/g, "") })} /></Rotulo>
          <Rotulo texto="Dias de PRO" dica="Quem já paga o PRO fica sem esta parte."><Entrada inputMode="numeric" value={f.diasPro} onChange={(e) => mudar({ diasPro: e.target.value.replace(/\D/g, "") })} /></Rotulo>
        </div>
        <EscolhaDeCosmetico valor={f.cosmeticoId} aoMudar={(cosmeticoId) => mudar({ cosmeticoId })} opcional />
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <p className="text-sm font-black">Evento ligado</p>
          <Interruptor ligado={f.ativo} aoMudar={(ativo) => mudar({ ativo })} rotulo="Evento ligado" />
        </div>
        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
