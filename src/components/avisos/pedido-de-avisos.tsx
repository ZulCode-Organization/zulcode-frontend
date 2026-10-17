"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTextosDosAvisos } from "@/hooks/use-avisos";
import { abrirConfiguracoesDeAvisos } from "@/lib/avisos";
import { adiarPedidoDeAvisos, ativarAvisosNesteAparelho, horaDePedirAvisos, situacaoDosAvisos } from "@/lib/ativar-avisos";
import { ZulDaAula } from "@/components/atividade/zul-da-aula";
import "@/components/atividade/aula.css";

/**
 * O pedido das notificações em tela cheia: aparece na primeira vez que a
 * pessoa abre o app e, se ela deixar para depois, volta de tempos em tempos
 * (3, 7, 14 e depois a cada 30 dias). Nunca trava o app: o "Agora não" sempre
 * deixa seguir. Bloqueadas no aparelho, o botão leva aos ajustes dele.
 */
export function PedidoDeAvisos() {
  const t = useTranslations("avisos.pedido");
  const textos = useTextosDosAvisos();
  const [situacao, setSituacao] = useState<"pedir" | "bloqueadas" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!localStorage.getItem("accessToken") || !horaDePedirAvisos()) return;
    // Um respiro depois de abrir: o pedido não cobre a tela antes de ela aparecer.
    const espera = window.setTimeout(() => {
      void situacaoDosAvisos().then((s) => vivo && setSituacao(s));
    }, 1200);
    return () => {
      vivo = false;
      window.clearTimeout(espera);
    };
  }, []);

  // Quem volta dos ajustes do aparelho pode ter liberado lá.
  useEffect(() => {
    if (situacao !== "bloqueadas") return;
    const aoVoltar = async () => {
      if (document.visibilityState !== "visible") return;
      const agora = await situacaoDosAvisos();
      if (agora === "bloqueadas") return;
      // Liberou nos ajustes: termina a ativação (lembrete, aparelho, conta) e fecha.
      if (agora === null) await ativarAvisosNesteAparelho(textos);
      setSituacao(agora === "pedir" ? "pedir" : null);
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [situacao, textos]);

  if (!situacao) return null;

  const fechar = () => {
    adiarPedidoDeAvisos();
    setSituacao(null);
  };

  const ativar = async () => {
    if (situacao === "bloqueadas") {
      await abrirConfiguracoesDeAvisos();
      return;
    }
    setOcupado(true);
    setFalhou(false);
    try {
      const { resultado } = await ativarAvisosNesteAparelho(textos);
      if (resultado === "ativado") setSituacao(null);
      else if (resultado === "bloqueadas") setSituacao("bloqueadas");
      else if (resultado === "recusado") fechar();
      else setFalhou(true);
    } finally {
      setOcupado(false);
    }
  };

  const bloqueadas = situacao === "bloqueadas";

  return (
    <div
      className="zc-aula fixed inset-0 z-[60] flex flex-col bg-background px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pedido-de-avisos-titulo"
    >
      <div className="zc-aula-entra mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 text-center">
        <ZulDaAula pose={bloqueadas ? "derretido" : "correndo"} caiu className="size-52" />
        <h1 id="pedido-de-avisos-titulo" className="text-[1.75rem] font-black leading-tight text-foreground">
          {bloqueadas ? t("bloqueadasTitulo") : t("titulo")}
        </h1>
        <p className="text-[1rem] font-semibold leading-relaxed text-muted-foreground">{bloqueadas ? t("bloqueadasTexto") : t("texto")}</p>
        {falhou && <p className="text-[0.85rem] font-bold text-destructive">{t("falha")}</p>}
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
        <button type="button" onClick={() => void ativar()} disabled={ocupado} className="zc-aula-botao">
          {ocupado && <Loader2 className="size-5 animate-spin" />}
          {ocupado ? t("ativando") : bloqueadas ? t("abrirAjustes") : t("ativar")}
        </button>
        <button type="button" onClick={fechar} className="py-3 text-[0.85rem] font-black uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
          {t("agoraNao")}
        </button>
      </div>
    </div>
  );
}
