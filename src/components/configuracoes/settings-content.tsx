"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellRing, ChevronRight, Loader2, LogOut, Palette, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparCursosCache } from "@/hooks/use-cursos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";
import { cn } from "@/lib/utils";

/**
 * Uma linha de configuração.
 *
 * A tela virou lista de linhas, e não uma grade de cards. Card serve pra
 * conteúdo que se compara lado a lado; ajuste é coisa que se percorre de cima
 * pra baixo procurando um nome. A lista funciona igual no celular e no
 * computador — a grade de duas colunas quebrava e virava uma pilha de caixas
 * altas no telefone.
 */
function Linha({
  Icone,
  titulo,
  descricao,
  cor = "text-primary",
  href,
  onClick,
  acessorio,
  destaque = false,
}: {
  Icone: typeof Sun;
  titulo: string;
  descricao: string;
  cor?: string;
  href?: string;
  onClick?: () => void;
  acessorio?: React.ReactNode;
  destaque?: boolean;
}) {
  const conteudo = (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-muted", cor)}>
        <Icone className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[0.92rem] font-black", destaque && "text-destructive")}>{titulo}</span>
        <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted-foreground">{descricao}</span>
      </span>
      {acessorio ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  const classe =
    "flex w-full items-center gap-3.5 border-b border-border px-4 py-4 text-left transition-colors duration-150 last:border-0 hover:bg-muted/50 sm:px-5";

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{titulo}</h2>
      <div className="mt-2 overflow-hidden rounded-[20px] border border-border bg-card">{children}</div>
    </section>
  );
}

export function SettingsContent() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const { resolvedTheme } = useTheme();
  const [pushMensagem, setPushMensagem] = useState<string | null>(null);
  const [ativandoPush, setAtivandoPush] = useState(false);

  const ativarPush = async () => {
    setAtivandoPush(true);
    const resultado = await ativarNotificacoesNativas();
    setPushMensagem(resultado.mensagem);
    setAtivandoPush(false);
  };

  const sair = () => {
    localStorage.removeItem("accessToken");
    limparPerfilCache();
    limparTrilhaCache();
    limparCursosCache();
    router.replace("/welcome");
  };

  // O resumo da linha de aparência diz o estado atual, pra pessoa não precisar
  // entrar na tela só pra descobrir em que tema está.
  const modo = resolvedTheme === "dark" ? "Escuro" : "Claro";
  const resumoAparencia = perfil?.themeColor ? `${modo} · paleta personalizada` : `${modo} · paleta padrão`;

  return (
    <div className="pt-5 sm:pt-6">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Conta</p>
      <h1 className="mt-1.5 text-2xl font-black sm:text-3xl">Configurações</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted-foreground">
        Ajuste a aparência e as permissões do aplicativo.
      </p>

      <Grupo titulo="Aparência">
        <Linha
          Icone={Palette}
          titulo="Tema e paleta"
          descricao={resumoAparencia}
          href="/configuracoes/temas"
          acessorio={
            <span className="flex shrink-0 items-center gap-2">
              <span
                className="size-5 rounded-md border border-black/10"
                style={{ background: perfil?.themeColor ?? "var(--primary)" }}
                aria-hidden
              />
              <ChevronRight className="size-4 text-muted-foreground" />
            </span>
          }
        />
      </Grupo>

      <Grupo titulo="Avisos">
        <Linha
          Icone={ativandoPush ? Loader2 : Bell}
          titulo="Notificações"
          descricao={pushMensagem ?? "Receba avisos e novidades no seu aparelho."}
          onClick={ativarPush}
          acessorio={
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-primary-foreground">
              {ativandoPush ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
              {ativandoPush ? "Ativando" : "Ativar"}
            </span>
          }
        />
      </Grupo>

      <Grupo titulo="Conta">
        {perfil?.publicCode && (
          <Linha
            Icone={ShieldCheck}
            titulo="Seu código"
            descricao="É por ele que outras pessoas encontram seu perfil."
            acessorio={<span className="shrink-0 text-[0.85rem] font-black text-muted-foreground">#{perfil.publicCode}</span>}
          />
        )}
        <Linha
          Icone={LogOut}
          titulo="Sair da conta"
          descricao="Encerra a sessão neste aparelho."
          cor="text-destructive"
          destaque
          onClick={sair}
          acessorio={<ChevronRight className="size-4 shrink-0 text-destructive/60" />}
        />
      </Grupo>
    </div>
  );
}
