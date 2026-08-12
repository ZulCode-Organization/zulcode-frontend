"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  perfil: PerfilUsuario;
}

const CORES_CAPA = [
  { id: "verde", label: "Verde", valor: "#22c55e" },
  { id: "vermelho", label: "Vermelho", valor: "#ef4444" },
  { id: "azul", label: "Azul", valor: "#3b82f6" },
  { id: "azul-escuro", label: "Azul escuro", valor: "#1e3a8a" },
  { id: "laranja", label: "Amarelo laranja", valor: "#f59e0b" },
  { id: "rosa", label: "Rosa", valor: "#ec4899" },
  { id: "roxo", label: "Roxo", valor: "#8b5cf6" },
] as const;

/** Não existe campo de capa no backend — é uma preferência só de aparência,
 * então fica salva no navegador do mesmo jeito que o tema claro/escuro. */
const CAPA_STORAGE_KEY = "zc:perfil:capaCor";

export function ProfileHeader({ perfil }: ProfileHeaderProps) {
  const nivelMaximo = perfil.xpNecessarioNivel === null;
  const progresso = nivelMaximo
    ? 100
    : Math.min(100, Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100));

  const [corCapa, setCorCapa] = useState<string | null>(null);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const seletorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const salva = localStorage.getItem(CAPA_STORAGE_KEY);
    if (salva) setCorCapa(salva);
  }, []);

  useEffect(() => {
    if (!seletorAberto) return;
    const aoClicarFora = (evento: MouseEvent) => {
      if (seletorRef.current && !seletorRef.current.contains(evento.target as Node)) {
        setSeletorAberto(false);
      }
    };
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [seletorAberto]);

  const escolherCor = (cor: string) => {
    setCorCapa(cor);
    localStorage.setItem(CAPA_STORAGE_KEY, cor);
    setSeletorAberto(false);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Wrapper sem overflow-hidden: o popup do seletor de cor mora aqui fora
          da capa, senão o overflow-hidden dela (necessário pro hatch/cantos
          arredondados) cortava o popup por baixo. */}
      <div className="relative">
        {/* Sem cor escolhida ainda: capa tracejada — o espaço da arte já existe
            no layout, mas fica marcado como placeholder em vez de fingir uma
            imagem que ninguém enviou. */}
        <div
          className={cn(
            "h-[150px] overflow-hidden rounded-3xl border border-border",
            !corCapa && "zc-hatch"
          )}
          style={corCapa ? { backgroundColor: corCapa } : undefined}
        >
          {!corCapa && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[0.72rem] text-muted-foreground/70">
              [ capa de perfil ]
            </span>
          )}
        </div>

        <div className="absolute right-3.5 top-3.5" ref={seletorRef}>
          <button
            type="button"
            onClick={() => setSeletorAberto((aberto) => !aberto)}
            aria-label="Mudar cor da capa"
            aria-expanded={seletorAberto}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>

          {seletorAberto && (
            <div
              className="animate-pop-in absolute right-0 top-11 z-20 flex w-[168px] flex-wrap gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-lg"
              role="menu"
            >
              {CORES_CAPA.map((cor) => (
                <button
                  key={cor.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={corCapa === cor.valor}
                  aria-label={cor.label}
                  title={cor.label}
                  onClick={() => escolherCor(cor.valor)}
                  className="flex size-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow duration-150"
                  style={{
                    backgroundColor: cor.valor,
                    ["--tw-ring-color" as string]: corCapa === cor.valor ? cor.valor : "transparent",
                  }}
                >
                  {corCapa === cor.valor && <Check className="size-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-1.5">
        <div className="relative -mt-[42px] flex size-24 items-center justify-center rounded-[28px] border-[5px] border-background bg-primary text-3xl font-black text-primary-foreground">
          {perfil.iniciais}
          <span className="absolute -bottom-1.5 -right-1.5 rounded-lg border-[3px] border-background bg-amber-400 px-2 py-0.5 text-[0.68rem] font-black text-amber-950">
            Nv.{perfil.nivel}
          </span>
        </div>

        <div className="mt-3.5">
          <h1 className="text-2xl font-black text-foreground">{perfil.nome}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/70">{perfil.email}</p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{perfil.nivelLabel}</p>
        </div>
      </div>

      <div className="mt-6 h-px bg-border" aria-hidden />

      <div className="mt-6 rounded-[20px] border border-border bg-card px-5 py-4.5">
        <p className="text-sm font-extrabold text-foreground">
          {nivelMaximo ? "Nível máximo alcançado 🏆" : `Progresso para Nível ${perfil.nivel + 1}`}
        </p>
        {!nivelMaximo && (
          <p className="mt-1 text-sm font-extrabold text-primary">
            {perfil.xpNivelAtual} / {perfil.xpNecessarioNivel} XP
          </p>
        )}
        <Progress value={progresso} className="mt-2.5 h-3" />
      </div>
    </div>
  );
}
