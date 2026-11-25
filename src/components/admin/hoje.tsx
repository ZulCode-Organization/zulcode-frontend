"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenCheck, Crown, Gem, GraduationCap, ShieldCheck, ShoppingBag, Sparkles, Trophy, UserPlus, Users } from "lucide-react";
import { Pagina } from "./shell";
import { AvatarPequeno, BlocoNumero, Botao, Cabecalho, Erro, Esqueleto, Segmentado, Vazio } from "./ui";
import { pedir, query, useDados } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { TEXTO_DA_ACAO } from "@/lib/admin/textos";
import { cn } from "@/lib/utils";
import type { EventoDeHoje, Hoje, TipoDeEventoDeHoje } from "@/lib/admin/tipos";

type Filtro = "" | TipoDeEventoDeHoje;

const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: "", texto: "Tudo" },
  { valor: "cadastro", texto: "Cadastros" },
  { valor: "licao", texto: "Aulas" },
  { valor: "compra", texto: "Compras" },
  { valor: "conquista", texto: "Conquistas" },
  { valor: "assinatura", texto: "PRO" },
  { valor: "equipe", texto: "Equipe" },
];

const ICONE: Record<TipoDeEventoDeHoje, { Icone: typeof UserPlus; cor: string }> = {
  cadastro: { Icone: UserPlus, cor: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  licao: { Icone: BookOpenCheck, cor: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  compra: { Icone: ShoppingBag, cor: "bg-amber-500/12 text-amber-600 dark:text-amber-400" },
  conquista: { Icone: Trophy, cor: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
  assinatura: { Icone: Crown, cor: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400" },
  equipe: { Icone: ShieldCheck, cor: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
};

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * O que aconteceu hoje (dia de Brasília): os números do dia e uma linha do
 * tempo de tudo, do mais recente para o mais antigo — quem se cadastrou, quem
 * estudou, compras, conquistas, PRO e o que a equipe fez.
 */
export function AdminHoje() {
  const [filtro, setFiltro] = useState<Filtro>("");
  const endereco = `/admin/visao/hoje${query({ tipo: filtro })}`;
  const { dados, erro, carregando, atualizando, recarregar } = useDados<Hoje>(endereco, { velhoDepoisDe: 20_000 });

  // As páginas seguintes ("carregar mais") ficam guardadas por filtro.
  const [mais, setMais] = useState<{ chave: string; eventos: EventoDeHoje[]; proximo: string | null } | null>(null);
  const [buscandoMais, setBuscandoMais] = useState(false);
  const extras = mais?.chave === endereco ? mais : null;
  const eventos = [...(dados?.eventos ?? []), ...(extras?.eventos ?? [])];
  const proximo = extras ? extras.proximo : dados?.proximo ?? null;

  const carregarMais = async () => {
    if (!proximo) return;
    setBuscandoMais(true);
    try {
      const pagina = await pedir<Hoje>(`/admin/visao/hoje${query({ tipo: filtro, antes: proximo })}`);
      setMais({ chave: endereco, eventos: [...(extras?.eventos ?? []), ...pagina.eventos], proximo: pagina.proximo });
    } finally {
      setBuscandoMais(false);
    }
  };

  const r = dados?.resumo;
  return (
    <Pagina larga>
      <Cabecalho
        titulo="Hoje"
        descricao="Tudo o que aconteceu desde a meia-noite (horário de Brasília), do mais recente para o mais antigo."
        acoes={<Botao onClick={() => { setMais(null); recarregar(); }} carregando={atualizando}>Atualizar</Botao>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <BlocoNumero rotulo="Cadastros" valor={numero(r?.cadastros ?? 0)} icone={<UserPlus className="size-4" />} carregando={!r && carregando} />
        <BlocoNumero rotulo="Estudaram" valor={numero(r?.estudaram ?? 0)} nota={r ? `${numero(r.aulas)} aulas` : undefined} icone={<Users className="size-4" />} carregando={!r && carregando} />
        <BlocoNumero rotulo="XP ganho" valor={numero(r?.xp ?? 0)} icone={<GraduationCap className="size-4" />} carregando={!r && carregando} />
        <BlocoNumero
          rotulo="Rupees"
          valor={`+${numero(r?.rupeesGanhas ?? 0)}`}
          nota={r ? `−${numero(r.rupeesGastas)} gastas` : undefined}
          icone={<Gem className="size-4" />}
          carregando={!r && carregando}
        />
        <BlocoNumero rotulo="Compras na loja" valor={numero(r?.compras ?? 0)} icone={<ShoppingBag className="size-4" />} carregando={!r && carregando} />
        <BlocoNumero rotulo="Novos no PRO" valor={numero(r?.novosPro ?? 0)} nota={r ? `${numero(r.assinaturas)} eventos de assinatura` : undefined} icone={<Sparkles className="size-4" />} carregando={!r && carregando} />
      </div>

      <div className="mb-3 overflow-x-auto">
        <Segmentado<Filtro> rotulo="Mostrar" valor={filtro} aoMudar={setFiltro} opcoes={FILTROS} />
      </div>

      {erro && !dados && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}

      <div className={cn("overflow-hidden rounded-xl border bg-card transition-opacity", atualizando && "opacity-60")}>
        {!dados && carregando && <div className="p-4"><Esqueleto linhas={8} /></div>}
        {dados && eventos.length === 0 && (
          <Vazio titulo="Nada por aqui ainda hoje" icone={<BookOpenCheck className="size-5" />}>
            Quando alguém se cadastrar, estudar ou comprar algo, aparece aqui.
          </Vazio>
        )}
        <ol>
          {eventos.map((e, i) => (
            <LinhaDoEvento key={`${e.tipo}-${e.quando}-${i}`} evento={e} />
          ))}
        </ol>
      </div>

      {proximo && (
        <div className="mt-3 flex justify-center">
          <Botao onClick={carregarMais} carregando={buscandoMais}>Carregar mais</Botao>
        </div>
      )}
    </Pagina>
  );
}

function LinhaDoEvento({ evento: e }: { evento: EventoDeHoje }) {
  const { Icone, cor } = ICONE[e.tipo];
  const texto = e.tipo === "equipe" ? `${e.ator ?? "Alguém da equipe"} · ${TEXTO_DA_ACAO[e.texto] ?? e.texto.replaceAll("_", " ")}` : e.texto;
  return (
    <li className="flex items-start gap-3 border-b px-4 py-3 last:border-0">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", cor)}>
        <Icone className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {e.pessoa && e.tipo !== "equipe" && (
            <Link href={`/admin/pessoas/${e.pessoa.id}`} className="mr-1 inline-flex items-center gap-1.5 font-black hover:text-primary">
              <AvatarPequeno id={e.pessoa.avatarId} className="size-5 rounded-md text-[0.6rem]" />
              {e.pessoa.name}
            </Link>
          )}
          <span className={e.tipo === "equipe" ? "font-bold" : undefined}>{texto}</span>
          {e.pessoa && e.tipo === "equipe" && (
            <Link href={`/admin/pessoas/${e.pessoa.id}`} className="ml-1 font-black hover:text-primary">{e.pessoa.name}</Link>
          )}
        </p>
        {e.detalhe && <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.detalhe}</p>}
      </div>
      <time dateTime={e.quando} className="shrink-0 text-xs tabular-nums text-muted-foreground">{hora(e.quando)}</time>
    </li>
  );
}
