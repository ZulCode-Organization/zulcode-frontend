import { Sparkles, Zap } from "lucide-react";
import { SeloPergunta } from "@/data/atividades";
import { cn } from "@/lib/utils";

interface SeloPerguntaBadgeProps {
  selo: SeloPergunta;
}

/** Selinho tipo "PALAVRA NOVA" / "MAIS DIFÍCIL" do Duolingo, acima do
 * enunciado da pergunta. */
export function SeloPerguntaBadge({ selo }: SeloPerguntaBadgeProps) {
  const novo = selo.tipo === "novo";
  return (
    <span
      className={cn(
        "mb-2 inline-flex items-center gap-1.5 text-[0.72rem] font-black uppercase tracking-[0.06em]",
        novo ? "text-violet-500" : "text-red-500"
      )}
    >
      {novo ? <Sparkles className="size-3.5" /> : <Zap className="size-3.5" />}
      {selo.texto}
    </span>
  );
}

interface TextoDestacadoProps {
  texto: string;
  termo?: string;
  className?: string;
}

/** Sublinha um termo (ex: "//") onde ele aparecer dentro do texto — é o
 * "grifado" pedido pra quando uma sintaxe nova é introduzida numa pergunta. */
export function TextoDestacado({ texto, termo, className }: TextoDestacadoProps) {
  if (!termo) return <span className={className}>{texto}</span>;

  const partes = texto.split(termo);
  return (
    <span className={className}>
      {partes.map((parte, indice) => (
        <span key={indice}>
          {parte}
          {indice < partes.length - 1 && (
            <mark className="rounded bg-transparent px-0.5 font-bold text-violet-600 underline decoration-violet-400 decoration-2 underline-offset-2 dark:text-violet-400">
              {termo}
            </mark>
          )}
        </span>
      ))}
    </span>
  );
}
