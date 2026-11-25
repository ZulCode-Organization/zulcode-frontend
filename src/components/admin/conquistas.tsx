"use client";

import { useState } from "react";
import { Medal, Pencil, Plus, Trash2, X } from "lucide-react";
import { Pagina } from "./shell";
import { Botao, Cabecalho, Entrada, Erro, Escolha, Esqueleto, Interruptor, Rotulo, Selo, Vazio } from "./ui";
import { Dialogo, perguntar } from "./dialogo";
import { avisar } from "./avisos";
import { EscolhaDeCosmetico } from "./pessoas/presentes";
import { estiloDaConquista } from "@/lib/conquistas-icones";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { ConquistaDoAdmin, TipoDeConquista } from "@/lib/admin/tipos";

const CHAVE = "/admin/conquistas";

export const TIPOS: { valor: TipoDeConquista; nome: string; alvo: string }[] = [
  { valor: "lessons", nome: "Aulas concluídas", alvo: "aulas" },
  { valor: "perfectLessons", nome: "Aulas sem errar (nota 100)", alvo: "aulas perfeitas" },
  { valor: "units", nome: "Unidades completas", alvo: "unidades" },
  { valor: "xp", nome: "XP total", alvo: "XP" },
  { valor: "rank", nome: "Nível", alvo: "nível" },
  { valor: "streak", nome: "Ofensiva (maior sequência)", alvo: "dias" },
  { valor: "studyDays", nome: "Dias de estudo (no total)", alvo: "dias" },
  { valor: "coins", nome: "Rupees guardadas", alvo: "rupees" },
  { valor: "cosmetics", nome: "Cosméticos que tem", alvo: "cosméticos" },
  { valor: "shields", nome: "Escudos de pena guardados", alvo: "escudos" },
  { valor: "doubleCoins", nome: "Estar com rupees em dobro", alvo: "vez" },
  { valor: "manual", nome: "Manual (a equipe dá pela ficha)", alvo: "" },
];

/** O começo do id escolhe o desenho (estiloDaConquista, no app). */
const FAMILIAS: { prefixo: string; nome: string }[] = [
  { prefixo: "lesson-", nome: "Livro (aulas)" },
  { prefixo: "perfect-", nome: "Alvo (perfeição)" },
  { prefixo: "unit-", nome: "Camadas (unidades)" },
  { prefixo: "xp-", nome: "Raio (XP)" },
  { prefixo: "rank-", nome: "Troféu (nível)" },
  { prefixo: "streak-", nome: "Chama (ofensiva)" },
  { prefixo: "study-", nome: "Calendário (estudo)" },
  { prefixo: "consistency-", nome: "Relógio (constância)" },
  { prefixo: "coins-", nome: "Rupee" },
  { prefixo: "avatar-", nome: "Pessoa (avatares)" },
  { prefixo: "banner-", nome: "Imagem (banners)" },
  { prefixo: "limited-", nome: "Joia (edição limitada)" },
  { prefixo: "secret-", nome: "Chave (secreta)" },
  { prefixo: "goal-", nome: "Brilho (metas)" },
];

function Icone({ id, className }: { id: string; className?: string }) {
  const { Icone: Desenho, cor, fundo } = estiloDaConquista(id);
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", fundo, className)}>
      <Desenho className={cn("size-5", cor)} strokeWidth={2.4} />
    </span>
  );
}

/**
 * As conquistas do app: o que medem, a meta, o prêmio e quantas pessoas já
 * ganharam. As automáticas desbloqueiam sozinhas quando a pessoa chega na meta;
 * as manuais a equipe dá pela ficha (Presentes → Conquista).
 */
export function AdminConquistas() {
  const { dados, erro, carregando, recarregar } = useDados<ConquistaDoAdmin[]>(CHAVE);
  const [editando, setEditando] = useState<ConquistaDoAdmin | "nova" | null>(null);

  const apagar = async (c: ConquistaDoAdmin) => {
    const aviso = c.ganhadores ? ` Ela some do perfil de ${numero(c.ganhadores)} ${c.ganhadores === 1 ? "pessoa" : "pessoas"} (o prêmio que ganharam fica).` : "";
    if (!(await perguntar({ titulo: `Apagar "${c.title}"?`, texto: `Não tem como desfazer.${aviso}`, sim: "Apagar", perigoso: true }))) return;
    try {
      await pedir(`${CHAVE}/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      invalidar(CHAVE);
      avisar("Conquista apagada.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível apagar.", { tom: "erro" });
    }
  };

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Conquistas"
        descricao="Crie e ajuste as conquistas sem mexer no código. As automáticas desbloqueiam sozinhas quando a pessoa chega na meta."
        acoes={<Botao variante="primario" icone={<Plus className="size-4" />} onClick={() => setEditando("nova")}>Nova conquista</Botao>}
      />
      {erro && !dados && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!dados && carregando && <Esqueleto linhas={8} />}
      {dados && dados.length === 0 && <Vazio titulo="Nenhuma conquista" icone={<Medal className="size-5" />}>Crie a primeira no botão acima.</Vazio>}
      {dados && dados.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {dados.map((c) => {
            const tipo = TIPOS.find((t) => t.valor === c.criteria.type);
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Icone id={c.id} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-black">
                    {c.title}
                    {c.isSecret && <Selo tom="neutro">Secreta</Selo>}
                    {!c.isPublic && <Selo tom="neutro">Escondida</Selo>}
                    {c.criteria.type === "manual" && <Selo tom="azul">Manual</Selo>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.description}
                    {tipo && c.criteria.type !== "manual" ? ` · ${tipo.nome}: ${numero(c.criteria.target ?? 1)}` : ""}
                    {c.reward.coins ? ` · ${numero(c.reward.coins)} rupees` : ""}
                    {c.reward.cosmetics?.length ? ` · ${c.reward.cosmetics.length} cosmético(s)` : ""}
                  </p>
                </div>
                <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">
                  {numero(c.ganhadores)}{c.maxWinners ? ` / ${numero(c.maxWinners)}` : ""} {c.ganhadores === 1 ? "ganhou" : "ganharam"}
                </span>
                <Botao tamanho="sm" variante="fantasma" icone={<Pencil className="size-4" />} aria-label={`Editar ${c.title}`} onClick={() => setEditando(c)} />
                <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-4" />} aria-label={`Apagar ${c.title}`} onClick={() => void apagar(c)} />
              </li>
            );
          })}
        </ul>
      )}
      {editando && <FormularioDaConquista conquista={editando === "nova" ? null : editando} aoFechar={() => setEditando(null)} />}
    </Pagina>
  );
}

function FormularioDaConquista({ conquista, aoFechar }: { conquista: ConquistaDoAdmin | null; aoFechar: () => void }) {
  const [familia, setFamilia] = useState(FAMILIAS[0].prefixo);
  const [slug, setSlug] = useState("");
  const [f, setF] = useState({
    titulo: conquista?.title ?? "",
    descricao: conquista?.description ?? "",
    tipo: (conquista?.criteria.type ?? "lessons") as TipoDeConquista,
    alvo: String(conquista?.criteria.target ?? 10),
    rupees: String(conquista?.reward.coins ?? 0),
    cosmeticos: conquista?.reward.cosmetics ?? [],
    ordem: String(conquista?.order ?? 0),
    publica: conquista?.isPublic ?? true,
    secreta: conquista?.isSecret ?? false,
    maxGanhadores: conquista?.maxWinners ? String(conquista.maxWinners) : "",
  });
  const [escolhendo, setEscolhendo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const mudar = (parte: Partial<typeof f>) => setF((x) => ({ ...x, ...parte }));
  const n = (v: string) => Math.trunc(Number(v) || 0);
  const id = conquista?.id ?? `${familia}${slug}`;
  const tipo = TIPOS.find((t) => t.valor === f.tipo);

  const salvar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const corpo = {
        ...(conquista ? {} : { id }),
        titulo: f.titulo, descricao: f.descricao, tipo: f.tipo, alvo: Math.max(1, n(f.alvo)), rupees: n(f.rupees),
        cosmeticos: f.cosmeticos, ordem: n(f.ordem), publica: f.publica, secreta: f.secreta,
        maxGanhadores: f.maxGanhadores ? Math.max(1, n(f.maxGanhadores)) : null,
      };
      await pedir(conquista ? `${CHAVE}/${encodeURIComponent(conquista.id)}` : CHAVE, { method: conquista ? "PATCH" : "POST", json: corpo });
      invalidar(CHAVE);
      avisar(conquista ? "Conquista salva." : "Conquista criada.");
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
      titulo={conquista ? "Editar conquista" : "Nova conquista"}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={enviando} disabled={!f.titulo.trim() || (!conquista && slug.length < 2)} onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <Icone id={id} />
          <div className="min-w-0">
            <p className="truncate font-black">{f.titulo || "Título da conquista"}</p>
            <p className="truncate text-xs text-muted-foreground">{f.descricao || "Descrição"}</p>
          </div>
        </div>

        {conquista ? (
          <p className="text-xs text-muted-foreground">Id: <code className="rounded bg-muted px-1">{conquista.id}</code> (não muda depois de criada)</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Rotulo texto="Desenho" dica="O ícone vem do começo do id.">
              <Escolha value={familia} onChange={(e) => setFamilia(e.target.value)}>
                {FAMILIAS.map((x) => <option key={x.prefixo} value={x.prefixo}>{x.nome}</option>)}
              </Escolha>
            </Rotulo>
            <Rotulo texto="Id" dica={<>Fica <code>{familia}{slug || "…"}</code></>}>
              <Entrada value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={40} placeholder="natal-2026" className="font-mono" />
            </Rotulo>
          </div>
        )}

        <Rotulo texto="Título"><Entrada value={f.titulo} onChange={(e) => mudar({ titulo: e.target.value })} maxLength={80} /></Rotulo>
        <Rotulo texto="Descrição"><Entrada value={f.descricao} onChange={(e) => mudar({ descricao: e.target.value })} maxLength={300} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="O que mede">
            <Escolha value={f.tipo} onChange={(e) => mudar({ tipo: e.target.value as TipoDeConquista })}>
              {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.nome}</option>)}
            </Escolha>
          </Rotulo>
          {f.tipo !== "manual" && (
            <Rotulo texto={`Meta${tipo?.alvo ? ` (${tipo.alvo})` : ""}`}>
              <Entrada inputMode="numeric" value={f.alvo} onChange={(e) => mudar({ alvo: e.target.value.replace(/\D/g, "") })} />
            </Rotulo>
          )}
        </div>

        <p className="pt-1 text-xs font-black uppercase tracking-wide text-muted-foreground">Prêmio</p>
        <Rotulo texto="Rupees"><Entrada inputMode="numeric" value={f.rupees} onChange={(e) => mudar({ rupees: e.target.value.replace(/\D/g, "") })} /></Rotulo>
        {f.cosmeticos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.cosmeticos.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-bold">
                {c}
                <button type="button" aria-label={`Tirar ${c}`} onClick={() => mudar({ cosmeticos: f.cosmeticos.filter((x) => x !== c) })}><X className="size-3" /></button>
              </span>
            ))}
          </div>
        )}
        {f.cosmeticos.length < 5 && (
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1"><EscolhaDeCosmetico valor={escolhendo} aoMudar={setEscolhendo} opcional /></div>
            <Botao disabled={!escolhendo || f.cosmeticos.includes(escolhendo)} onClick={() => { mudar({ cosmeticos: [...f.cosmeticos, escolhendo] }); setEscolhendo(""); }}>Adicionar</Botao>
          </div>
        )}

        <p className="pt-1 text-xs font-black uppercase tracking-wide text-muted-foreground">Exibição</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Ordem" dica="Menor aparece antes."><Entrada inputMode="numeric" value={f.ordem} onChange={(e) => mudar({ ordem: e.target.value.replace(/[^\d-]/g, "") })} /></Rotulo>
          <Rotulo texto="Máximo de ganhadores" dica="Vazio = sem limite."><Entrada inputMode="numeric" value={f.maxGanhadores} onChange={(e) => mudar({ maxGanhadores: e.target.value.replace(/\D/g, "") })} placeholder="Sem limite" /></Rotulo>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div><p className="text-sm font-black">Aparece na lista de missões</p><p className="text-xs text-muted-foreground">Desligada, ainda pode ser ganha, mas não aparece antes.</p></div>
          <Interruptor ligado={f.publica} aoMudar={(publica) => mudar({ publica })} rotulo="Aparece na lista" />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div><p className="text-sm font-black">Secreta</p><p className="text-xs text-muted-foreground">Só aparece depois de ganha.</p></div>
          <Interruptor ligado={f.secreta} aoMudar={(secreta) => mudar({ secreta })} rotulo="Secreta" />
        </div>
        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
