"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CabecalhoDaSubtela } from "@/components/perfil/cabecalho-da-subtela";
import { ListaDePessoas } from "@/components/perfil/lista-de-pessoas";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { listarEmComum, PessoaSocial } from "@/lib/social";

/** "5 seguidores em comum": quem eu sigo e também segue a pessoa visitada. */
export default function EmComumPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [pessoas, setPessoas] = useState<PessoaSocial[] | null>(null);

  useEffect(() => {
    let valeu = true;
    listarEmComum(id)
      .then((lista) => valeu && setPessoas(lista))
      .catch(() => valeu && setPessoas([]));
    return () => {
      valeu = false;
    };
  }, [id]);

  const total = pessoas?.length ?? 0;
  const titulo = pessoas === null ? "Seguidores em comum" : `${total} ${total === 1 ? "seguidor" : "seguidores"} em comum`;

  return (
    <AppShell contentClassName="max-w-2xl">
      <CabecalhoDaSubtela titulo={titulo} voltarPara={`/perfil/${id}`} />
      <ListaDePessoas pessoas={pessoas} vazio="Ninguém que você segue segue essa pessoa ainda." />
    </AppShell>
  );
}
