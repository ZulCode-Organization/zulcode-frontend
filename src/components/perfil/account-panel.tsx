"use client";

import { useRouter } from "next/navigation";
import { Settings, Bell, Sun, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const CONTA_ITEMS = [
  { id: "config", label: "Configurações", icon: Settings },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

export function AccountPanel() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.replace("/welcome");
  };

  return (
    <div>
      <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Conta</h3>
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2">
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-foreground/80">
          <Sun className="size-4.5 text-muted-foreground" />
          Aparência
        </div>
        <div className="px-3 pb-2.5">
          <ThemeToggle />
        </div>

        <div className="my-1 h-px bg-border/60" aria-hidden />

        {CONTA_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground/50"
              title="Em breve"
            >
              <Icon className="size-4.5" />
              <span className="flex-1">{item.label}</span>
              <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wide">Em breve</span>
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
  );
}
