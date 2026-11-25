"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { PerfilProvider } from "@/hooks/use-perfil";
import { EditorDePerfil } from "@/components/perfil/editor-de-perfil";

export default function EditarPerfilPage() {
  // Tela cheia: não passa pelo AppShell, que é quem normalmente monta o
  // PerfilProvider (e a barra de baixo, que aqui não aparece).
  return (
    <PerfilProvider>
      <Conteudo />
    </PerfilProvider>
  );
}

function Conteudo() {
  useRequireAuth();
  return <EditorDePerfil />;
}
