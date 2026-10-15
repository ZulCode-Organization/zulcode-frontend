"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePerfil } from "@/hooks/use-perfil";
import { buscarNotificacoes, jaAvisadas, marcarAvisada, marcarLidas, personalizar, type Notificacao } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

/** Quanto tempo o aviso fica na tela antes de subir sozinho. */
const TEMPO_MS = 8000;

/**
 * A notificação nova desce do topo quando a pessoa abre o app, com a cara de
 * uma notificação do celular. É o que faz o recado do administrativo chegar
 * mesmo sem o Firebase: o push do sistema é um extra.
 *
 * Cada notificação desce uma vez. Fechar não é ler: ela continua marcada como
 * nova na caixa. Tocar abre a tela dela (ou a caixa) e conta como lida.
 */
export function AvisoAoAbrir() {
  const t = useTranslations("notificacoes");
  const router = useRouter();
  const caminho = usePathname();
  const { perfil } = usePerfil();
  const [aviso, setAviso] = useState<Notificacao | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (caminho === "/notificacoes") return;
    let vivo = true;
    void buscarNotificacoes().then((lista) => {
      if (!vivo || !lista) return;
      const avisadas = jaAvisadas();
      const nova = lista.find((item) => !item.lida && !avisadas.has(item.id));
      if (!nova) return;
      marcarAvisada(nova.id);
      setAviso(nova);
      requestAnimationFrame(() => setVisivel(true));
    });
    return () => {
      vivo = false;
    };
    // Só ao abrir o app: trocar de tela não traz o mesmo aviso de volta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visivel) return;
    const relogio = window.setTimeout(() => setVisivel(false), TEMPO_MS);
    return () => window.clearTimeout(relogio);
  }, [visivel]);

  if (!aviso) return null;

  const abrir = () => {
    setVisivel(false);
    void marcarLidas([aviso.id]);
    router.push(aviso.rota ?? "/notificacoes");
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-transform duration-300 ease-out motion-reduce:transition-none",
        visivel ? "translate-y-0" : "-translate-y-[130%]",
      )}
      onTransitionEnd={() => {
        if (!visivel) setAviso(null);
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[20px] border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur">
        <button type="button" onClick={abrir} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Image src="/mascot.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl bg-primary/10 object-contain p-0.5" />
          <span className="min-w-0 flex-1">
            <b className="line-clamp-1 text-[0.92rem] font-black">{personalizar(aviso.titulo, perfil?.nome)}</b>
            <span className="mt-0.5 line-clamp-2 text-[0.82rem] leading-snug text-muted-foreground">
              {personalizar(aviso.texto, perfil?.nome)}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setVisivel(false)}
          aria-label={t("fechar")}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
