"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { bottomNavItems, moreNavItems } from "./nav-items";
import { MaisMenu } from "./mais-menu";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Quanto a base sólida assoma embaixo da face, e quanto a face desce ao ser
 * apertada. A face não afunda os 4px inteiros: parar 1px antes deixa uma
 * lasquinha de base à mostra no fim do gesto, que é o que faz o botão parecer
 * encostar no fundo em vez de sumir dentro dele. É a mesma proporção dos nós
 * da trilha, só na escala desta barra.
 */
const BASE = 4;

/**
 * Um destino da barra.
 *
 * Só o item selecionado tem corpo de botão: duas camadas sólidas, a de trás
 * mais escura, igual ao cabeçalho da Jornada e aos nós da trilha. Os outros
 * são apenas o ícone, sem contorno nem fundo -- assim a barra não vira uma
 * fileira de caixas cinzas competindo entre si, e o destino atual se destaca
 * sozinho.
 *
 * O afundamento do clique fica em todos, inclusive nos sem corpo: é o gesto
 * que responde ao toque. Sem ele, tocar num ícone não selecionado não daria
 * retorno nenhum até a próxima tela abrir.
 */
function Ladrilho({ ativo, desabilitado = false, children }: { ativo: boolean; desabilitado?: boolean; children: ReactNode }) {
  return (
    <span className="relative block">
      {ativo && (
        <span
          aria-hidden
          className="absolute inset-x-0 rounded-[18px] bg-primary brightness-75"
          style={{ top: BASE, bottom: -BASE }}
        />
      )}
      <span
        className={cn(
          "relative top-0 flex size-12 items-center justify-center rounded-[18px] transition-[top,background-color,color] duration-100",
          ativo && "bg-primary text-primary-foreground",
          !ativo && !desabilitado && "text-muted-foreground",
          desabilitado && "text-muted-foreground/40",
          !desabilitado && "group-active:top-[3px]"
        )}
      >
        {children}
      </span>
    </span>
  );
}

export function AppBottomNav() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const { perfil } = usePerfil();

  // Metas, Playground e Configurações só existem dentro do menu "Mais" no
  // celular — sem checar isso aqui, nenhum ícone da barra ficaria "ativo"
  // quando a pessoa estivesse numa dessas telas.
  const maisAtivo = moreNavItems.some((item) => item.href === pathname) || ((perfil?.role === "ADMIN" || perfil?.role === "PROFESSOR") && pathname.startsWith("/admin"));

  return (
    // O pb extra abre espaço pra base que assoma embaixo de cada ladrilho:
    // sem ele a peça de trás ficaria cortada pela borda da barra.
    <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-border bg-background/95 px-1 pb-3 pt-2 backdrop-blur-md lg:hidden">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const active = item.href ? pathname === item.href : false;

        // Sem legenda embaixo, o nome do destino só existe pra quem enxerga o
        // desenho do ícone. O aria-label e o title devolvem esse nome pra
        // leitor de tela e pro toque longo.
        if (!item.href) {
          return (
            <div key={item.id} className="flex flex-1 cursor-default justify-center" title={item.label} aria-label={`${item.label} — indisponível`}>
              <Ladrilho ativo={false} desabilitado>
                <Icon className="size-5" />
              </Ladrilho>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className="group flex flex-1 justify-center"
          >
            <Ladrilho ativo={active}>
              <Icon className="size-5" />
            </Ladrilho>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setMaisAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={maisAberto}
        aria-label="Mais"
        title="Mais"
        className="group flex flex-1 justify-center"
      >
        <Ladrilho ativo={maisAtivo}>
          <MoreHorizontal className="size-5" />
        </Ladrilho>
      </button>

      {maisAberto && <MaisMenu onClose={() => setMaisAberto(false)} />}
    </nav>
  );
}
