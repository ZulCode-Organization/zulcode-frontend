"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Bell, BellRing, ChevronRight, Languages, Loader2, LogOut, Palette, ShieldCheck, Smartphone, Sun, Target, Volume2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparSeguidos } from "@/hooks/use-seguir";
import { limparCursosCache } from "@/hooks/use-cursos";
import { limparWidgetDaOfensiva } from "@/lib/widget-ofensiva";
import { ativarNotificacoesNativas, type CodigoPush } from "@/lib/push-notifications";
import { mudarPreferencia, usePreferencias } from "@/lib/preferencias";
import { IDIOMAS, NOME_DO_IDIOMA, type Idioma } from "@/i18n/idiomas";
import { cn } from "@/lib/utils";

const semAssinatura = () => () => {};

/** Os mesmos degraus que o servidor aceita (e as conquistas de constância usam). */
const METAS = [5, 10, 15, 30, 60] as const;

const classeDaLinha = "flex w-full items-center gap-3.5 border-b border-border px-4 py-4 text-left last:border-0 sm:px-5";

/**
 * Uma linha de configuração.
 *
 * A tela é uma lista de linhas, e não uma grade de cards. Card serve pra
 * conteúdo que se compara lado a lado; ajuste é coisa que se percorre de cima
 * pra baixo procurando um nome. A lista funciona igual no celular e no
 * computador.
 */
function Linha({
  Icone, titulo, descricao, cor = "text-primary", href, onClick, acessorio, destaque = false,
}: {
  Icone: typeof Sun; titulo: string; descricao: ReactNode; cor?: string; href?: string; onClick?: () => void; acessorio?: ReactNode; destaque?: boolean;
}) {
  const conteudo = (
    <>
      <IconeDaLinha Icone={Icone} cor={cor} />
      <Textos titulo={titulo} descricao={descricao} destaque={destaque} />
      {acessorio ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );
  const classe = cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50");
  if (href) return <Link href={href} className={classe}>{conteudo}</Link>;
  if (!onClick) return <div className={classeDaLinha}>{conteudo}</div>;
  return <button type="button" onClick={onClick} className={classe}>{conteudo}</button>;
}

function IconeDaLinha({ Icone, cor }: { Icone: typeof Sun; cor: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-muted", cor)}>
      <Icone className="size-5" />
    </span>
  );
}

function Textos({ titulo, descricao, destaque = false }: { titulo: ReactNode; descricao: ReactNode; destaque?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={cn("block text-[0.92rem] font-black", destaque && "text-destructive")}>{titulo}</span>
      <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted-foreground">{descricao}</span>
    </span>
  );
}

/**
 * Uma linha que liga e desliga. A linha inteira é o interruptor (é a área que
 * o dedo acerta), e o leitor de tela a anuncia como tal.
 */
function LinhaInterruptor({ Icone, titulo, descricao, ligado, aoMudar }: { Icone: typeof Sun; titulo: string; descricao: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)} className={cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50")}>
      <IconeDaLinha Icone={Icone} cor="text-primary" />
      <Textos titulo={titulo} descricao={descricao} />
      <span aria-hidden className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none", ligado ? "bg-primary" : "bg-muted-foreground/30")}>
        <span className={cn("absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none", ligado && "translate-x-5")} />
      </span>
    </button>
  );
}

/** Uma linha com opções lado a lado embaixo do título (língua, meta diária). */
function LinhaDeEscolha({ Icone, titulo, descricao, children }: { Icone: typeof Sun; titulo: string; descricao: ReactNode; children: ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-0 sm:px-5">
      <div className="flex items-center gap-3.5">
        <IconeDaLinha Icone={Icone} cor="text-primary" />
        <Textos titulo={titulo} descricao={descricao} />
      </div>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Opcao({ ativa, aoEscolher, desabilitada, children }: { ativa: boolean; aoEscolher: () => void; desabilitada?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      disabled={desabilitada}
      onClick={aoEscolher}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-center transition-colors duration-150 disabled:opacity-60",
        ativa ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{titulo}</h2>
      <div className="mt-2 overflow-hidden rounded-[20px] border border-border bg-card">{children}</div>
    </section>
  );
}

export function SettingsContent() {
  const t = useTranslations("configuracoes");
  const router = useRouter();
  const idiomaDaTela = useLocale();
  const { perfil, salvarDados } = usePerfil();
  const { resolvedTheme } = useTheme();
  const preferencias = usePreferencias();
  // O servidor não sabe o tema (ele mora no navegador): até a tela montar, o
  // resumo diz "Claro" igual ao HTML que veio do servidor, e só então mostra o
  // tema de verdade. Sem isso o React acusa texto diferente na hidratação.
  const montado = useSyncExternalStore(semAssinatura, () => true, () => false);

  const [push, setPush] = useState<{ ativando: boolean; codigo: CodigoPush | null }>({ ativando: false, codigo: null });
  const [salvando, setSalvando] = useState<"idioma" | "meta" | null>(null);
  const [erro, setErro] = useState<"idioma" | "meta" | null>(null);

  // A troca de língua na tela é feita pela sincronização do perfil (ver
  // use-idioma.ts): aqui só se salva na conta. Enquanto a conta e a tela não
  // batem, a escolha aparece como "trocando".
  const idiomaEscolhido = (perfil?.idioma ?? idiomaDaTela) as Idioma;
  const trocandoIdioma = salvando === "idioma" || Boolean(perfil?.idioma && perfil.idioma !== idiomaDaTela);

  const escolherIdioma = async (idioma: Idioma) => {
    if (idioma === idiomaEscolhido && idioma === idiomaDaTela) return;
    setSalvando("idioma");
    setErro(null);
    const resultado = await salvarDados({ idioma });
    if (!resultado.ok) setErro("idioma");
    setSalvando(null);
  };

  const escolherMeta = async (metaDiaria: number) => {
    if (metaDiaria === perfil?.metaDiaria) return;
    setSalvando("meta");
    setErro(null);
    const resultado = await salvarDados({ metaDiaria });
    if (!resultado.ok) setErro("meta");
    setSalvando(null);
  };

  const ativarPush = async () => {
    setPush({ ativando: true, codigo: null });
    const resultado = await ativarNotificacoesNativas();
    setPush({ ativando: false, codigo: resultado.codigo });
  };

  const sair = () => {
    localStorage.removeItem("accessToken");
    void limparWidgetDaOfensiva();
    limparPerfilCache();
    limparTrilhaCache();
    limparSeguidos();
    limparCursosCache();
    router.replace("/welcome");
  };

  return (
    <div className="pt-5 sm:pt-6">
      <p className="text-sm font-black uppercase tracking-wider text-primary">{t("rotulo")}</p>
      <h1 className="mt-1.5 text-2xl font-black sm:text-3xl">{t("titulo")}</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted-foreground">{t("subtitulo")}</p>

      <Grupo titulo={t("grupos.aparencia")}>
        <Linha
          Icone={Palette}
          titulo={t("aparencia.titulo")}
          // O resumo diz o estado atual, pra pessoa não precisar entrar na
          // tela só pra descobrir em que tema está.
          descricao={t("aparencia.resumo", { modo: montado && resolvedTheme === "dark" ? "dark" : "light", personalizada: perfil?.themeColor ? "sim" : "nao" })}
          href="/configuracoes/temas"
          acessorio={
            <span className="flex shrink-0 items-center gap-2">
              <span className="size-5 rounded-md border border-black/10" style={{ background: perfil?.themeColor ?? "var(--primary)" }} aria-hidden />
              <ChevronRight className="size-4 text-muted-foreground" />
            </span>
          }
        />
      </Grupo>

      <Grupo titulo={t("grupos.idioma")}>
        <LinhaDeEscolha
          Icone={trocandoIdioma ? Loader2 : Languages}
          titulo={t("idioma.titulo")}
          descricao={erro === "idioma" ? <span className="font-bold text-destructive">{t("idioma.erro")}</span> : t("idioma.descricao")}
        >
          <div role="radiogroup" aria-label={t("idioma.titulo")} className="grid grid-cols-2 gap-2">
            {IDIOMAS.map((idioma) => (
              <Opcao key={idioma} ativa={idiomaEscolhido === idioma} desabilitada={trocandoIdioma} aoEscolher={() => void escolherIdioma(idioma)}>
                <span lang={idioma === "en" ? "en" : "pt-BR"} className="flex items-center gap-1.5 text-[0.9rem] font-black">
                  {NOME_DO_IDIOMA[idioma]}
                  {idioma === "en" && <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[0.6rem] font-black tracking-wide text-amber-700 dark:text-amber-300">{t("idioma.beta")}</span>}
                </span>
              </Opcao>
            ))}
          </div>
          {idiomaEscolhido === "en" && <p className="mt-2.5 text-[0.75rem] leading-snug text-muted-foreground">{t("idioma.avisoBeta")}</p>}
        </LinhaDeEscolha>
      </Grupo>

      <Grupo titulo={t("grupos.estudo")}>
        <LinhaDeEscolha
          Icone={salvando === "meta" ? Loader2 : Target}
          titulo={t("estudo.meta")}
          descricao={erro === "meta" ? <span className="font-bold text-destructive">{t("estudo.erro")}</span> : t("estudo.descricao")}
        >
          <div role="radiogroup" aria-label={t("estudo.meta")} className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {METAS.map((minutos) => (
              <Opcao key={minutos} ativa={(perfil?.metaDiaria ?? 10) === minutos} desabilitada={salvando === "meta" || !perfil} aoEscolher={() => void escolherMeta(minutos)}>
                <span className="whitespace-nowrap text-[0.8rem] font-black tabular-nums">{t("estudo.minutos", { n: minutos })}</span>
                <span className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wide opacity-75">{t(`estudo.nivel.${minutos}`)}</span>
              </Opcao>
            ))}
          </div>
        </LinhaDeEscolha>
      </Grupo>

      <Grupo titulo={t("grupos.som")}>
        <LinhaInterruptor Icone={Volume2} titulo={t("som.efeitos")} descricao={t("som.efeitosDescricao")} ligado={preferencias.sons} aoMudar={(v) => mudarPreferencia("sons", v)} />
        <LinhaInterruptor Icone={Smartphone} titulo={t("som.vibracao")} descricao={t("som.vibracaoDescricao")} ligado={preferencias.vibracao} aoMudar={(v) => mudarPreferencia("vibracao", v)} />
      </Grupo>

      <Grupo titulo={t("grupos.avisos")}>
        <Linha
          Icone={push.ativando ? Loader2 : Bell}
          titulo={t("avisos.titulo")}
          descricao={push.codigo ? t(`avisos.resultado.${push.codigo}`) : t("avisos.descricao")}
          onClick={ativarPush}
          acessorio={
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-primary-foreground">
              {push.ativando ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
              {push.ativando ? t("avisos.ativando") : t("avisos.ativar")}
            </span>
          }
        />
      </Grupo>

      <Grupo titulo={t("grupos.conta")}>
        {perfil?.publicCode && (
          <Linha
            Icone={ShieldCheck}
            titulo={t("conta.codigo")}
            descricao={t("conta.codigoDescricao")}
            acessorio={<span className="shrink-0 text-[0.85rem] font-black text-muted-foreground">#{perfil.publicCode}</span>}
          />
        )}
        <Linha
          Icone={LogOut}
          titulo={t("conta.sair")}
          descricao={t("conta.sairDescricao")}
          cor="text-destructive"
          destaque
          onClick={sair}
          acessorio={<ChevronRight className="size-4 shrink-0 text-destructive/60" />}
        />
      </Grupo>

      {/* A licença da Solar (CC BY 4.0) pede crédito visível. */}
      <p className="px-1 pb-2 pt-6 text-center text-[0.7rem] font-semibold leading-relaxed text-muted-foreground/70">{t("creditos")}</p>
    </div>
  );
}
