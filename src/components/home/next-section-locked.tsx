import { Lock } from "lucide-react";

interface NextSectionLockedProps {
  secao: number;
}

/**
 * Card no fim da trilha anunciando a próxima seção, ainda trancada — mostrado
 * assim que as 80 lições das 10 unidades da seção atual acabam. O botão não
 * pula pra lugar nenhum de verdade: não existe teste de nivelamento
 * implementado ainda, então ele só fica ali, sem fingir que funciona.
 */
export function NextSectionLocked({ secao }: NextSectionLockedProps) {
  return (
    <div className="animate-fade-in-up mx-auto mt-8 w-full max-w-[420px] rounded-[24px] border border-border bg-card px-7 py-6 text-center">
      <span className="inline-block rounded-md bg-muted px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">
        A seguir
      </span>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Lock className="size-5 text-muted-foreground" />
        <h2 className="text-xl font-black text-foreground">Seção {secao}</h2>
      </div>

      <p className="mx-auto mt-2 max-w-[300px] text-[0.9rem] leading-relaxed text-muted-foreground">
        Mais lições chegando em breve pra você continuar evoluindo.
      </p>

      <button
        type="button"
        disabled
        className="mt-5 w-full cursor-not-allowed rounded-2xl border-2 border-border py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-muted-foreground/70"
      >
        Pular pra cá?
      </button>
    </div>
  );
}
