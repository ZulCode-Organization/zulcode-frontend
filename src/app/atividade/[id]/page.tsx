import { PerfilProvider } from "@/hooks/use-perfil";
import { AtividadeClient } from "./atividade-client";

interface AtividadePageProps {
  params: Promise<{ id: string }>;
}

export default async function AtividadePage({ params }: AtividadePageProps) {
  const { id } = await params;
  // Tela cheia: não passa pelo AppShell, que é quem normalmente monta o
  // PerfilProvider. As comemorações do fim da aula (o compartilhar da ofensiva)
  // leem o perfil, e sem ele por perto a página inteira caía.
  return (
    <PerfilProvider>
      <AtividadeClient id={id} />
    </PerfilProvider>
  );
}
