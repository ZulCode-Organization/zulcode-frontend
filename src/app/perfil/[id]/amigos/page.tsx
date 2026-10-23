"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CabecalhoDaSubtela } from "@/components/perfil/cabecalho-da-subtela";
import { ListaDePessoas } from "@/components/perfil/lista-de-pessoas";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { usePerfilPublico } from "@/hooks/use-perfil-publico";
import { listarSeguidores, listarSeguindo, PessoaSocial } from "@/lib/social";
import { cn } from "@/lib/utils";

type Aba = "segue" | "seguidores";

/** "Amigos de X": quem a pessoa segue e quem segue a pessoa, em duas abas. */
/** Fica dentro do AppShell: o usePerfil precisa do PerfilProvider dele. */
function Amigos() {
  const { id } = useParams<{ id: string }>();
  const parametros = useSearchParams();
  const router = useRouter();
  const aba: Aba = parametros.get("aba") === "seguidores" ? "seguidores" : "segue";
  const { perfil: eu } = usePerfil();
  const { perfil } = usePerfilPublico(id);
  const [listas, setListas] = useState<{ segue: PessoaSocial[] | null; seguidores: PessoaSocial[] | null }>({ segue: null, seguidores: null });

  useEffect(() => {
    let valeu = true;
    Promise.all([listarSeguindo(id), listarSeguidores(id)])
      .then(([segue, seguidores]) => valeu && setListas({ segue, seguidores }))
      .catch(() => valeu && setListas({ segue: [], seguidores: [] }));
    return () => {
      valeu = false;
    };
  }, [id]);

  const souEu = id === eu?.id;
  const titulo = souEu ? "Seus amigos" : perfil ? `Amigos de ${perfil.nome}` : "Amigos";
  // Trocar de aba troca o endereço (sem empilhar), para o "voltar" sair da tela.
  const irPara = (nova: Aba) => router.replace(`/perfil/${id}/amigos${nova === "seguidores" ? "?aba=seguidores" : ""}`, { scroll: false });

  return (
    <>
      <CabecalhoDaSubtela titulo={titulo} voltarPara={`/perfil/${id}`} />
      <div className="mb-4 flex">
        {(["segue", "seguidores"] as const).map((item) => {
          const total = listas[item]?.length;
          return (
            <button
              key={item}
              type="button"
              onClick={() => irPara(item)}
              className={cn(
                "flex-1 border-b-2 pb-3 text-[0.82rem] font-black uppercase tracking-[0.06em] transition-colors duration-150",
                aba === item ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {item === "segue" ? "Segue" : "Seguidores"}
              {typeof total === "number" && <span className="ml-1.5">{total}</span>}
            </button>
          );
        })}
      </div>
      <ListaDePessoas
        pessoas={listas[aba]}
        vazio={
          aba === "segue"
            ? souEu ? "Você ainda não segue ninguém." : "Essa pessoa ainda não segue ninguém."
            : souEu ? "Ninguém segue você ainda." : "Ninguém segue essa pessoa ainda."
        }
      />
    </>
  );
}

export default function AmigosPage() {
  useRequireAuth();
  // useSearchParams pede um Suspense em volta no build estático.
  return (
    <AppShell contentClassName="max-w-2xl">
      <Suspense>
        <Amigos />
      </Suspense>
    </AppShell>
  );
}
