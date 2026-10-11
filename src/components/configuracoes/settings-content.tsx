"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ChevronRight, Languages, Loader2, LogOut, Palette, ShieldCheck, Smartphone, Target, Volume2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparSeguidos } from "@/hooks/use-seguir";
import { limparCursosCache } from "@/hooks/use-cursos";
import { limparWidgetDaOfensiva } from "@/lib/widget-ofensiva";
import { limparAvisos } from "@/lib/avisos";
import { mudarPreferencia, usePreferencias } from "@/lib/preferencias";
import { IDIOMAS, NOME_DO_IDIOMA, type Idioma } from "@/i18n/idiomas";
import { Grupo, Linha, LinhaDeEscolha, LinhaInterruptor, Opcao } from "./linhas";
import { GrupoDeAvisos } from "./avisos";
import { GrupoDeWidgets } from "./widgets";

const semAssinatura = () => () => {};

/** Os mesmos degraus que o servidor aceita (e as conquistas de constância usam). */
const METAS = [5, 10, 15, 30, 60] as const;

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

  const sair = () => {
    localStorage.removeItem("accessToken");
    void limparWidgetDaOfensiva();
    void limparAvisos();
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

      <GrupoDeAvisos />

      <GrupoDeWidgets />

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
