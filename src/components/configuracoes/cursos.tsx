"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCursos } from "@/hooks/use-cursos";
import { LanguageIcon } from "@/components/onboarding/language-icon";
import { Grupo, classeDaLinha, Textos } from "./linhas";
import { TelaDeConfig } from "./tela";
import { cn } from "@/lib/utils";

/** Trocar o curso da Jornada. O progresso de cada curso continua guardado. */
export function CursosContent() {
  const t = useTranslations("configuracoes");
  const { cursos, cursoAtual, loading, selecionarCurso } = useCursos();
  const [trocando, setTrocando] = useState<string | null>(null);

  const trocar = async (slug: string) => {
    if (slug === cursoAtual || trocando) return;
    setTrocando(slug);
    await selecionarCurso(slug);
    setTrocando(null);
  };

  return (
    <TelaDeConfig titulo={t("cursos.titulo")} voltar>
      <p className="mb-5 px-0.5 text-[0.88rem] font-semibold leading-snug text-muted-foreground">{t("cursos.descricao")}</p>
      <Grupo>
        {loading && !cursos.length ? (
          <div className={classeDaLinha}><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : !cursos.length ? (
          <div className={classeDaLinha}><Textos titulo={t("cursos.vazio")} /></div>
        ) : (
          cursos.map((curso) => {
            const atual = curso.id === cursoAtual;
            return (
              <button
                key={curso.id}
                type="button"
                onClick={() => void trocar(curso.id)}
                aria-pressed={atual}
                className={cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50", atual && "bg-primary/5")}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                  <LanguageIcon id={curso.id} name={curso.name} className="size-6" />
                </span>
                <Textos titulo={curso.name} />
                {trocando === curso.id ? (
                  <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                ) : atual ? (
                  <span className="flex shrink-0 items-center gap-1 text-[0.8rem] font-black uppercase tracking-[0.04em] text-primary">
                    <Check className="size-4" strokeWidth={3} />
                    {t("cursos.atual")}
                  </span>
                ) : (
                  <span className="shrink-0 text-[0.8rem] font-black uppercase tracking-[0.04em] text-muted-foreground">{t("cursos.trocar")}</span>
                )}
              </button>
            );
          })
        )}
      </Grupo>
    </TelaDeConfig>
  );
}
