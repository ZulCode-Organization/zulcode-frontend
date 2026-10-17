"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { useTranslations } from "next-intl";
import { limparPerfilCache, usePerfil } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparSeguidos } from "@/hooks/use-seguir";
import { limparCursosCache, useCursos } from "@/hooks/use-cursos";
import { limparWidgetDaOfensiva } from "@/lib/widget-ofensiva";
import { limparAvisos } from "@/lib/avisos";
import { esquecerEsteAparelho } from "@/lib/notificacoes";
import { FORMULARIO_DE_RETORNO } from "@/components/app-shell/nav-items";
import { SeloPro } from "@/components/shared/selo-pro";
import { Grupo, Linha } from "./linhas";
import { TelaDeConfig } from "./tela";

const semAssinatura = () => () => {};

/**
 * As configurações, no jeito dos ajustes do Duolingo: grupos (Conta,
 * Assinatura, Suporte) de linhas com seta, cada uma abrindo a sua tela; o
 * "Sair" de contorno no fim e os links de termos, privacidade e créditos.
 */
export function SettingsContent() {
  const t = useTranslations("configuracoes");
  const router = useRouter();
  const { perfil } = usePerfil();
  const { cursos, cursoAtual } = useCursos();
  // Widgets só existem no app Android. No servidor (e antes de montar) a
  // linha fica de fora, igual ao primeiro desenho do navegador.
  const noAndroid = useSyncExternalStore(semAssinatura, () => Capacitor.getPlatform() === "android", () => false);
  const curso = cursos.find((item) => item.id === cursoAtual);

  const sair = () => {
    // Antes de apagar o token: o servidor precisa dele para esquecer o aparelho.
    void esquecerEsteAparelho();
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
    <TelaDeConfig titulo={t("titulo")}>
      <Grupo titulo={t("grupos.conta")}>
        <Linha titulo={t("linhas.preferencias")} href="/configuracoes/preferencias" />
        <Linha titulo={t("linhas.perfil")} href="/perfil" />
        <Linha titulo={t("linhas.notificacoes")} href="/configuracoes/notificacoes" />
        <Linha titulo={t("linhas.cursos")} valor={curso?.name} href="/configuracoes/cursos" />
        {noAndroid && <Linha titulo={t("linhas.widgets")} href="/configuracoes/widgets" />}
        <Linha titulo={t("linhas.privacidade")} href="/configuracoes/privacidade" />
      </Grupo>

      <Grupo titulo={t("grupos.assinatura")}>
        <Linha
          titulo={perfil?.isPro ? t("linhas.assinatura") : t("linhas.plano")}
          valor={<SeloPro className="h-5" />}
          href="/pro"
        />
      </Grupo>

      <Grupo titulo={t("grupos.suporte")}>
        <Linha titulo={t("linhas.ajuda")} href="/configuracoes/ajuda" />
        <Linha titulo={t("linhas.problema")} href={FORMULARIO_DE_RETORNO} externo />
        <Linha titulo={t("linhas.comentarios")} href={FORMULARIO_DE_RETORNO} externo />
      </Grupo>

      <button
        type="button"
        onClick={sair}
        className="mt-8 h-[52px] w-full rounded-2xl border-2 border-border text-[0.95rem] font-black uppercase tracking-[0.06em] text-primary shadow-[0_4px_0_var(--border)] transition-transform active:translate-y-1 active:shadow-none"
      >
        {t("sair")}
      </button>

      <nav className="mt-8 flex flex-col items-start gap-3" aria-label={t("titulo")}>
        <Link href="/termos" className="text-[0.88rem] font-black uppercase tracking-[0.05em] text-primary hover:opacity-80">{t("links.termos")}</Link>
        <Link href="/politica-de-privacidade" className="text-[0.88rem] font-black uppercase tracking-[0.05em] text-primary hover:opacity-80">{t("links.politica")}</Link>
        <Link href="/agradecimentos" className="text-[0.88rem] font-black uppercase tracking-[0.05em] text-primary hover:opacity-80">{t("links.agradecimentos")}</Link>
      </nav>
    </TelaDeConfig>
  );
}
