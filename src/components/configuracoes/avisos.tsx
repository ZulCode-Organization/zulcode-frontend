"use client";

import { useEffect, useState } from "react";
import { Bell, Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  abrirConfiguracoesDeAvisos, configurarLembrete, estadoDosAvisos, mostrarExemploDeAviso, pedirPermissaoDeAvisos,
  type EstadoDosAvisos,
} from "@/lib/avisos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";
import { ativarWebPush, estadoNoServidor, salvarPreferencia, webPushAtivoNesteNavegador, type ResultadoDoSite } from "@/lib/notificacoes";
import { useTextosDosAvisos } from "@/hooks/use-avisos";
import { classeDaLinha, Grupo, IconeDaLinha, Linha, LinhaInterruptor, Textos } from "./linhas";

const doisDigitos = (n: number) => String(n).padStart(2, "0");

type Onde = "carregando" | "app" | "site" | "atualize";

/**
 * As notificações nas Configurações: uma chave só, que liga ou desliga tudo
 * (lembrete de estudo, amigos, liga e as novidades da equipe).
 *
 * No app Android ela pede a permissão do sistema, agenda o lembrete no
 * celular e registra o aparelho no Firebase; no site, inscreve o navegador
 * no Web Push. Em qualquer um, a escolha fica salva na conta: desligada, o
 * servidor não manda nada.
 */
export function GrupoDeAvisos() {
  const t = useTranslations("configuracoes");
  const textos = useTextosDosAvisos();
  const [onde, setOnde] = useState<Onde>("carregando");
  const [nativo, setNativo] = useState<EstadoDosAvisos | null>(null);
  const [naConta, setNaConta] = useState(true);
  const [noNavegador, setNoNavegador] = useState(false);
  const [aviso, setAviso] = useState<ResultadoDoSite | "bloqueadas" | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    const ler = async () => {
      const { Capacitor } = await import("@capacitor/core");
      const servidor = await estadoNoServidor();
      if (!vivo) return;
      if (servidor) setNaConta(servidor.ativas);
      if (Capacitor.isNativePlatform()) {
        const lido = await estadoDosAvisos();
        if (!vivo) return;
        setNativo(lido);
        setOnde(lido ? "app" : "atualize");
      } else {
        const ativo = await webPushAtivoNesteNavegador();
        if (!vivo) return;
        setNoNavegador(ativo);
        setOnde("site");
      }
    };
    void ler();
    // Quem volta das configurações do celular pode ter liberado lá.
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void ler();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  const ligadas = naConta && (onde === "app" ? Boolean(nativo?.ativas) : noNavegador);

  const ligar = async () => {
    setAviso(null);
    if (onde === "app") {
      let novo = await pedirPermissaoDeAvisos();
      if (novo && !novo.ativas && novo.permissao === "denied") {
        // O Android não pergunta mais depois de duas recusas: só pelas configurações dele.
        await abrirConfiguracoesDeAvisos();
        setAviso("bloqueadas");
      } else if (novo?.ativas) {
        novo = (await configurarLembrete({ ativo: true, textos })) ?? novo;
        if (novo.firebase) await ativarNotificacoesNativas();
        if (await salvarPreferencia(true)) setNaConta(true);
      }
      if (novo) setNativo(novo);
      return;
    }
    const resultado = await ativarWebPush();
    if (resultado === "ativado") {
      setNoNavegador(true);
      if (await salvarPreferencia(true)) setNaConta(true);
    } else {
      setAviso(resultado === "semPermissao" ? "bloqueadas" : resultado);
    }
  };

  const desligar = async () => {
    setAviso(null);
    if (await salvarPreferencia(false)) setNaConta(false);
    // O lembrete é agendado no próprio celular: desligar tudo também o cancela.
    if (onde === "app") {
      const novo = await configurarLembrete({ ativo: false });
      if (novo) setNativo(novo);
    }
  };

  const mudar = async (ligar_: boolean) => {
    setOcupado(true);
    try {
      await (ligar_ ? ligar() : desligar());
    } finally {
      setOcupado(false);
    }
  };

  const mudarHorario = async (valor: string) => {
    const [hora, minuto] = valor.split(":").map(Number);
    if (!Number.isInteger(hora) || !Number.isInteger(minuto)) return;
    const novo = await configurarLembrete({ hora, minuto });
    if (novo) setNativo(novo);
  };

  if (onde === "carregando" || onde === "atualize") {
    return (
      <Grupo titulo={t("grupos.avisos")}>
        <Linha
          Icone={onde === "carregando" ? Loader2 : Bell}
          titulo={t("avisos.titulo")}
          descricao={onde === "carregando" ? t("avisos.descricao") : t("avisos.atualizeApp")}
          acessorio={<span />}
        />
      </Grupo>
    );
  }

  const descricao = aviso
    ? aviso === "bloqueadas"
      ? t(onde === "app" ? "avisos.bloqueadas" : "avisos.bloqueadasSite")
      : t(`avisos.resultado.${aviso}`)
    : ligadas
      ? t("avisos.ligadas")
      : t("avisos.desligadas");

  return (
    <Grupo titulo={t("grupos.avisos")}>
      <LinhaInterruptor
        Icone={ocupado ? Loader2 : Bell}
        titulo={t("avisos.titulo")}
        descricao={descricao}
        ligado={ligadas}
        aoMudar={(v) => void mudar(v)}
      />
      {onde === "app" && ligadas && nativo && (
        <>
          <label className={classeDaLinha}>
            <span className="w-10 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 text-[0.85rem] font-bold text-muted-foreground">{t("avisos.lembrete.horario")}</span>
            <input
              type="time"
              value={`${doisDigitos(nativo.lembrete.hora)}:${doisDigitos(nativo.lembrete.minuto)}`}
              onChange={(e) => void mudarHorario(e.target.value)}
              className="rounded-xl border-2 border-border bg-background px-3 py-2 text-[0.95rem] font-black tabular-nums text-foreground outline-none focus:border-primary"
            />
          </label>
          <div className={classeDaLinha}>
            <IconeDaLinha Icone={Eye} cor="text-primary" />
            <Textos titulo={t("avisos.exemplo.titulo")} descricao={t("avisos.exemplo.descricao")} />
            <button
              type="button"
              onClick={() => void mostrarExemploDeAviso()}
              className="shrink-0 rounded-lg border-2 border-border px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-foreground hover:border-primary/50"
            >
              {t("avisos.exemplo.botao")}
            </button>
          </div>
        </>
      )}
    </Grupo>
  );
}
