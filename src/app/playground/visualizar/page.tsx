"use client";

import { useEffect, useState } from "react";
import { usePlaygroundExecutor } from "@/hooks/usePlaygroundExecutor";
import { useMontado } from "@/hooks/use-montado";
import { paraOPreview } from "@/lib/playground/arquivos";
import { CHAVE_PREVIEW_AVULSO } from "@/lib/playground/preview-avulso";
import type { Projeto } from "@/lib/playground/tipos";

/** O preview em tela cheia, em outra aba.
 *
 *  Existe para não abrir o código do aluno na nossa origem: aqui ele continua
 *  dentro do mesmo iframe isolado do playground. Sem o AppShell — a aba é só o
 *  resultado. */
function Visualizacao() {
  const { preview, status, bindFrame, onFrameLoad, run } = usePlaygroundExecutor();
  const [projeto, setProjeto] = useState<Projeto | null>(() => {
    try {
      const cru = sessionStorage.getItem(CHAVE_PREVIEW_AVULSO);
      return cru ? (JSON.parse(cru) as Projeto) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!projeto) return;
    run({ files: paraOPreview(projeto) });
    // Roda uma vez por projeto recebido: esta aba não edita nada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto]);

  // A aba de origem pode mandar uma versão nova sem recarregar.
  useEffect(() => {
    const aoMudar = (evento: StorageEvent) => {
      if (evento.key !== CHAVE_PREVIEW_AVULSO || !evento.newValue) return;
      try {
        setProjeto(JSON.parse(evento.newValue) as Projeto);
      } catch {
        // Conteúdo ilegível: mantém o que já está na tela.
      }
    };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, []);

  if (!projeto) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Nada para mostrar aqui. Abra esta aba pelo botão de preview do
          playground.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      {preview ? (
        <iframe
          key={preview.id}
          ref={bindFrame}
          title={`Resultado de ${projeto.nome}`}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          src={preview.url}
          onLoad={onFrameLoad}
          className="h-dvh w-full border-0"
        />
      ) : (
        <div className="grid min-h-dvh place-items-center bg-background">
          <p className="text-sm text-muted-foreground">
            {status === "error" ? "O preview falhou." : "Carregando o preview…"}
          </p>
        </div>
      )}
    </main>
  );
}

export default function VisualizarPage() {
  // O sessionStorage não existe no servidor; sem isto a primeira pintura
  // diria "nada para mostrar" mesmo havendo projeto.
  return useMontado() ? <Visualizacao /> : <main className="min-h-dvh bg-background" />;
}
