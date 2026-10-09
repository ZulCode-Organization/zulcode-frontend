/* eslint-disable @next/next/no-img-element -- A logo vem do banco como imagem
   embutida (data:) ou endereço qualquer; o Image do Next exigiria lista de
   hosts e não ganha nada com 48px. */
"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { reduzirImagem } from "@/lib/admin/imagem";
import { avisar } from "../avisos";

export function LogoDoCurso({ curso, className }: { curso: { name: string; logoUrl: string | null }; className?: string }) {
  if (curso.logoUrl) return <img src={curso.logoUrl} alt="" className={cn("shrink-0 rounded-xl object-cover", className)} />;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary", className)}>
      {curso.name.slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

/** O quadrado da logo que abre o seletor de arquivo; a imagem chega já reduzida. */
export function EscolhaDeLogo({ valor, nome, aoMudar, tamanho = "size-16" }: { valor: string | null; nome: string; aoMudar: (v: string | null) => void; tamanho?: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className={cn("group relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 text-muted-foreground hover:border-primary hover:text-primary", tamanho)}
        aria-label={valor ? "Trocar a logo" : "Escolher a logo"}
      >
        {lendo ? <Loader2 className="size-5 animate-spin" /> : valor ? <img src={valor} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5" />}
        {valor && !lendo && <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"><ImagePlus className="size-5 text-white" /></span>}
      </button>
      {valor && (
        <button type="button" onClick={() => aoMudar(null)} aria-label="Tirar a logo" className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-rose-500">
          <X className="size-3" />
        </button>
      )}
      <input
        ref={entrada}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-label={`Logo de ${nome || "curso"}`}
        onChange={async (e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (!arquivo) return;
          setLendo(true);
          try {
            aoMudar(await reduzirImagem(arquivo));
          } catch (erro) {
            avisar(erro instanceof Error ? erro.message : "Não foi possível usar a imagem.", { tom: "erro" });
          } finally {
            setLendo(false);
          }
        }}
      />
    </div>
  );
}
