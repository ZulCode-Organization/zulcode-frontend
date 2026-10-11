"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Bell, BellRing, Check, Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  abrirConfiguracoesDeAvisos, configurarLembrete, estadoDosAvisos, mostrarExemploDeAviso, pedirPermissaoDeAvisos,
  type EstadoDosAvisos,
} from "@/lib/avisos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";
import { useTextosDosAvisos } from "@/hooks/use-avisos";
import { classeDaLinha, Grupo, IconeDaLinha, Linha, LinhaInterruptor, Textos } from "./linhas";

/** Marca que a pessoa já mexeu no lembrete: daí em diante, ligar as notificações não o religa sozinho. */
const ESCOLHEU_LEMBRETE = "zc-lembrete-escolhido";

const doisDigitos = (n: number) => String(n).padStart(2, "0");

type Disponivel = "carregando" | "sim" | "semApp" | "atualize";

/**
 * Os avisos nas Configurações: liberar as notificações, o lembrete de estudo
 * (liga, desliga e horário) e um exemplo para ver como ele aparece.
 *
 * Ao liberar as notificações pela primeira vez, o lembrete já vem ligado às
 * 19h — é o aviso que mais ajuda a manter a ofensiva, e quem não quiser
 * desliga aqui mesmo.
 */
export function GrupoDeAvisos() {
  const t = useTranslations("configuracoes");
  const textos = useTextosDosAvisos();
  const [disponivel, setDisponivel] = useState<Disponivel>("carregando");
  const [estado, setEstado] = useState<EstadoDosAvisos | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      const lido = Capacitor.isNativePlatform() ? await estadoDosAvisos() : null;
      if (!vivo) return;
      setDisponivel(!Capacitor.isNativePlatform() ? "semApp" : lido ? "sim" : "atualize");
      setEstado(lido);
    })();
    // Quem volta das configurações do Android pode ter liberado lá.
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void estadoDosAvisos().then((e) => e && vivo && setEstado(e));
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  const jaEscolheu = () => {
    try {
      return localStorage.getItem(ESCOLHEU_LEMBRETE) === "1";
    } catch {
      return false;
    }
  };
  const marcarEscolha = () => {
    try {
      localStorage.setItem(ESCOLHEU_LEMBRETE, "1");
    } catch {
      // Sem armazenamento, o pior caso é o lembrete religar uma vez.
    }
  };

  const ativar = async () => {
    setOcupado(true);
    let novo = await pedirPermissaoDeAvisos();
    if (novo && !novo.ativas && novo.permissao === "denied") {
      // O Android não pergunta mais depois de duas recusas: só pelas configurações dele.
      await abrirConfiguracoesDeAvisos();
    } else if (novo?.ativas) {
      if (!novo.lembrete.ativo && !jaEscolheu()) novo = await configurarLembrete({ ativo: true, hora: 19, minuto: 0, textos });
      // Com o Firebase no APK, o aparelho também passa a receber os avisos do servidor.
      if (novo?.firebase) void ativarNotificacoesNativas();
    }
    if (novo) setEstado(novo);
    setOcupado(false);
  };

  const mudarLembrete = async (ativo: boolean) => {
    marcarEscolha();
    if (ativo && !estado?.ativas) {
      const permitido = await pedirPermissaoDeAvisos();
      if (!permitido?.ativas) {
        if (permitido) setEstado(permitido);
        return;
      }
    }
    const novo = await configurarLembrete({ ativo, textos });
    if (novo) setEstado(novo);
  };

  const mudarHorario = async (valor: string) => {
    const [hora, minuto] = valor.split(":").map(Number);
    if (!Number.isInteger(hora) || !Number.isInteger(minuto)) return;
    marcarEscolha();
    const novo = await configurarLembrete({ hora, minuto });
    if (novo) setEstado(novo);
  };

  if (disponivel !== "sim" || !estado) {
    return (
      <Grupo titulo={t("grupos.avisos")}>
        <Linha
          Icone={disponivel === "carregando" ? Loader2 : Bell}
          titulo={t("avisos.titulo")}
          descricao={disponivel === "carregando" ? t("avisos.descricao") : disponivel === "semApp" ? t("avisos.resultado.semApp") : t("avisos.atualizeApp")}
          acessorio={<span />}
        />
      </Grupo>
    );
  }

  const lembreteLigado = estado.ativas && estado.lembrete.ativo;
  const horario = `${doisDigitos(estado.lembrete.hora)}:${doisDigitos(estado.lembrete.minuto)}`;

  return (
    <Grupo titulo={t("grupos.avisos")}>
      <Linha
        Icone={ocupado ? Loader2 : Bell}
        titulo={t("avisos.titulo")}
        descricao={estado.ativas ? t("avisos.ativas") : estado.permissao === "denied" ? t("avisos.bloqueadas") : t("avisos.desativadas")}
        onClick={estado.ativas ? undefined : ativar}
        acessorio={
          estado.ativas ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4.5" strokeWidth={3} />
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-primary-foreground">
              {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
              {ocupado ? t("avisos.ativando") : t("avisos.ativar")}
            </span>
          )
        }
      />
      <LinhaInterruptor
        Icone={AlarmClock}
        titulo={t("avisos.lembrete.titulo")}
        descricao={t("avisos.lembrete.descricao")}
        ligado={lembreteLigado}
        aoMudar={(v) => void mudarLembrete(v)}
      />
      {lembreteLigado && (
        <label className={classeDaLinha}>
          <span className="w-10 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-[0.85rem] font-bold text-muted-foreground">{t("avisos.lembrete.horario")}</span>
          <input
            type="time"
            value={horario}
            onChange={(e) => void mudarHorario(e.target.value)}
            className="rounded-xl border-2 border-border bg-background px-3 py-2 text-[0.95rem] font-black tabular-nums text-foreground outline-none focus:border-primary"
          />
        </label>
      )}
      {estado.ativas && (
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
      )}
    </Grupo>
  );
}
