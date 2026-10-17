"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * A moldura das telas de configuração: o título no meio, "PRONTO" à direita e,
 * nas telas de dentro, a seta para voltar à lista. O cabeçalho gruda no topo
 * enquanto a lista rola.
 */
export function TelaDeConfig({ titulo, voltar = false, children }: { titulo: string; voltar?: boolean; children: ReactNode }) {
  const t = useTranslations("configuracoes");
  const router = useRouter();

  // Na lista principal, "Pronto" fecha as configurações e volta para onde a
  // pessoa estava; nas telas de dentro, volta para a lista.
  const pronto = () => {
    if (voltar) router.push("/configuracoes");
    else if (window.history.length > 1) router.back();
    else router.push("/perfil");
  };

  return (
    <div className="pb-8">
      <header className="sticky top-[var(--zc-topbar-h,0px)] z-10 -mx-4 mb-5 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b-2 border-border bg-background px-4 lg:-mx-8 lg:px-8">
        <span>
          {voltar && (
            <Link href="/configuracoes" aria-label={t("voltar")} className="-ml-2 flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
              <ChevronLeft className="size-6" strokeWidth={2.8} />
            </Link>
          )}
        </span>
        <h1 className="text-[1.15rem] font-black text-muted-foreground">{titulo}</h1>
        <button type="button" onClick={pronto} className="justify-self-end rounded-lg px-1 py-2 text-[0.95rem] font-black uppercase tracking-[0.04em] text-primary hover:opacity-80">
          {t("pronto")}
        </button>
      </header>
      {children}
    </div>
  );
}
