"use client";

import Image from "next/image";
import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Brain, Bug, Dumbbell, Eye, Flame, Glasses, PartyPopper, Plus, Popcorn, Rocket, Target, Trophy, type LucideIcon } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface Status {
  id: string;
  rotulo: string;
  Icone?: LucideIcon;
  /** O logo do ZulCode não é um ícone de traço: vem do SVG em /public e troca
   * com o tema, como na sidebar. */
  marca?: boolean;
  cor: string;
}

/** As opções da grade, em duas fileiras de seis. A cor é do traço, sobre o
 * mesmo fundo neutro — assim a grade lê como um conjunto, e não como doze
 * adesivos soltos. */
const STATUS: Status[] = [
  { id: "zulcode", rotulo: "ZulCode", marca: true, cor: "text-foreground" },
  { id: "foco", rotulo: "No foco", Icone: Target, cor: "text-rose-500" },
  { id: "fogo", rotulo: "Pegando fogo", Icone: Flame, cor: "text-orange-500" },
  { id: "estudando", rotulo: "Estudando", Icone: Brain, cor: "text-violet-500" },
  { id: "treinando", rotulo: "Treinando", Icone: Dumbbell, cor: "text-emerald-500" },
  { id: "cacando-bug", rotulo: "Caçando bug", Icone: Bug, cor: "text-lime-500" },
  { id: "decolando", rotulo: "Decolando", Icone: Rocket, cor: "text-sky-500" },
  { id: "campeao", rotulo: "Campeão", Icone: Trophy, cor: "text-amber-500" },
  { id: "comemorando", rotulo: "Comemorando", Icone: PartyPopper, cor: "text-pink-500" },
  { id: "observando", rotulo: "De olho", Icone: Eye, cor: "text-cyan-500" },
  { id: "assistindo", rotulo: "Assistindo aula", Icone: Popcorn, cor: "text-red-500" },
  { id: "de-boa", rotulo: "De boa", Icone: Glasses, cor: "text-indigo-400" },
];

/** Evento que avisa as outras telas quando o status muda — mesmo recurso que a
 * loja usa pra atualizar as moedas sem recarregar a página. */
const EVENTO = "zulcode:status";
const DURACAO_MS = 220;

function chaveDoStatus(perfilId?: string | null) {
  return `zulcode:status:${perfilId ?? "anonimo"}`;
}

function useLogo() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "/icon-only-dark.svg" : "/icon-only.svg";
}

/** Desenho de um status, no tamanho pedido. */
function Simbolo({ status, tamanho, logo }: { status: Status; tamanho: string; logo: string }) {
  if (status.marca) {
    return <Image src={logo} alt="" width={40} height={40} className={tamanho} />;
  }
  const Icone = status.Icone!;
  return <Icone className={cn(tamanho, status.cor)} strokeWidth={2.4} />;
}

/** Lê o status escolhido e acompanha as mudanças feitas em qualquer lugar. */
export function useStatusEscolhido() {
  const { perfil } = usePerfil();
  const chave = chaveDoStatus(perfil?.id);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const ler = () => {
      try {
        setId(localStorage.getItem(chave));
      } catch {
        setId(null);
      }
    };
    ler();
    window.addEventListener(EVENTO, ler);
    return () => window.removeEventListener(EVENTO, ler);
  }, [chave]);

  const definir = (novo: string | null) => {
    try {
      if (novo) localStorage.setItem(chave, novo);
      else localStorage.removeItem(chave);
    } catch {
      // navegação privada / armazenamento bloqueado: nada é guardado
    }
    // Avisa o card, a folha e qualquer avatar na tela ao mesmo tempo.
    window.dispatchEvent(new Event(EVENTO));
  };

  return { status: STATUS.find((item) => item.id === id) ?? null, id, definir };
}

/**
 * Avatar com o balãozinho de status por cima, como na referência: a bolha
 * grande no canto de cima e o pontinho encostando no avatar, que é o que
 * transforma o selo num balão de pensamento em vez de um adesivo colado.
 *
 * Com `vazio`, a bolha aparece mesmo sem status escolhido, com um "+" — é o
 * que dá onde tocar no celular, onde não existe o card de escolha.
 */
export function AvatarComStatus({
  children,
  status,
  pequeno = false,
  vazio = false,
}: {
  children: ReactNode;
  status: Status | null;
  /** Versão reduzida, pro avatar pequeno das listas. */
  pequeno?: boolean;
  vazio?: boolean;
}) {
  const logo = useLogo();
  if (!status && !vazio) return <>{children}</>;

  return (
    <span className="relative inline-flex shrink-0">
      {children}
      <span
        className={cn(
          "absolute rounded-full border-2 border-background bg-muted",
          pequeno ? "-right-1 top-2 size-2" : "-right-1 top-3 size-2.5"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full border-2 border-background bg-muted",
          status && "animate-check-pop",
          pequeno ? "-right-2.5 -top-2.5 size-7" : "-right-3 -top-3 size-9"
        )}
        title={status?.rotulo ?? "Escolher status"}
      >
        {status ? (
          <Simbolo status={status} tamanho={pequeno ? "size-4" : "size-5"} logo={logo} />
        ) : (
          <Plus className={cn(pequeno ? "size-3.5" : "size-4", "text-muted-foreground")} strokeWidth={3} />
        )}
      </span>
    </span>
  );
}

/** Prévia + grade — o miolo, compartilhado pelo card do desktop e pela folha
 * do celular. `grande` afrouxa tudo pra folha, que tem a largura da tela. */
function ConteudoDoStatus({ grande = false }: { grande?: boolean }) {
  const { perfil } = usePerfil();
  const { status: escolhido, id: escolhidoId, definir } = useStatusEscolhido();
  const logo = useLogo();

  return (
    <>
      <div className={cn("flex flex-col items-center gap-2", grande ? "mt-5" : "mt-6")}>
        <AvatarComStatus status={escolhido}>
          <UserAvatar
            iniciais={perfil?.iniciais ?? "?"}
            avatarId={perfil?.avatarId}
            bannerColor={perfil?.bannerColor}
            size="md"
            className="[&>div]:rounded-full [&>div]:ring-0"
          />
        </AvatarComStatus>
        <p className="h-4 text-[0.78rem] font-black text-muted-foreground">{escolhido?.rotulo ?? ""}</p>
      </div>

      <div className={cn("grid grid-cols-6", grande ? "mt-6 gap-2.5" : "mt-4 gap-2")}>
        {STATUS.map((status) => {
          const ativo = status.id === escolhidoId;
          return (
            <button
              key={status.id}
              type="button"
              aria-pressed={ativo}
              title={status.rotulo}
              aria-label={status.rotulo}
              onClick={() => definir(ativo ? null : status.id)}
              className={cn(
                "zc-press flex aspect-square items-center justify-center border transition-colors duration-150",
                grande ? "rounded-2xl" : "rounded-xl",
                ativo ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border bg-background hover:border-primary/40"
              )}
            >
              <Simbolo status={status} tamanho={grande ? "size-6" : "size-5"} logo={logo} />
            </button>
          );
        })}
      </div>
    </>
  );
}

function BotaoLimpar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-primary transition-opacity duration-150 hover:opacity-70"
    >
      Limpar
    </button>
  );
}

/**
 * Card de escolha do status. Só existe do lg pra cima, no painel da direita —
 * no celular quem faz esse papel é a FolhaDeStatus, aberta pelo balãozinho.
 *
 * O status fica só no navegador, por usuário: o `User` do backend não tem
 * campo pra isso (o PUT /user aceita apenas name, email, avatarId,
 * bannerColor e themeMode), e criar um é do lado de lá. Na prática o status é
 * visível só pra própria pessoa e some se ela trocar de navegador. Quando a
 * API ganhar o campo, é só trocar o localStorage dentro do useStatusEscolhido.
 */
export function EscolhaDeStatus() {
  const { status: escolhido, definir } = useStatusEscolhido();

  return (
    <section className="rounded-[20px] border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-black">Escolha o seu status</h2>
        {escolhido && <BotaoLimpar onClick={() => definir(null)} />}
      </div>
      <ConteudoDoStatus />
    </section>
  );
}

/**
 * Versão do celular: sobe do rodapé cobrindo a metade de baixo da tela, no
 * mesmo formato de bandeja do menu "Mais" da barra inferior. Portal em
 * document.body porque dentro da linha do ranking ela não cobriria a tela.
 */
export function FolhaDeStatus({ onClose }: { onClose: () => void }) {
  const { status: escolhido, definir } = useStatusEscolhido();
  const [visivel, setVisivel] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fechar = () => {
    setVisivel(false);
    window.setTimeout(onClose, DURACAO_MS);
  };

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => { if (evento.key === "Escape") fechar(); };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        style={{ transitionDuration: `${DURACAO_MS}ms`, opacity: visivel ? 1 : 0 }}
        onClick={fechar}
        role="presentation"
      />

      <div
        className="zc-scroll-hidden fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[24px] border-t border-border bg-card px-5 pt-3 text-center shadow-xl transition-transform ease-out"
        style={{
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          transitionDuration: `${DURACAO_MS}ms`,
          transform: visivel ? "translateY(0)" : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Escolha o seu status"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-border" aria-hidden />

        <h2 className="text-lg font-black">Escolha o seu status</h2>

        <ConteudoDoStatus grande />

        {/* Escolher não fecha sozinho: dá pra trocar de ideia à vontade e só
            então confirmar, como na referência. */}
        <button
          type="button"
          onClick={fechar}
          className="zc-press zc-press-shadow mt-7 w-full rounded-2xl bg-primary py-4 text-[0.85rem] font-black uppercase tracking-[0.08em] text-primary-foreground"
          style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
        >
          Pronto
        </button>

        <div className="mt-4 h-5">
          {escolhido && (
            <button
              type="button"
              onClick={() => definir(null)}
              className="text-[0.8rem] font-black uppercase tracking-[0.08em] text-primary transition-opacity duration-150 hover:opacity-70"
            >
              Limpar status
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
