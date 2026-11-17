"use client";

import { useState } from "react";
import { pedir, useDados } from "@/lib/admin/api";
import { LanguageIcon } from "@/components/onboarding/language-icon";
import { Pagina } from "./shell";
import { Cabecalho, Erro, Esqueleto, Interruptor, Selo } from "./ui";

type Opcao = { id: string; nome: string; ligado: boolean; jaECurso: boolean };

/**
 * A vitrine "Em breve" do catálogo do app. Cada linguagem liga e desliga
 * aqui; a que já existe como curso ativo some da vitrine sozinha.
 */
export function AdminEmBreve() {
  const { dados, erro, recarregar } = useDados<Opcao[]>("/admin/em-breve");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [falha, setFalha] = useState("");

  const mudar = async (id: string, ligado: boolean) => {
    setSalvando(id);
    setFalha("");
    try {
      await pedir("/admin/em-breve", { method: "PUT", json: { id, ligado } });
      recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(null);
    }
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Em breve"
        descricao="As linguagens anunciadas no fim do catálogo do app, apagadas e sem clique. Desligue as que não quer anunciar agora. Quando uma vira curso ativo, ela sai daqui sozinha."
      />
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Esqueleto linhas={6} />
      ) : (
        <>
          {falha && <p className="mb-4 text-sm font-bold text-rose-600">{falha}</p>}
          <ul className="divide-y rounded-2xl border bg-card">
            {dados.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                <LanguageIcon id={l.id} name={l.nome} className="size-7 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-black">{l.nome}</p>
                  <p className="text-xs text-muted-foreground">/{l.id}</p>
                </div>
                {l.jaECurso ? (
                  <Selo tom="verde">Já é curso</Selo>
                ) : (
                  <Interruptor
                    ligado={l.ligado}
                    rotulo={l.ligado ? `Tirar ${l.nome} do Em breve` : `Mostrar ${l.nome} no Em breve`}
                    desativado={salvando === l.id}
                    aoMudar={(v) => void mudar(l.id, v)}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Pagina>
  );
}
