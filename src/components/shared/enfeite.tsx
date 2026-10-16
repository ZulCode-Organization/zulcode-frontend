import { cn } from "@/lib/utils";
import { DESENHOS_DOS_ENFEITES } from "./desenhos-enfeites";

export type NomeDoEnfeite = keyof typeof DESENHOS_DOS_ENFEITES;

/** Um enfeite de evento (abóbora, morcego, presente…), no tamanho da classe. */
export function Enfeite({ nome, className }: { nome: NomeDoEnfeite; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("pointer-events-none", className)}
      // Os desenhos são constantes do arquivo de enfeites, nunca conteúdo de fora.
      dangerouslySetInnerHTML={{ __html: DESENHOS_DOS_ENFEITES[nome] }}
    />
  );
}
