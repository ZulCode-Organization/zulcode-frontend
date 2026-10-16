/* eslint-disable @next/next/no-img-element -- As artes do Zul são WebP animados:
   o otimizador do Next devolveria só o primeiro quadro. */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** As artes do Zul (WebP animado em public/zul). */
export type PoseDoZul =
  | "coco"
  | "comemorando"
  | "correndo"
  | "derretido"
  | "equilibrio"
  | "escrevendo"
  | "forte"
  | "lagarta"
  | "lendo"
  | "lupa"
  | "mergulho"
  | "muletas"
  | "oculos";

export function ZulDaAula({ pose, className, caiu = false }: { pose: PoseDoZul; className?: string; caiu?: boolean }) {
  return (
    <img
      src={`/zul/zul-${pose}.webp`}
      alt=""
      draggable={false}
      data-caiu={caiu}
      className={cn("zc-aula-zul", className)}
    />
  );
}

/** O Zul falando com a pessoa: a arte à esquerda e o balão apontando para ele. */
export function FalaDoZul({ pose, children, className }: { pose: PoseDoZul; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* A chave troca a imagem inteira: o WebP recomeça do primeiro quadro. */}
      <ZulDaAula key={pose} pose={pose} className="size-[72px]" />
      <div className="zc-aula-balao text-[0.92rem] text-foreground">{children}</div>
    </div>
  );
}
