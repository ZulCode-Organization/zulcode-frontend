import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PerfilUsuario } from "@/lib/types/perfil";

interface ProfileHeaderProps {
  perfil: PerfilUsuario;
}

export function ProfileHeader({ perfil }: ProfileHeaderProps) {
  const nivelMaximo = perfil.xpNecessarioNivel === null;
  const progresso = nivelMaximo
    ? 100
    : Math.min(100, Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100));

  return (
    <div className="animate-fade-in-up flex flex-col items-center gap-4 text-center">
      <UserAvatar iniciais={perfil.iniciais} nivel={perfil.nivel} size="lg" />

      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-extrabold text-foreground">{perfil.nome}</h1>
        <p className="text-sm text-muted-foreground">{perfil.email}</p>
        <span className="mt-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
          {perfil.nivelLabel}
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{nivelMaximo ? "Nível máximo alcançado 🏆" : `Progresso para Nível ${perfil.nivel + 1}`}</span>
          {!nivelMaximo && (
            <span className="text-primary">
              {perfil.xpNivelAtual} / {perfil.xpNecessarioNivel} XP
            </span>
          )}
        </div>
        <Progress value={progresso} className="mt-2 h-2" />
      </div>
    </div>
  );
}
