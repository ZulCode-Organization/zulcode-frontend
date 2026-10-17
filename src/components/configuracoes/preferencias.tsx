"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePerfil } from "@/hooks/use-perfil";
import { useMontado } from "@/hooks/use-montado";
import { mudarPreferencia, usePreferencias } from "@/lib/preferencias";
import { IDIOMAS, NOME_DO_IDIOMA, type Idioma } from "@/i18n/idiomas";
import { Grupo, Linha, LinhaDeEscolha, LinhaInterruptor, Opcao } from "./linhas";
import { TelaDeConfig } from "./tela";

/** Os mesmos degraus que o servidor aceita (e as conquistas de constância usam). */
const METAS = [5, 10, 15, 30, 60] as const;

/** Tudo que muda como o app se comporta: tema, som, vibração, meta e língua. */
export function PreferenciasContent() {
  const t = useTranslations("configuracoes");
  const idiomaDaTela = useLocale();
  const { perfil, salvarDados } = usePerfil();
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const preferencias = usePreferencias();

  const [salvando, setSalvando] = useState<"idioma" | "meta" | null>(null);
  const [erro, setErro] = useState<"idioma" | "meta" | null>(null);

  const escuro = montado && resolvedTheme === "dark";
  const mudarTema = (ligado: boolean) => {
    const modo = ligado ? "dark" : "light";
    setTheme(modo);
    // O tema também vai para a conta: é o que o perfil público usa.
    void salvarDados({ themeMode: modo });
  };

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

  return (
    <TelaDeConfig titulo={t("linhas.preferencias")} voltar>
      <Grupo titulo={t("grupos.aparencia")}>
        <LinhaInterruptor titulo={t("preferencias.modoEscuro")} ligado={escuro} aoMudar={mudarTema} />
      </Grupo>

      <Grupo titulo={t("grupos.aula")}>
        <LinhaInterruptor titulo={t("som.efeitos")} descricao={t("som.efeitosDescricao")} ligado={preferencias.sons} aoMudar={(v) => mudarPreferencia("sons", v)} />
        <LinhaInterruptor titulo={t("som.vibracao")} descricao={t("som.vibracaoDescricao")} ligado={preferencias.vibracao} aoMudar={(v) => mudarPreferencia("vibracao", v)} />
        <LinhaDeEscolha
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

      <Grupo titulo={t("grupos.idioma")}>
        <LinhaDeEscolha
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

      {perfil?.publicCode && (
        <Grupo titulo={t("grupos.conta")}>
          <Linha titulo={t("preferencias.codigo")} descricao={t("conta.codigoDescricao")} valor={`#${perfil.publicCode}`} acessorio={<span />} />
        </Grupo>
      )}
    </TelaDeConfig>
  );
}
