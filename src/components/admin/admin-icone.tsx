"use client";

/* eslint-disable @next/next/no-img-element -- As prévias são imagens pequenas e fixas, já em WebP. */

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pedir, useDados } from "@/lib/admin/api";
import { ICONES_DO_APP, type IconeDoApp } from "@/lib/icone-do-app";
import { Pagina } from "./shell";
import { Cabecalho, Cartao, Erro, Esqueleto } from "./ui";

/**
 * O ícone do app Android na tela inicial, separado do tema. Só dá para
 * escolher entre os que já vêm no APK: um ícone novo precisa de um APK novo.
 * O celular aplica a troca na próxima vez que o app for aberto e depois
 * fechado (vai para o fundo).
 */
export function AdminIcone() {
  const { dados, erro, recarregar } = useDados<{ icone: IconeDoApp }>("/admin/icone");
  const [salvando, setSalvando] = useState<IconeDoApp | null>(null);
  const [falha, setFalha] = useState("");

  const escolher = async (icone: IconeDoApp) => {
    setSalvando(icone);
    setFalha("");
    try {
      await pedir("/admin/icone", { method: "PUT", json: { icone } });
      recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível trocar o ícone.");
    } finally {
      setSalvando(null);
    }
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Ícone do app"
        descricao="O ícone do ZulCode na tela inicial do Android, para todo mundo. É separado do tema da barra: dá para usar qualquer ícone com qualquer tema."
      />
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Esqueleto linhas={3} />
      ) : (
        <>
          {falha && <p className="mb-4 text-sm font-bold text-rose-600">{falha}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ICONES_DO_APP.map(({ id, nome }) => {
              const ligado = dados.icone === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={ligado || salvando !== null}
                  onClick={() => void escolher(id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2.5 rounded-xl border bg-card p-4 text-center transition-colors duration-150",
                    ligado ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40 disabled:opacity-60",
                  )}
                >
                  <img src={`/icones-do-app/${id}.webp`} alt="" className="size-20 rounded-[22%] shadow-md" />
                  <span className="text-sm font-black">{nome}</span>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-bold", ligado ? "text-primary" : "text-muted-foreground")}>
                    {ligado ? <><Check className="size-3.5" /> No ar</> : salvando === id ? "Trocando…" : "Usar este"}
                  </span>
                </button>
              );
            })}
          </div>
          <Cartao className="mt-5" titulo="Como a troca chega no celular">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Vale só no app Android, a partir do APK que já tem estes ícones. No site, o ícone não muda.</li>
              <li>O celular troca na próxima vez que a pessoa abrir o app e depois sair dele (para não fechar o app no meio do uso).</li>
              <li>Em alguns celulares o ícone some por um instante e volta, ou sai da tela inicial e fica só na gaveta de apps: é o jeito do Android.</li>
              <li>Para um ícone novo entrar na lista, ele precisa ir num APK novo.</li>
            </ul>
          </Cartao>
        </>
      )}
    </Pagina>
  );
}
