import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DadosUsuario } from "@/lib/types/usuario";

interface ProfileHeaderProps {
  usuario: DadosUsuario;
}

export function ProfileHeader({ usuario }: ProfileHeaderProps) {
  const progresso = Math.min(100, Math.round((usuario.xpAtual / usuario.xpProximoNivel) * 100));

  return (
    <div className="animate-fade-in-up flex flex-col items-center gap-4 text-center">
      <UserAvatar iniciais={usuario.iniciais} nivel={usuario.nivel} size="lg" />

      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-extrabold text-foreground">{usuario.nome}</h1>
        <p className="text-sm text-muted-foreground">{usuario.email}</p>
        <span className="mt-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {usuario.nivelLabel}
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Progresso para Nível {usuario.nivel + 1}</span>
          <span className="text-primary">
            {usuario.xpAtual} / {usuario.xpProximoNivel} XP
          </span>
        </div>
        <Progress value={progresso} className="mt-2 h-2" />
      </div>
    </div>
  );
}
