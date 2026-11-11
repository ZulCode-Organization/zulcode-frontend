"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparSeguidos } from "@/hooks/use-seguir";
import { limparCursosCache } from "@/hooks/use-cursos";
import { limparWidgetDaOfensiva } from "@/lib/widget-ofensiva";
import { limparAvisos } from "@/lib/avisos";

/** A API recusou o token da sessão (ver api-config.ts): faz o mesmo que o "Sair" e leva para o login. */
export function SessaoExpirada() {
  const router = useRouter();

  useEffect(() => {
    const sair = () => {
      // Várias requisições recusam juntas; só a primeira encerra a sessão.
      if (!localStorage.getItem("accessToken")) return;
      // Sem esquecerEsteAparelho(): ele precisa justamente do token que venceu.
      localStorage.removeItem("accessToken");
      limparPerfilCache();
      limparTrilhaCache();
      limparSeguidos();
      limparCursosCache();
      void limparWidgetDaOfensiva();
      void limparAvisos();
      router.replace("/login");
    };
    window.addEventListener("zulcode:sessao-expirada", sair);
    return () => window.removeEventListener("zulcode:sessao-expirada", sair);
  }, [router]);

  return null;
}
