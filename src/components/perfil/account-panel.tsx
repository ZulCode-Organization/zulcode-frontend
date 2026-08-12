"use client";

import { useRouter } from "next/navigation";
import { Settings, Bell, Sun, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { limparPerfilCache } from "@/hooks/use-perfil";

const CONTA_ITEMS = [
  { id: "config", label: "Configurações", icon: Settings },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

export function AccountPanel() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    // O cache do perfil vive em memória e sobrevive ao router.replace (não é
    // reload de página) — sem limpar, a próxima conta logada nesse navegador
    // veria por um instante o perfil da conta anterior.
    limparPerfilCache();
    router.replace("/welcome");
  };

  return (
    <div>
      <h3 className="mb-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
        Conta
      </h3>

      <div className="rounded-[20px] border border-border bg-card px-5 py-5">
        <div className="mb-3.5 flex items-center gap-2.5 text-[0.95rem] font-extrabold text-foreground">
          <Sun className="size-4.5" />
          Aparência
        </div>
        <ThemeToggle />

        <div className="mt-3.5 border-t border-border pt-3.5">
          {CONTA_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex cursor-default items-center justify-between py-2.5"
                title="Em breve"
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground/70">
                  <Icon className="size-4.5" />
                  {item.label}
                </span>
                <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.05em] text-muted-foreground/70">
                  Em breve
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2.5 border-t border-border pt-4 text-sm font-extrabold text-destructive"
        >
          <LogOut className="size-4.5" />
          Sair
        </button>
      </div>
    </div>
  );
}
