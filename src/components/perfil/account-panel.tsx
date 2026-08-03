"use client";

import { useRouter } from "next/navigation";
import { Settings, Bell, Moon, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conquista } from "@/lib/types/usuario";
import { limparUsuario } from "@/lib/usuario-storage";
import { ConquistaIcon } from "./conquista-icon";

const CONTA_ITEMS = [
  { id: "config", label: "Configurações", icon: Settings },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Moon },
];

interface AccountPanelProps {
  destaques: Conquista[];
}

export function AccountPanel({ destaques }: AccountPanelProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isNivelado");
    limparUsuario();
    router.replace("/welcome");
  };

  return (
    <>
      <div>
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Conta</h3>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2">
          {CONTA_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80"
              >
                <Icon className="size-4.5 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive transition-colors duration-150 hover:bg-destructive/10"
          >
            <LogOut className="size-4.5" />
            Sair
          </button>
        </div>
      </div>

      {destaques.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Destaques</h3>
          <div className="flex flex-col gap-2">
            {destaques.map((conquista, index) => (
              <div
                key={conquista.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  index === 0 && "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
                  index === 1 && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                  index === 2 && "border-primary/30 bg-primary/10 text-primary"
                )}
              >
                <ConquistaIcon icone={conquista.icone} className="size-4" />
                {conquista.titulo}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
