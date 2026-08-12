const LINKS = ["Sobre", "Blog", "Loja", "Carreiras", "Termos de uso", "Privacidade"];

/** Rodapé de links do painel lateral (formato do redesign). */
export function SideFooter() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 px-1.5 pt-1 text-[0.65rem] font-extrabold uppercase tracking-[0.06em] text-muted-foreground/70">
      {LINKS.map((link) => (
        <span key={link} className="cursor-default">
          {link}
        </span>
      ))}
    </div>
  );
}
