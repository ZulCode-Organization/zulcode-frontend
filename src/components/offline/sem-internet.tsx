"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import { ZulDaAula } from "@/components/atividade/zul-da-aula";
import "@/components/atividade/aula.css";

function assinarConexao(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** Está sem internet agora? No servidor (e antes de montar) a resposta é "não". */
export function useSemInternet() {
  return useSyncExternalStore(assinarConexao, () => !navigator.onLine, () => false);
}

/**
 * A tela de quando não há internet: fica no lugar do conteúdo, com a barra
 * de navegação funcionando em volta. Quando a conexão volta, a página
 * recarrega sozinha para buscar os dados de novo.
 */
export function SemInternet({ recarregarAoVoltar = true }: { recarregarAoVoltar?: boolean }) {
  const [tentando, setTentando] = useState(false);

  useEffect(() => {
    if (!recarregarAoVoltar) return;
    const voltou = () => window.location.reload();
    window.addEventListener("online", voltou);
    return () => window.removeEventListener("online", voltou);
  }, [recarregarAoVoltar]);

  const tentar = () => {
    setTentando(true);
    // Recarregar é o teste: com rede a página vem; sem rede o próprio app mostra esta tela de novo.
    window.location.reload();
  };

  return (
    <div className="zc-aula flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <ZulDaAula pose="derretido" caiu className="size-44" />
      <h1 className="text-[1.6rem] font-black leading-tight text-foreground">Você está sem internet</h1>
      <p className="max-w-sm text-[0.98rem] font-semibold leading-relaxed text-muted-foreground">
        Confira o Wi-Fi ou os dados móveis. O que você fizer agora fica guardado e sobe quando a conexão voltar.
      </p>
      <button type="button" onClick={tentar} disabled={tentando} className="zc-aula-botao mt-2 w-auto px-8">
        <RefreshCw className={tentando ? "size-5 animate-spin" : "size-5"} />
        Tentar de novo
      </button>
    </div>
  );
}

/**
 * O conteúdo da página, ou a tela de sem internet no lugar dele. Ferramentas
 * que funcionam sem rede (o playground) passam `funcionaOffline` e seguem normais.
 */
export function ConteudoComConexao({ children, funcionaOffline = false }: { children: React.ReactNode; funcionaOffline?: boolean }) {
  const semInternet = useSemInternet();
  if (semInternet && !funcionaOffline) return <SemInternet />;
  return <>{children}</>;
}
