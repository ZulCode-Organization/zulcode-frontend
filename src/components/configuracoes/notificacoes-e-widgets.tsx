"use client";

import { useTranslations } from "next-intl";
import { GrupoDeAvisos } from "./avisos";
import { GrupoDeWidgets } from "./widgets";
import { TelaDeConfig } from "./tela";

/** As notificações do aparelho (lembrete, exemplo, permissão) numa tela só delas. */
export function NotificacoesContent() {
  const t = useTranslations("configuracoes");
  return (
    <TelaDeConfig titulo={t("linhas.notificacoes")} voltar>
      <GrupoDeAvisos />
    </TelaDeConfig>
  );
}

/** Os widgets da tela inicial do Android. */
export function WidgetsContent() {
  const t = useTranslations("configuracoes");
  return (
    <TelaDeConfig titulo={t("linhas.widgets")} voltar>
      <GrupoDeWidgets />
    </TelaDeConfig>
  );
}
