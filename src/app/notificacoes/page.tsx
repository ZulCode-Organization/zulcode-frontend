"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BellSimple } from "@phosphor-icons/react/dist/ssr";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { buscarNotificacoes, marcarLidas, personalizar, type Notificacao } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

/** "há 5 min", "ontem", na língua da tela. */
function quando(data: string, idioma: string) {
  const segundos = (new Date(data).getTime() - Date.now()) / 1000;
  const formato = new Intl.RelativeTimeFormat(idioma, { numeric: "auto" });
  const passos: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unidade, tamanho] of passos) {
    if (Math.abs(segundos) >= tamanho) return formato.format(Math.round(segundos / tamanho), unidade);
  }
  return formato.format(0, "second");
}

function CaixaDeNotificacoes() {
  const t = useTranslations("notificacoes");
  const idioma = useLocale();
  const router = useRouter();
  const { perfil } = usePerfil();
  const [itens, setItens] = useState<Notificacao[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    void buscarNotificacoes().then((lista) => {
      if (!vivo) return;
      if (!lista) {
        setErro(true);
        return;
      }
      setItens(lista);
      // Abrir a caixa é ler: o destaque de "nova" fica só nesta visita.
      if (lista.some((item) => !item.lida)) void marcarLidas();
    });
    return () => {
      vivo = false;
    };
  }, []);

  const abrir = (item: Notificacao) => {
    if (item.rota) router.push(item.rota);
  };

  return (
    <div className="animate-fade-in-up pt-1">
      <h1 className="text-2xl font-black sm:text-3xl">{t("titulo")}</h1>
      <p className="mt-1.5 text-[0.92rem] text-muted-foreground">{t("subtitulo")}</p>

      {erro && <p className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm font-bold text-destructive">{t("erro")}</p>}

      {!erro && itens === null && (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[20px] bg-muted" />
          ))}
        </div>
      )}

      {itens?.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center">
          <Image src="/mascot.png" alt="" width={140} height={140} className="opacity-90" />
          <p className="mt-4 text-lg font-black">{t("vazio.titulo")}</p>
          <p className="mt-1.5 max-w-xs text-[0.9rem] text-muted-foreground">{t("vazio.texto")}</p>
        </div>
      )}

      {!!itens?.length && (
        <ul className="mt-6 flex flex-col gap-3">
          {itens.map((item, indice) => {
            const conteudo = (
              <>
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    item.lida ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                  )}
                >
                  <BellSimple weight="duotone" className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <b className="min-w-0 break-words text-[0.95rem] font-black">{personalizar(item.titulo, perfil?.nome)}</b>
                    {!item.lida && (
                      <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-primary-foreground">
                        {t("nova")}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap break-words text-[0.87rem] leading-snug text-muted-foreground">
                    {personalizar(item.texto, perfil?.nome)}
                  </span>
                  <span className="mt-2 block text-[0.72rem] font-bold text-muted-foreground/80">{quando(item.criadaEm, idioma)}</span>
                </span>
                {item.rota && <ChevronRight className="mt-3 size-4.5 shrink-0 text-muted-foreground" />}
              </>
            );
            const classe = cn(
              "flex w-full items-start gap-3.5 rounded-[20px] border bg-card p-4 text-left",
              item.lida ? "border-border" : "border-primary/40",
            );
            return (
              <li key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(indice, 8) * 35}ms` }}>
                {item.rota ? (
                  <button type="button" onClick={() => abrir(item)} className={cn(classe, "transition-colors hover:bg-muted/40")}>
                    {conteudo}
                  </button>
                ) : (
                  <div className={classe}>{conteudo}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function NotificacoesPage() {
  useRequireAuth();
  return (
    <AppShell rightPanel={<SideFooter />}>
      <CaixaDeNotificacoes />
    </AppShell>
  );
}
