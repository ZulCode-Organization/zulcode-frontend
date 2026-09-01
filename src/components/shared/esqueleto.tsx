import { cn } from "@/lib/utils";

/**
 * Peça de esqueleto: um bloco com o brilho passando por cima.
 *
 * O `animate-pulse` do Tailwind só apaga e acende o bloco inteiro, o que lê
 * como algo piscando na tela. Aqui o brilho atravessa da esquerda pra direita,
 * que é o gesto que as pessoas já associam a "está vindo" — e num carregamento
 * de vários segundos essa diferença é o que separa "carregando" de "travou".
 *
 * A forma imita a do conteúdo que vai entrar no lugar, então nada salta quando
 * os dados chegam: o esqueleto não é enfeite, é o mesmo espaço já reservado.
 */
export function Esqueleto({ className }: { className?: string }) {
  return <span className={cn("zc-esqueleto block rounded-xl bg-muted", className)} aria-hidden />;
}

/** Uma linha de meta: ícone, título e barra de progresso. */
export function EsqueletoMeta() {
  return (
    <div className="flex items-center gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4.5 sm:py-5.5">
      <Esqueleto className="size-9 shrink-0 rounded-full sm:size-11" />
      <div className="min-w-0 flex-1">
        <Esqueleto className="h-4 w-3/5 sm:h-[18px]" />
        <Esqueleto className="mt-2.5 h-5 w-full rounded-xl sm:mt-3 sm:h-[22px]" />
      </div>
    </div>
  );
}

/** Um ladrilho de elemento do glossário. */
export function EsqueletoElemento() {
  return <Esqueleto className="h-28 rounded-3xl" />;
}

/**
 * O aviso que aparece quando a espera passa do normal.
 *
 * Não entra junto do esqueleto: só depois de alguns segundos, e por isso mora
 * fora daqui, em quem sabe há quanto tempo espera. Dizer "está demorando"
 * imediatamente ensinaria a pessoa a esperar demora sempre.
 */
export function AvisoDemora({ children }: { children: React.ReactNode }) {
  return (
    <p className="zc-esqueleto-aviso mt-6 text-center text-[0.82rem] text-muted-foreground">{children}</p>
  );
}
