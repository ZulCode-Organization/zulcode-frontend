"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Barrel, Feather, HeartPulse, Loader2, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { Rupee } from "@/components/shared/rupee";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { SeloPro } from "@/components/shared/selo-pro";
import { usePerfil } from "@/hooks/use-perfil";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { DIAS_DE_TESTE } from "@/lib/pro/planos";
import { cn } from "@/lib/utils";

type Efeito = "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP" | "FEATHER_SHIELD" | "DOUBLE_COINS" | "HEAL_ONE_LIFE";

interface ItemLoja {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: Efeito;
}

/** Cada efeito tem seu desenho e sua cor. O gás e o rupee são componentes
 * próprios, então o tipo aceita os dois formatos. */
const DESENHO: Record<Efeito, { Icone: LucideIcon | ((p: { className?: string }) => React.ReactElement); cor: string; fundo: string }> = {
  RECOVER_LIVES: { Icone: Feather, cor: "text-rose-500", fundo: "bg-rose-500/15" },
  HEAL_ONE_LIFE: { Icone: HeartPulse, cor: "text-rose-400", fundo: "bg-rose-500/15" },
  FEATHER_SHIELD: { Icone: ShieldCheck, cor: "text-sky-500", fundo: "bg-sky-500/15" },
  FREEZE_STREAK: { Icone: GasOfensiva, cor: "text-violet-500", fundo: "bg-violet-500/15" },
  DOUBLE_XP: { Icone: Zap, cor: "text-amber-500", fundo: "bg-amber-400/15" },
  DOUBLE_COINS: { Icone: Rupee, cor: "text-emerald-500", fundo: "bg-emerald-500/15" },
};

/** Em qual seção cada efeito aparece. Vem do que o item faz, e não de uma
 * lista fixa de ids: item novo criado pelo admin cai sozinho no lugar certo. */
const SECAO: Record<Efeito, "ofensiva" | "penas" | "poderes"> = {
  FREEZE_STREAK: "ofensiva",
  RECOVER_LIVES: "penas",
  HEAL_ONE_LIFE: "penas",
  FEATHER_SHIELD: "penas",
  DOUBLE_XP: "poderes",
  DOUBLE_COINS: "poderes",
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="mb-3 text-[0.95rem] font-black text-foreground">{titulo}</h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

/** Moldura comum de todo cartão da tela: ícone à esquerda, texto no meio e a
 * ação à direita (ou embaixo, quando é um botão largo). */
function Cartao({
  Icone,
  cor,
  fundo,
  titulo,
  descricao,
  acao,
}: {
  Icone: LucideIcon | ((p: { className?: string }) => React.ReactElement);
  cor: string;
  fundo: string;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-[18px] border border-border bg-card px-4 py-3.5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", fundo, cor)}>
        <Icone className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.92rem] font-black leading-snug text-foreground">{titulo}</p>
        <p className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground">{descricao}</p>
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

/** O preço vira botão. Sem saldo ele continua clicável de propósito: a recusa
 * com o número na frente ensina quanto falta, enquanto um botão morto só
 * deixa a pessoa sem saber por quê. */
function BotaoPreco({ preco, ocupado, onClick }: { preco: number; ocupado: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ocupado}
      className="zc-press flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-[0.82rem] font-black text-emerald-500 disabled:opacity-60"
    >
      {ocupado ? <Loader2 className="size-4 animate-spin" /> : <Rupee className="size-4" />}
      {preco}
    </button>
  );
}

/**
 * A tela das Rupees no celular.
 *
 * É a vitrine do que se compra com elas, em seções: o PRO, as metas que já
 * podem ser resgatadas, os barris, o gás da ofensiva, os superpoderes e as
 * penas. Os itens não são uma lista escrita aqui — vêm do mesmo
 * GET /user/zulcoins/items que a Loja usa, e cada um cai na seção pelo efeito
 * que tem. Assim um item criado no admin aparece aqui sozinho.
 *
 * A compra é o mesmo POST /user/zulcoins/spend da Loja, e o saldo é relido do
 * perfil depois — sem isso o número do topo continuaria mostrando o valor
 * antigo até a próxima navegação.
 */
export function PainelMoedas({ moedas, onNavegar }: { moedas: number | null; onNavegar?: () => void }) {
  // Silencioso: os chips da barra continuam com o número na tela e animam a
  // diferença quando a resposta chega, em vez de piscar "…".
  const { perfil, atualizar } = usePerfil();
  const { metas, resgatar } = useMetasDiarias();
  const [itens, setItens] = useState<ItemLoja[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [barril, setBarril] = useState<{ disponivel: boolean; rupees: number; proximoEm: string } | null>(null);

  const saldo = moedas ?? perfil?.moedas ?? 0;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    let valeu = true;
    const cabecalho = { Authorization: `Bearer ${token}` };
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers: cabecalho })
      .then((r) => (r.ok ? r.json() : []))
      .then((lista) => {
        if (valeu) setItens(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (valeu) setItens([]);
      });
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/barril`, { headers: cabecalho })
      .then((r) => (r.ok ? r.json() : null))
      .then((estado) => {
        if (valeu && estado) setBarril(estado);
      })
      .catch(() => {});
    return () => {
      valeu = false;
    };
  }, []);

  const comprar = async (item: ItemLoja) => {
    if (saldo < item.price) {
      setAviso({ texto: `Você tem ${saldo} Rupees e este item custa ${item.price}.`, erro: true });
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setOcupado(item.id);
    try {
      const resposta = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/spend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(corpo?.message ?? "Não foi possível comprar.");
      setAviso({ texto: corpo?.message ?? "Pronto, o benefício já está valendo." });
      atualizar();
    } catch (erro) {
      setAviso({ texto: erro instanceof Error ? erro.message : "Não foi possível comprar.", erro: true });
    } finally {
      setOcupado(null);
    }
  };

  const abrirBarril = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || ocupado) return;
    setOcupado("barril");
    try {
      const resposta = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/barril`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(corpo?.message ?? "Não foi possível abrir o barril.");
      setAviso({ texto: corpo?.message ?? "Barril aberto!" });
      setBarril((atual) => (atual ? { ...atual, disponivel: false } : atual));
      atualizar();
    } catch (erro) {
      setAviso({ texto: erro instanceof Error ? erro.message : "Não foi possível abrir o barril.", erro: true });
    } finally {
      setOcupado(null);
    }
  };

  const resgatarMeta = async (id: string) => {
    setOcupado(id);
    try {
      const ganho = await resgatar(id);
      if (ganho > 0) {
        setAviso({ texto: `+${ganho} Rupees na conta.` });
        atualizar();
      }
    } finally {
      setOcupado(null);
    }
  };

  const daSecao = (secao: "ofensiva" | "penas" | "poderes") =>
    (itens ?? []).filter((item) => SECAO[item.effect] === secao);

  // Resgatáveis primeiro: é o que a pessoa pode fazer agora. Depois as que
  // ainda estão em andamento, pra seção não ficar vazia num dia sem resgate.
  const ofertas = [...metas]
    .sort((a, b) => Number(b.claimable) - Number(a.claimable))
    .slice(0, 3);

  const carregando = itens === null;

  return (
    <div className="mx-auto w-full max-w-md pb-4">
      {aviso && (
        <p
          role="status"
          className={cn(
            "animate-pop-in mb-4 rounded-xl px-3 py-2.5 text-center text-[0.8rem] font-black",
            aviso.erro ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
          )}
        >
          {aviso.texto}
        </p>
      )}

      {/* O saldo, do jeito que já estava: o número grande com o rupee de marca
          d'água atrás. É o cabeçalho da tela — o resto é o que se faz com ele. */}
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card px-5 py-6">
        <Rupee className="pointer-events-none absolute -right-3 top-1/2 size-32 -translate-y-1/2 text-emerald-500/15" />
        <p className="relative text-5xl font-black leading-none text-emerald-500">
          {moedas === null ? "—" : moedas.toLocaleString("pt-BR")}
        </p>
        <p className="relative mt-1.5 text-lg font-black">{moedas === 1 ? "Rupee" : "Rupees"}</p>
        <p className="relative mt-1 text-[0.85rem] leading-snug text-muted-foreground">
          Troque por power-ups, temas, avatares e banners.
        </p>
      </div>

      {/* PRO. Vem logo abaixo do saldo porque é o único item da tela que muda o
          app inteiro, e não um consumo avulso. */}
      {!perfil?.isPro && (
        <Link
          href="/pro"
          onClick={onNavegar}
          className="mt-4 block overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(120deg, #4f63e3 0%, #8a63e6 48%, #bd73e9 100%)" }}
        >
          <SeloPro className="h-6" />
          <p className="mt-3 text-[1.25rem] font-black leading-tight text-white">
            Tudo pra você aprender mais rápido
          </p>
          <p className="mt-1.5 text-[0.85rem] leading-snug text-white/80">
            Penas ilimitadas, XP em dobro e sem anúncios.
          </p>
          <span className="zc-press mt-4 block rounded-[14px] bg-white py-3.5 text-center text-[0.8rem] font-black uppercase tracking-[0.06em] text-violet-700">
            Teste {DIAS_DE_TESTE} dias grátis
          </span>
        </Link>
      )}

      {ofertas.length > 0 && (
        <Secao titulo="Ofertas especiais">
          {ofertas.map((meta) => (
            <Cartao
              key={meta.id}
              Icone={Rupee}
              cor="text-emerald-500"
              fundo="bg-emerald-500/15"
              titulo={meta.title}
              descricao={
                meta.claimable
                  ? `Meta concluída. Resgate suas ${meta.coinReward} Rupees.`
                  : `${meta.current} de ${meta.target} · vale ${meta.coinReward} Rupees.`
              }
              acao={
                meta.claimable ? (
                  <button
                    type="button"
                    onClick={() => void resgatarMeta(meta.id)}
                    disabled={ocupado === meta.id}
                    className="zc-press rounded-xl bg-emerald-500 px-3 py-2 text-[0.72rem] font-black uppercase text-emerald-950 disabled:opacity-60"
                  >
                    {ocupado === meta.id ? "…" : "Resgatar"}
                  </button>
                ) : undefined
              }
            />
          ))}
        </Secao>
      )}

      {/* Barris. Um por dia, de graça: as metas pagam por estudar, o barril
          paga por aparecer. Não há barril por anúncio nem por faixa de
          horário — não existe anúncio aqui, e um barril que só abre de manhã
          puniria quem estuda à noite. */}
      <Secao titulo="Barris">
        <Cartao
          Icone={Barrel}
          cor={barril?.disponivel === false ? "text-muted-foreground" : "text-amber-500"}
          fundo={barril?.disponivel === false ? "bg-muted" : "bg-amber-400/15"}
          titulo="Barril do dia"
          descricao={
            barril === null
              ? "Carregando…"
              : barril.disponivel
                ? `Abra e leve ${barril.rupees} Rupees. Volta todo dia.`
                : "Você já abriu o de hoje. Volta amanhã."
          }
          acao={
            barril?.disponivel ? (
              <button
                type="button"
                onClick={() => void abrirBarril()}
                disabled={ocupado === "barril"}
                className="zc-press rounded-xl bg-amber-400 px-3 py-2 text-[0.72rem] font-black uppercase text-amber-950 disabled:opacity-60"
              >
                {ocupado === "barril" ? "…" : "Abrir"}
              </button>
            ) : undefined
          }
        />
      </Secao>
      {carregando ? (
        <div className="mt-6 flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : (
        (["ofensiva", "poderes", "penas"] as const).map((secao) => {
          const lista = daSecao(secao);
          if (!lista.length) return null;
          const titulo = secao === "ofensiva" ? "Ofensiva" : secao === "poderes" ? "Superpoderes" : "Penas";
          return (
            <Secao key={secao} titulo={titulo}>
              {secao === "penas" && perfil?.isPro && (
                <Cartao
                  Icone={Feather}
                  cor="text-violet-500"
                  fundo="bg-violet-500/15"
                  titulo="Ilimitadas"
                  descricao="Com o PRO, você nunca fica sem penas."
                />
              )}
              {lista.map((item) => {
                const { Icone, cor, fundo } = DESENHO[item.effect];
                return (
                  <Cartao
                    key={item.id}
                    Icone={Icone}
                    cor={cor}
                    fundo={fundo}
                    titulo={item.title}
                    descricao={item.description}
                    acao={<BotaoPreco preco={item.price} ocupado={ocupado === item.id} onClick={() => void comprar(item)} />}
                  />
                );
              })}
            </Secao>
          );
        })
      )}

      <Link
        href="/loja"
        onClick={onNavegar}
        className="mt-6 block rounded-[14px] border border-border py-3.5 text-center text-[0.8rem] font-black uppercase tracking-[0.06em] text-muted-foreground"
      >
        Ver a loja inteira
      </Link>
    </div>
  );
}
