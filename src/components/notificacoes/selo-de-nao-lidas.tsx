import { cn } from "@/lib/utils";

/** A bolinha vermelha com quantas notificações faltam ler. Nada quando são zero. */
export function SeloDeNaoLidas({ total, className }: { total: number; className?: string }) {
  if (total <= 0) return null;
  return (
    <span
      aria-label={`${total} não lidas`}
      className={cn(
        "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[0.62rem] font-black leading-none text-white ring-2 ring-background",
        className,
      )}
    >
      {total > 9 ? "9+" : total}
    </span>
  );
}
