"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, LockKeyhole, X } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { envelhecerGuardado, useDadosGuardados } from "@/lib/dados-guardados";
import { buscarCatalogo, CHAVE_DA_LOJA, fundoDaCapa, type Cosmetico } from "@/lib/loja";
import { AVATARES_DESENHADOS, AVATARES_RAROS, DESCRICAO_DO_AVATAR, corDoAvatar, resolverAvatar } from "@/lib/avatares";
import { movimentoReduzido } from "@/lib/motion/movimento";
import { reagir } from "@/lib/reacoes";
import { cn } from "@/lib/utils";
import type { PerfilUsuario } from "@/lib/types/perfil";
import { Button } from "@/components/ui/button";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { AvatarComMoldura } from "@/components/shared/avatar-com-moldura";
import { MOLDURAS, ehMoldura } from "@/components/shared/moldura";
import { Rupee } from "@/components/shared/rupee";
import { DuoLoja } from "@/components/shared/icone-duo";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { ArtesDaCapa } from "./profile-header";
import { BANNERS_ESPECIAIS, CORES_CAPA } from "./banners";

type Aba = "icone" | "moldura" | "capa";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "icone", rotulo: "Ícone" },
  { id: "moldura", rotulo: "Moldura" },
  { id: "capa", rotulo: "Capa" },
];

/** Como a pessoa chega a uma opção. */
type Acesso =
  | { tipo: "usar" }
  | { tipo: "comprar"; cosmetico: Cosmetico }
  | { tipo: "pro" }
  | { tipo: "bloqueado"; motivo: string }
  /** Depende da loja, que ainda não respondeu. */
  | { tipo: "carregando" };

type Etiqueta = "gratis" | "loja" | "pro" | "evento" | "raro" | "conquista" | "selo" | "exclusivo";

const ETIQUETAS: Record<Etiqueta, { texto: string; classe: string }> = {
  gratis: { texto: "Grátis", classe: "bg-emerald-500/15 text-emerald-500" },
  loja: { texto: "Da loja", classe: "bg-amber-500/15 text-amber-500" },
  pro: { texto: "PRO", classe: "bg-violet-500/15 text-violet-500" },
  evento: { texto: "Evento", classe: "bg-orange-500/15 text-orange-500" },
  raro: { texto: "Raro", classe: "bg-cyan-500/15 text-cyan-500" },
  conquista: { texto: "Conquista", classe: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  selo: { texto: "Selo", classe: "bg-sky-500/15 text-sky-500" },
  exclusivo: { texto: "Exclusivo", classe: "bg-violet-500/15 text-violet-500" },
};

interface Opcao {
  /** O que vai para o perfil: o id do ícone, o da moldura (null tira a moldura) ou o fundo da capa. */
  valor: string | null;
  nome: string;
  descricao: string;
  etiqueta?: Etiqueta;
  acesso: Acesso;
}

type Aplicado = { icone: string; moldura: string | null; capa: string };

// ---------------------------------------------------------------------------
// As opções de cada aba
//
// Quem pode usar o quê o servidor confere de novo no PUT /user; aqui é só para
// mostrar o botão certo. `cosmeticos` nulo quer dizer que a loja ainda não
// respondeu: o que depende dela espera, em vez de aparecer como bloqueado.
// ---------------------------------------------------------------------------

function opcoesDeIcone(perfil: PerfilUsuario, cosmeticos: Cosmetico[] | null, admin: boolean, emUso: string): Opcao[] {
  const daLoja = (id: string) => cosmeticos?.find((item) => item.kind === "AVATAR" && item.value.avatarId === id);
  // Os ícones que vêm com um selo da conta, além de estarem na loja ou nos eventos.
  const doSelo = (id: string) =>
    (id === "zul-miami" && !!perfil.isPro) ||
    (id === "gato-hacker" && !!perfil.isDeveloper) ||
    (id === "zul-astronauta" && !!perfil.isEarlyTester);

  // Os da loja que a pessoa não tem ficam só na loja: aqui não se vende ícone.
  // O do PRO e os de evento continuam, com o jeito de conseguir.
  const desenhados = AVATARES_DESENHADOS.flatMap((avatar): Opcao[] => {
    const cosmetico = daLoja(avatar.id);
    const tem = admin || avatar.como === "gratis" || avatar.id === emUso || !!cosmetico?.owned || doSelo(avatar.id);
    if (avatar.como === "loja" && !tem) return [];
    let acesso: Acesso;
    if (tem) acesso = { tipo: "usar" };
    else if (avatar.como === "pro") acesso = { tipo: "pro" };
    else if (!cosmeticos) acesso = { tipo: "carregando" };
    else acesso = { tipo: "bloqueado", motivo: avatar.detalhe ?? "Este ícone não está disponível agora." };
    return [
      {
        valor: avatar.id,
        nome: avatar.nome,
        descricao: cosmetico?.description || DESCRICAO_DO_AVATAR[avatar.id] || "",
        etiqueta: avatar.como,
        acesso,
      },
    ];
  });

  // Os raros só aparecem para a equipe e para quem ganhou um.
  const raros = AVATARES_RAROS.filter((raro) => admin || raro.id === emUso || !!daLoja(raro.id)?.owned).map(
    (raro): Opcao => ({
      valor: raro.id,
      nome: `ZulCode ${raro.nome}`,
      descricao: "Um ícone oficial do app. Raro: só a equipe do ZulCode usa ou dá de presente.",
      etiqueta: "raro",
      acesso: { tipo: "usar" },
    }),
  );

  return [...desenhados, ...raros];
}

function opcoesDeMoldura(cosmeticos: Cosmetico[] | null, admin: boolean, emUso: string | null): Opcao[] {
  const daLoja = (id: string) => cosmeticos?.find((item) => item.kind === "FRAME" && item.value.molduraId === id);
  const molduras = MOLDURAS.map((moldura): Opcao => {
    const cosmetico = daLoja(moldura.id);
    const tem = admin || moldura.id === emUso || !!cosmetico?.owned;
    let acesso: Acesso;
    if (tem) acesso = { tipo: "usar" };
    else if (!cosmeticos) acesso = { tipo: "carregando" };
    else if (cosmetico && !cosmetico.exclusive) acesso = { tipo: "comprar", cosmetico };
    else acesso = { tipo: "bloqueado", motivo: moldura.detalhe ?? "Esta moldura não está na loja agora." };
    return {
      valor: moldura.id,
      nome: moldura.nome,
      descricao: cosmetico?.description || moldura.descricao,
      etiqueta: moldura.detalhe ? "conquista" : "loja",
      acesso,
    };
  });
  return [{ valor: null, nome: "Sem moldura", descricao: "Só o seu ícone, sem nada em volta.", acesso: { tipo: "usar" } }, ...molduras];
}

const DESCRICAO_DA_CAPA_ESPECIAL: Record<string, string> = {
  "pro-banner": "A capa do PRO, com arte própria.",
  "developer-banner": "Para quem ajuda a construir o ZulCode.",
  "early-tester-banner": "Para quem testou o ZulCode desde o começo.",
  "richard-tribute-banner": "Da conquista Legado Richard.",
};

function opcoesDeCapa(perfil: PerfilUsuario, cosmeticos: Cosmetico[] | null, admin: boolean, emUso: string): Opcao[] {
  const lisas = CORES_CAPA.map(
    (cor): Opcao => ({ valor: cor.valor, nome: cor.label, descricao: "Uma cor lisa, para qualquer conta.", etiqueta: "gratis", acesso: { tipo: "usar" } }),
  );

  const conquistouRichard = perfil.conquistas?.some(({ id }) => id === "richard-tribute") ?? false;
  const especiais = BANNERS_ESPECIAIS.flatMap((banner): Opcao[] => {
    const nome = banner.name.replace(/^Banner\s+/, "");
    const descricao = DESCRICAO_DA_CAPA_ESPECIAL[banner.id] ?? "";
    // A do PRO aparece para todo mundo: é o convite para o PRO.
    if (banner.id === "pro-banner") {
      const liberada = !!perfil.isPro || admin || banner.gradient === emUso;
      return [{ valor: banner.gradient, nome, descricao, etiqueta: "pro", acesso: liberada ? { tipo: "usar" } : { tipo: "pro" } }];
    }
    // As de selo e a do Richard, só para quem tem (o servidor recusa as de selo até para a equipe).
    const tem = banner.id === "richard-tribute-banner" ? conquistouRichard : !!perfil[banner.requer];
    if (!tem && banner.gradient !== emUso) return [];
    return [
      {
        valor: banner.gradient,
        nome,
        descricao,
        etiqueta: banner.id === "richard-tribute-banner" ? "conquista" : "selo",
        acesso: { tipo: "usar" },
      },
    ];
  });

  const daLoja = (cosmeticos ?? []).flatMap((cosmetico): Opcao[] => {
    const fundo = cosmetico.kind === "BANNER" ? fundoDaCapa(cosmetico) : null;
    if (!fundo) return [];
    const tem = admin || cosmetico.owned || fundo === emUso;
    return [
      {
        valor: fundo,
        nome: cosmetico.name.replace(/^Banner\s+/, ""),
        descricao: cosmetico.description,
        etiqueta: cosmetico.exclusive ? "exclusivo" : "loja",
        acesso: tem ? { tipo: "usar" } : cosmetico.exclusive ? { tipo: "bloqueado", motivo: "Fora da loja." } : { tipo: "comprar", cosmetico },
      },
    ];
  });

  const lista = [...lisas, ...especiais, ...daLoja];
  // Uma capa antiga, que não está em nenhuma lista, entra no começo para não sumir do perfil sem querer.
  if (!lista.some((opcao) => opcao.valor === emUso)) {
    lista.unshift({ valor: emUso, nome: "Capa atual", descricao: "A capa que está no seu perfil agora.", acesso: { tipo: "usar" } });
  }
  return lista;
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/** O cartão do topo: o perfil do jeito que vai ficar, com o que está sendo provado. */
function Previa({ perfil, icone, moldura, capa }: { perfil: PerfilUsuario; icone: string; moldura: string | null; capa: string }) {
  return (
    <div className="relative mx-4 shrink-0 rounded-[22px] border border-border bg-card">
      <div className="relative h-[clamp(92px,15dvh,132px)] overflow-hidden rounded-t-[21px]" style={{ background: capa }}>
        <ArtesDaCapa cor={capa} />
      </div>
      <div className="flex items-start gap-3 px-4 pb-4">
        <AvatarComMoldura
          avatarId={icone}
          molduraId={moldura}
          capa={capa}
          className="-mt-[40px] ml-2 size-[clamp(84px,12dvh,104px)] rounded-[30%] border-[5px] border-card"
        />
        <div className="min-w-0 flex-1 pt-2.5">
          <p className="flex min-w-0 items-center gap-1.5 text-xl font-black leading-tight">
            <span className="truncate">{perfil.nome}</span>
            {perfil.isVerified && <SeloVerificado className="shrink-0 text-[1.05rem]" />}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-black">
            {perfil.publicCode && <span className="text-muted-foreground">#{perfil.publicCode}</span>}
            <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-amber-950">Nv. {perfil.nivel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A plaquinha embaixo de cada miniatura: o preço, o PRO, o cadeado ou o raro. */
function SeloDaMiniatura({ opcao }: { opcao: Opcao }) {
  const base =
    "pointer-events-none absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-[3px] text-[10px] font-black leading-none ring-2 ring-card";
  const { acesso } = opcao;
  if (acesso.tipo === "comprar") {
    return (
      <span className={cn(base, "border border-border bg-card text-amber-500")}>
        <Rupee className="size-2.5 text-emerald-500" />
        {acesso.cosmetico.price}
      </span>
    );
  }
  if (acesso.tipo === "pro") return <span className={cn(base, "bg-gradient-to-r from-[#4f63e3] to-[#bd73e9] text-white")}>PRO</span>;
  if (acesso.tipo === "bloqueado") {
    const texto = opcao.etiqueta === "conquista" ? "Conquista" : opcao.etiqueta === "evento" ? "Evento" : "Fechado";
    return (
      <span className={cn(base, "bg-muted text-muted-foreground")}>
        <LockKeyhole className="size-2.5" strokeWidth={3} />
        {texto}
      </span>
    );
  }
  if (opcao.etiqueta === "raro") return <span className={cn(base, "bg-cyan-400 text-cyan-950")}>Raro</span>;
  return null;
}

/** Como a pessoa está com a opção escolhida, ao lado do nome. */
function Situacao({ opcao, emUso }: { opcao: Opcao; emUso: boolean }) {
  const base = "flex shrink-0 items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-black";
  if (emUso) {
    return (
      <span className={cn(base, "bg-primary/15 text-primary")}>
        <Check className="size-3.5" strokeWidth={3.4} /> Em uso
      </span>
    );
  }
  const { acesso } = opcao;
  if (acesso.tipo === "usar") {
    return (
      <span className={cn(base, "bg-emerald-500/15 text-emerald-500")}>
        <Check className="size-3.5" strokeWidth={3.4} /> Você tem
      </span>
    );
  }
  if (acesso.tipo === "comprar") {
    return (
      <span className={cn(base, "bg-amber-500/15 text-amber-500")}>
        <Rupee className="size-3.5 text-emerald-500" /> {acesso.cosmetico.price}
      </span>
    );
  }
  if (acesso.tipo === "pro") return <span className={cn(base, "bg-gradient-to-r from-[#4f63e3] to-[#bd73e9] text-white")}>Só PRO</span>;
  if (acesso.tipo === "bloqueado") {
    return (
      <span className={cn(base, "bg-muted text-muted-foreground")}>
        <LockKeyhole className="size-3.5" strokeWidth={2.6} /> Bloqueado
      </span>
    );
  }
  return null;
}

/**
 * A faixa de miniaturas, com as setas dos lados. A escolhida fica no meio,
 * maior e com a borda azul; a que está no perfil leva o visto no canto.
 */
function FaixaDeOpcoes({
  aba,
  opcoes,
  indice,
  valorEmUso,
  aoProvar,
  aoMover,
  miniatura,
  fim,
}: {
  aba: Aba;
  opcoes: Opcao[];
  indice: number;
  valorEmUso: string | null;
  aoProvar: (valor: string | null) => void;
  aoMover: (passo: number) => void;
  miniatura: (opcao: Opcao) => ReactNode;
  /** Uma peça depois da última opção (o atalho para a loja). */
  fim?: ReactNode;
}) {
  const faixa = useRef<HTMLDivElement>(null);
  const ultimaAba = useRef<Aba | null>(null);

  // Leva a escolhida para o meio. Ao trocar de aba vai direto, sem deslizar
  // da posição da lista anterior.
  useEffect(() => {
    const caixa = faixa.current;
    const alvo = caixa?.querySelector<HTMLElement>(`[data-indice="${indice}"]`);
    if (!caixa || !alvo) return;
    const suave = ultimaAba.current === aba && !movimentoReduzido();
    ultimaAba.current = aba;
    caixa.scrollTo({ left: alvo.offsetLeft - (caixa.clientWidth - alvo.offsetWidth) / 2, behavior: suave ? "smooth" : "auto" });
  }, [aba, indice]);

  const seta =
    "zc-press grid size-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.22)] transition-opacity disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative">
      <div
        ref={faixa}
        role="listbox"
        aria-label={aba === "icone" ? "Ícones" : aba === "moldura" ? "Molduras" : "Capas"}
        aria-orientation="horizontal"
        onKeyDown={(evento) => {
          if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
          evento.preventDefault();
          aoMover(evento.key === "ArrowLeft" ? -1 : 1);
        }}
        className="zc-scroll-hidden relative flex h-[100px] items-center gap-3 overflow-x-auto overscroll-x-contain"
      >
        {/* Os espaços das pontas deixam a primeira e a última chegarem ao meio. */}
        <span aria-hidden className="h-px w-[calc(50%-44px)] shrink-0" />
        {opcoes.map((opcao, i) => {
          const escolhida = i === indice;
          const emUso = opcao.valor === valorEmUso;
          return (
            <button
              key={opcao.valor ?? "sem"}
              type="button"
              role="option"
              data-indice={i}
              aria-selected={escolhida}
              aria-label={`${opcao.nome}${emUso ? ", em uso" : ""}`}
              tabIndex={escolhida ? 0 : -1}
              onClick={() => aoProvar(opcao.valor)}
              className={cn(
                "relative grid size-16 shrink-0 place-items-center rounded-[19px] border-2 transition-[transform,border-color,background-color] duration-200",
                escolhida ? "z-[1] scale-[1.2] border-primary bg-primary/10" : "border-border bg-muted/50 hover:border-primary/40",
              )}
            >
              {miniatura(opcao)}
              {emUso && (
                <span className="absolute -right-1.5 -top-1.5 grid size-[22px] place-items-center rounded-full bg-primary ring-[3px] ring-card">
                  <Check className="size-3.5 text-white" strokeWidth={3.4} />
                </span>
              )}
              <SeloDaMiniatura opcao={opcao} />
            </button>
          );
        })}
        {fim}
        <span aria-hidden className="h-px w-[calc(50%-44px)] shrink-0" />
      </div>
      {/* As pontas somem sob as setas, em vez de cortar a miniatura seca. */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
      <span className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
        <button type="button" onClick={() => aoMover(-1)} disabled={indice <= 0} aria-label="Anterior" className={seta}>
          <ChevronLeft className="size-5" strokeWidth={2.8} />
        </button>
      </span>
      <span className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
        <button type="button" onClick={() => aoMover(1)} disabled={indice >= opcoes.length - 1} aria-label="Próxima" className={seta}>
          <ChevronRight className="size-5" strokeWidth={2.8} />
        </button>
      </span>
    </div>
  );
}

async function comprar(id: string): Promise<{ ok: boolean; mensagem?: string }> {
  const token = localStorage.getItem("accessToken");
  if (!token) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };
  try {
    const res = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics/${encodeURIComponent(id)}/buy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { ok: true };
    const corpo = await res.json().catch(() => null);
    return { ok: false, mensagem: typeof corpo?.message === "string" ? corpo.message : "Não deu para comprar agora. Tente de novo." };
  } catch {
    return { ok: false, mensagem: "Sem conexão com o servidor." };
  }
}

// ---------------------------------------------------------------------------
// O editor
// ---------------------------------------------------------------------------

const NOME_DO_BOTAO: Record<Aba, string> = { icone: "Usar ícone", moldura: "Usar moldura", capa: "Usar capa" };

/** Volta para o perfil. Aberto direto pelo endereço, não há para onde voltar: vai para o perfil. */
function sair(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back();
  else router.replace("/perfil");
}

/** O selo "Novo" da aba Moldura some depois da primeira visita (só neste aparelho). */
const VIU_AS_MOLDURAS = "zc-viu-molduras";

function Editor({ perfil }: { perfil: PerfilUsuario }) {
  const router = useRouter();
  const { salvarDados, atualizar } = usePerfil();
  const { dados: catalogo, recarregar, erro: lojaFora } = useDadosGuardados(CHAVE_DA_LOJA, buscarCatalogo, 60_000);
  const cosmeticos = catalogo?.cosmetics ?? null;

  const [aba, setAba] = useState<Aba>("icone");
  /** O que está sendo provado na aba aberta. Undefined: nada, vale o que está no perfil. */
  const [provando, setProvando] = useState<string | null | undefined>(undefined);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [viuMolduras, setViuMolduras] = useState(() => {
    try {
      return localStorage.getItem(VIU_AS_MOLDURAS) === "1";
    } catch {
      return true;
    }
  });

  // O aviso de que deu certo some sozinho; o de erro fica até a próxima ação.
  useEffect(() => {
    if (!aviso || aviso.erro) return;
    const timer = window.setTimeout(() => setAviso(null), 2600);
    return () => window.clearTimeout(timer);
  }, [aviso]);

  const admin = perfil.role === "ADMIN";
  const aplicado: Aplicado = {
    icone: resolverAvatar(perfil.avatarId).avatar.id,
    moldura: ehMoldura(perfil.frameId) ? perfil.frameId : null,
    capa: perfil.bannerColor ?? "#22c55e",
  };

  const opcoes =
    aba === "icone"
      ? opcoesDeIcone(perfil, cosmeticos, admin, aplicado.icone)
      : aba === "moldura"
        ? opcoesDeMoldura(cosmeticos, admin, aplicado.moldura)
        : opcoesDeCapa(perfil, cosmeticos, admin, aplicado.capa);

  const valorAtual = provando === undefined ? aplicado[aba] : provando;
  const indice = Math.max(0, opcoes.findIndex((opcao) => opcao.valor === valorAtual));
  const escolhida = opcoes[indice];
  const emUso = escolhida.valor === aplicado[aba];

  // A prévia junta o que está sendo provado nesta aba com o que já está no perfil nas outras.
  const previa = {
    icone: aba === "icone" ? escolhida.valor ?? aplicado.icone : aplicado.icone,
    moldura: aba === "moldura" ? escolhida.valor : aplicado.moldura,
    capa: aba === "capa" ? escolhida.valor ?? aplicado.capa : aplicado.capa,
  };

  const fechar = () => sair(router);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") sair(router);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [router]);

  // Trocar de aba desfaz o que estava sendo provado e não foi usado.
  const trocarAba = (nova: Aba) => {
    setAba(nova);
    setProvando(undefined);
    setAviso(null);
    if (nova === "moldura" && !viuMolduras) {
      setViuMolduras(true);
      try {
        localStorage.setItem(VIU_AS_MOLDURAS, "1");
      } catch {
        // Sem armazenamento: o selo volta na próxima visita, e tudo bem.
      }
    }
  };

  const provar = (valor: string | null) => {
    setProvando(valor);
    setAviso(null);
  };

  const mover = (passo: number) => {
    const proxima = opcoes[indice + passo];
    if (proxima) provar(proxima.valor);
  };

  const agir = async () => {
    const { acesso } = escolhida;
    if (ocupado || emUso || acesso.tipo === "bloqueado" || acesso.tipo === "carregando") return;
    if (acesso.tipo === "pro") {
      router.push("/pro");
      return;
    }
    const saldo = perfil.moedas ?? 0;
    if (acesso.tipo === "comprar" && saldo < acesso.cosmetico.price) {
      setAviso({ texto: `Faltam ${acesso.cosmetico.price - saldo} rupees: você tem ${saldo} e este custa ${acesso.cosmetico.price}.`, erro: true });
      return;
    }

    setOcupado(true);
    setAviso(null);
    let comprou = false;
    try {
      if (acesso.tipo === "comprar") {
        const compra = await comprar(acesso.cosmetico.id);
        if (!compra.ok) {
          setAviso({ texto: compra.mensagem ?? "Não deu para comprar agora.", erro: true });
          return;
        }
        comprou = true;
      }
      const dados =
        aba === "icone" ? { avatarId: escolhida.valor ?? aplicado.icone } : aba === "moldura" ? { frameId: escolhida.valor } : { bannerColor: escolhida.valor ?? aplicado.capa };
      const resultado = await salvarDados(dados);
      if (resultado.ok === false) {
        setAviso({ texto: resultado.mensagem ?? "Não deu para salvar agora. Tente de novo.", erro: true });
        return;
      }
      // A loja mostra o "Em uso": fica velha e se atualiza na próxima visita.
      if (acesso.tipo !== "comprar") envelhecerGuardado(CHAVE_DA_LOJA);
      reagir(acesso.tipo === "comprar" ? "compra" : "toque");
      setProvando(undefined);
      setAviso({ texto: acesso.tipo === "comprar" ? "Comprado e já no seu perfil!" : "Pronto, já está no seu perfil." });
    } finally {
      // Comprou: o saldo e a loja mudam, mesmo que usar tenha falhado. Só
      // depois do PUT, para a busca nova já vir com a troca.
      if (comprou) {
        void recarregar();
        atualizar();
      }
      setOcupado(false);
    }
  };

  const miniatura = (opcao: Opcao): ReactNode => {
    if (aba === "icone") {
      return (
        <span className="grid size-[46px] place-items-center rounded-[14px] text-white" style={{ background: corDoAvatar(opcao.valor) }}>
          <AvatarIcon id={opcao.valor} />
        </span>
      );
    }
    if (aba === "moldura") {
      return (
        <AvatarComMoldura avatarId={aplicado.icone} molduraId={opcao.valor} capa={aplicado.capa} animar={false} className="size-[30px] rounded-[9px]" />
      );
    }
    return <span className="block h-[38px] w-[50px] rounded-[10px] border border-black/10" style={{ background: opcao.valor ?? undefined }} />;
  };

  // O botão grande: o que dá para fazer com a escolhida.
  const { acesso } = escolhida;
  const saldo = perfil.moedas ?? 0;
  const semSaldo = acesso.tipo === "comprar" && saldo < acesso.cosmetico.price;
  const apagado = emUso || ocupado || semSaldo || acesso.tipo === "bloqueado" || acesso.tipo === "carregando";
  let textoDoBotao: ReactNode;
  if (ocupado) textoDoBotao = acesso.tipo === "comprar" ? "Comprando…" : "Salvando…";
  else if (emUso) textoDoBotao = "Em uso";
  else if (acesso.tipo === "comprar") {
    textoDoBotao = (
      <>
        Comprar por <Rupee className={cn("size-[18px]", semSaldo ? "text-muted-foreground" : "text-white")} /> {acesso.cosmetico.price}
      </>
    );
  } else if (acesso.tipo === "pro") textoDoBotao = "Ser PRO para usar";
  else if (acesso.tipo === "bloqueado") {
    textoDoBotao = (
      <>
        <LockKeyhole className="size-[18px]" strokeWidth={2.6} /> Bloqueado
      </>
    );
  } else if (acesso.tipo === "carregando") textoDoBotao = lojaFora ? "Sem conexão com a loja" : "Carregando a loja…";
  else textoDoBotao = aba === "moldura" && escolhida.valor === null ? "Tirar moldura" : NOME_DO_BOTAO[aba];

  const etiqueta = escolhida.etiqueta ? ETIQUETAS[escolhida.etiqueta] : null;

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-background sm:items-center sm:p-6">
      <div className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] sm:h-auto sm:max-h-full sm:rounded-[28px] sm:border sm:border-border sm:shadow-2xl">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="zc-press grid size-11 shrink-0 place-items-center rounded-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-[22px]" strokeWidth={2.6} />
          </button>
          <h1 className="flex-1 text-[1.05rem] font-black">Editar perfil</h1>
          <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5" aria-label={`${saldo} rupees`}>
            <Rupee className="size-[18px] text-emerald-500" />
            <span className="text-[0.95rem] font-black text-amber-400">{perfil.moedas?.toLocaleString("pt-BR") ?? "—"}</span>
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center pb-5 pt-1 sm:py-6">
          <Previa perfil={perfil} icone={previa.icone} moldura={previa.moldura} capa={previa.capa} />
        </div>

        <section className="shrink-0 rounded-t-[28px] border-t border-border bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <div role="tablist" aria-label="O que editar" className="grid shrink-0 grid-cols-3 gap-2">
            {ABAS.map((item) => {
              const ativa = aba === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => trocarAba(item.id)}
                  className={cn(
                    "zc-press relative h-10 rounded-xl text-[0.88rem] font-black transition-colors duration-150",
                    ativa ? "bg-primary text-primary-foreground" : "border border-border bg-muted/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.rotulo}
                  {item.id === "moldura" && !ativa && !viuMolduras && (
                    <span className="absolute -right-1 -top-1.5 rounded-full bg-pink-500 px-1.5 py-px text-[9px] font-black uppercase tracking-[0.06em] text-white ring-2 ring-card">
                      Novo
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 shrink-0">
            <FaixaDeOpcoes
              aba={aba}
              opcoes={opcoes}
              indice={indice}
              valorEmUso={aplicado[aba]}
              aoProvar={provar}
              aoMover={mover}
              miniatura={miniatura}
              fim={
                aba === "icone" ? (
                  <button
                    type="button"
                    onClick={() => router.push("/loja")}
                    aria-label="Mais ícones na loja"
                    className="grid size-16 shrink-0 place-items-center rounded-[19px] border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <span className="flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-[0.04em]">
                      <DuoLoja className="size-6" />
                      Loja
                    </span>
                  </button>
                ) : undefined
              }
            />
          </div>

          <div className="mt-3 flex shrink-0 items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-[1.05rem] font-black">{escolhida.nome}</h2>
                {etiqueta && (
                  <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.08em]", etiqueta.classe)}>
                    {etiqueta.texto}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 min-h-[2.5em] text-[0.8rem] leading-snug text-muted-foreground">
                {acesso.tipo === "bloqueado" ? acesso.motivo : escolhida.descricao}
              </p>
            </div>
            <Situacao opcao={escolhida} emUso={emUso} />
          </div>

          <p
            role="status"
            aria-live="polite"
            className={cn("mt-2 min-h-5 shrink-0 text-[0.8rem] font-bold", aviso?.erro ? "text-destructive" : "text-emerald-500")}
          >
            {aviso?.texto}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => void agir()}
              disabled={emUso || ocupado || acesso.tipo === "bloqueado" || acesso.tipo === "carregando"}
              className={cn(
                "flex h-[54px] w-full items-center justify-center gap-1.5 rounded-2xl text-[0.9rem] font-black uppercase tracking-[0.06em] transition-colors",
                apagado
                  ? "bg-muted text-muted-foreground"
                  : acesso.tipo === "pro"
                    ? "zc-press zc-press-shadow bg-gradient-to-r from-[#4f63e3] to-[#bd73e9] text-white"
                    : "zc-press zc-press-shadow bg-primary text-primary-foreground",
              )}
              style={apagado ? undefined : { ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
            >
              {textoDoBotao}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * A tela de editar o perfil (/perfil/editar): tela cheia, sem a barra de
 * baixo e sem rolagem. Em cima, o cartão do perfil com o que está sendo
 * provado; embaixo, as abas (ícone, moldura e capa), a faixa de opções e o
 * botão que usa ou compra. Nada muda no perfil antes do botão.
 */
export function EditorDePerfil() {
  const { perfil, loading, error, retry } = usePerfil();

  if (perfil) return <Editor perfil={perfil} />;

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      {loading || !error ? (
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Não foi possível carregar seu perfil.</p>
          <Button onClick={retry}>Tentar novamente</Button>
        </>
      )}
    </div>
  );
}
