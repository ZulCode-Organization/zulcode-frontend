"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, PartyPopper, Zap } from "lucide-react";
import { Rupee } from "@/components/shared/rupee";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { AvatarComMoldura } from "@/components/shared/avatar-com-moldura";
import { corDoAvatar } from "@/lib/avatares";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { envelhecerGuardado, mudarGuardado, useDadosGuardados } from "@/lib/dados-guardados";
import { cn } from "@/lib/utils";

type CosmeticoDoPremio = { id: string; name: string; kind: string; value: { avatarId?: string; molduraId?: string; gradient?: string; background?: string; imageUrl?: string } };

export type EventoDaHome = {
  id: string;
  nome: string;
  descricao: string;
  inicio: string;
  fim: string;
  /** Falso quando já acabou, mas a pessoa bateu a meta e ainda pode resgatar. */
  acontecendo: boolean;
  xpEmDobro: boolean;
  metaTipo: "aulas" | "xp";
  metaAlvo: number;
  feito: number;
  resgatado: boolean;
  podeResgatar: boolean;
  premio: { rupees: number; diasPro: number; cosmetico: CosmeticoDoPremio | null };
};

type Entregue = { rupees: number; diasPro: number; cosmetico: string | null };

const CHAVE = "evento";
const DIA = 86_400_000;
/** Depois do fim, quem bateu a meta ainda tem uma semana para resgatar (o mesmo prazo do servidor). */
const PRAZO_PARA_RESGATAR = 7 * DIA;

async function buscarEvento(token: string): Promise<EventoDaHome | null> {
  const res = await fetchComTimeout(`${API_BASE_URL}/eventos/atual`, { headers: { Authorization: `Bearer ${token}` } });
  // Servidor ainda sem a rota (antes do deploy): o mesmo que não ter evento.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao carregar o evento");
  // Sem evento, o servidor responde vazio.
  const texto = await res.text();
  return texto ? (JSON.parse(texto) as EventoDaHome) : null;
}

function quandoAcaba(evento: EventoDaHome, agora: number) {
  const fim = new Date(evento.fim).getTime();
  if (!evento.acontecendo || fim <= agora) {
    const ate = new Date(fim + PRAZO_PARA_RESGATAR).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `Acabou · resgate até ${ate}`;
  }
  const horas = Math.floor((fim - agora) / 3_600_000);
  if (horas < 1) return "Termina em minutos";
  if (horas < 24) return `Termina em ${horas} h`;
  const dias = Math.round((fim - agora) / DIA);
  return `Termina em ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function textoDoEntregue(e: Entregue) {
  const partes = [
    e.rupees ? `${e.rupees} rupees` : "",
    e.diasPro ? `${e.diasPro} ${e.diasPro === 1 ? "dia" : "dias"} de PRO` : "",
    e.cosmetico ? `"${e.cosmetico}"` : "",
  ].filter(Boolean);
  if (!partes.length) return "Prêmios resgatados!";
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}` : partes[0];
  return `Você ganhou ${lista}!`;
}

function AmostraDoCosmetico({ c }: { c: CosmeticoDoPremio }) {
  if (c.kind === "AVATAR") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: corDoAvatar(c.value.avatarId) }}>
        <AvatarIcon id={c.value.avatarId} />
      </span>
    );
  }
  if (c.kind === "FRAME") {
    return (
      <span className="grid size-7 shrink-0 place-items-center">
        <AvatarComMoldura avatarId="capivara" molduraId={c.value.molduraId} capa="#1892ff" animar={false} className="size-4 rounded-[5px]" />
      </span>
    );
  }
  return (
    <span
      className="h-6 w-10 shrink-0 rounded-md border border-border"
      style={{ background: c.value.imageUrl ? `url(${c.value.imageUrl}) center / cover` : c.value.gradient ?? "#22c55e" }}
    />
  );
}

/**
 * O evento da vez, na home: o nome, quanto falta, a meta com o progresso da
 * pessoa dentro da janela do evento e os prêmios. Batida a meta, o botão
 * resgata tudo de uma vez. Sem evento, não ocupa espaço nenhum.
 */
export function EventoCard({ className }: { className?: string }) {
  const { dados: evento } = useDadosGuardados(CHAVE, buscarEvento, 60_000);
  const { retry } = usePerfil();
  const [agora, setAgora] = useState(() => Date.now());
  const [resgatando, setResgatando] = useState(false);
  const [entregue, setEntregue] = useState<Entregue | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!evento) return null;

  const { premio } = evento;
  const percentual = evento.metaAlvo > 0 ? Math.min(100, Math.round((evento.feito / evento.metaAlvo) * 100)) : 0;
  const unidade = evento.metaTipo === "xp" ? "XP" : evento.metaAlvo === 1 ? "aula" : "aulas";
  const temPremio = premio.rupees > 0 || premio.diasPro > 0 || !!premio.cosmetico;

  const resgatar = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setResgatando(true);
    setErro("");
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/eventos/${encodeURIComponent(evento.id)}/resgatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const corpo: Partial<Entregue> & { message?: string | string[] } = await res.json().catch(() => ({}));
      if (!res.ok) {
        const mensagem = Array.isArray(corpo.message) ? corpo.message[0] : corpo.message;
        setErro(res.status < 500 && mensagem ? mensagem : "Não foi possível resgatar agora. Tente de novo.");
        return;
      }
      setEntregue({ rupees: corpo.rupees ?? 0, diasPro: corpo.diasPro ?? 0, cosmetico: corpo.cosmetico ?? null });
      mudarGuardado<EventoDaHome | null>(CHAVE, (atual) => (atual ? { ...atual, resgatado: true, podeResgatar: false } : null));
      // Rupees e PRO aparecem na barra de cima; o cosmético, na loja.
      limparPerfilCache();
      retry();
      envelhecerGuardado("loja");
    } catch {
      setErro("Sem conexão. Tente de novo quando a internet voltar.");
    } finally {
      setResgatando(false);
    }
  };

  return (
    <section aria-label={`Evento: ${evento.nome}`} className={cn("animate-fade-in-up overflow-hidden rounded-[20px] border border-border bg-card", className)}>
      <div className="p-5 text-white" style={{ background: "linear-gradient(120deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)" }}>
        <p className="flex items-center gap-1.5 text-[0.7rem] font-black uppercase tracking-[0.08em] text-white/85">
          <PartyPopper className="size-4" /> Evento · {quandoAcaba(evento, agora)}
        </p>
        <h3 className="mt-2 text-[1.25rem] font-black leading-tight">{evento.nome}</h3>
        {evento.descricao && <p className="mt-1 text-[0.85rem] leading-snug text-white/85">{evento.descricao}</p>}
        {evento.xpEmDobro && evento.acontecendo && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.05em]">
            <Zap className="size-3.5" /> XP em dobro para todos
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-black">Meta: {evento.metaAlvo.toLocaleString("pt-BR")} {unidade}</span>
            <span className="font-bold text-muted-foreground">
              {evento.feito.toLocaleString("pt-BR")}/{evento.metaAlvo.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percentual} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso na meta do evento">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${percentual}%` }} />
          </div>
        </div>

        {temPremio && (
          <div className="flex flex-wrap items-center gap-2 text-[0.8rem] font-bold">
            <span className="text-muted-foreground">Prêmio:</span>
            {premio.rupees > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Rupee className="size-4 text-emerald-500" /> {premio.rupees.toLocaleString("pt-BR")}
              </span>
            )}
            {premio.diasPro > 0 && (
              <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-600 dark:text-violet-300">
                {premio.diasPro} {premio.diasPro === 1 ? "dia" : "dias"} de PRO
              </span>
            )}
            {premio.cosmetico && (
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-muted py-0.5 pl-0.5 pr-2.5">
                <AmostraDoCosmetico c={premio.cosmetico} />
                <span className="truncate">{premio.cosmetico.name}</span>
              </span>
            )}
          </div>
        )}

        {entregue ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/12 px-3.5 py-2.5 text-sm font-black text-emerald-700 dark:text-emerald-300">
            <Check className="size-4 shrink-0" strokeWidth={3} /> {textoDoEntregue(entregue)}
          </p>
        ) : evento.resgatado ? (
          <p className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" strokeWidth={3} /> Prêmios resgatados
          </p>
        ) : evento.podeResgatar ? (
          <button
            type="button"
            onClick={() => void resgatar()}
            disabled={resgatando}
            className="zc-press flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.05em] text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
          >
            {resgatando && <Loader2 className="size-4 animate-spin" />}
            {temPremio ? "Resgatar prêmios" : "Concluir evento"}
          </button>
        ) : (
          <p className="text-[0.8rem] leading-snug text-muted-foreground">
            {evento.metaTipo === "xp" ? "Todo XP ganho durante o evento conta." : "Cada aula concluída durante o evento conta."}
          </p>
        )}
        {erro && <p role="alert" className="text-sm font-bold text-destructive">{erro}</p>}
      </div>
    </section>
  );
}
