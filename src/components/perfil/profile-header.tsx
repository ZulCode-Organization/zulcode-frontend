"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";
import { AVATARES, AvatarIcon } from "@/components/shared/avatar-icon";
import { usePerfil } from "@/hooks/use-perfil";

interface ProfileHeaderProps {
  perfil: PerfilUsuario;
  editavel?: boolean;
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

export function ProfileHeader({ perfil, editavel = true }: ProfileHeaderProps) {
  const { salvarDados } = usePerfil();
  const nivelMaximo = perfil.xpNecessarioNivel === null;
  const progresso = nivelMaximo
    ? 100
    : Math.min(100, Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100));

  const [corCapa, setCorCapa] = useState<string | null>(perfil.bannerColor ?? "#22c55e");
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [avatar, setAvatar] = useState(perfil.avatarId ?? "orbit");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [avatarAberto, setAvatarAberto] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState<"nome" | "email" | null>(null);
  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [salvando, setSalvando] = useState(false);
  const seletorRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCorCapa(perfil.bannerColor ?? "#22c55e"), [perfil.bannerColor]);
  useEffect(() => setAvatar(perfil.avatarId ?? "orbit"), [perfil.avatarId]);

  useEffect(() => {
    if (!seletorAberto && !avatarAberto) return;
    const aoClicarFora = (evento: MouseEvent) => {
      if (seletorRef.current && !seletorRef.current.contains(evento.target as Node)) {
        setSeletorAberto(false);
      }
      const alvo = evento.target as HTMLElement;
      if (!alvo.closest("[data-seletor-avatar]")) setAvatarAberto(false);
    };
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [seletorAberto, avatarAberto]);

  const escolherCor = (cor: string) => {
    setCorCapa(cor);
    setSeletorAberto(false);
  };
  const escolherAvatar = (proximo: string) => { setAvatar(proximo); setAvatarAberto(false); };
  const salvar = async () => { setSalvando(true); const resultado = await salvarDados({ ...(nome.trim() !== perfil.nome ? { nome: nome.trim() } : {}), ...(email.trim() !== perfil.email ? { email: email.trim() } : {}), ...(avatar !== perfil.avatarId ? { avatarId: avatar } : {}), ...(corCapa !== perfil.bannerColor ? { bannerColor: corCapa ?? "#22c55e" } : {}) }); setSalvando(false); if (resultado.ok) setModoEdicao(false); };

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
          onClick={() => editavel && modoEdicao && setSeletorAberto(true)}
          className={cn(
            "h-[150px] overflow-hidden rounded-3xl border border-border",
            editavel && modoEdicao && "cursor-pointer",
            seletorAberto && "ring-2 ring-primary/40",
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

        {editavel && <div className="absolute right-3.5 top-3.5" ref={seletorRef}>
          <button
            type="button"
            onClick={() => { setModoEdicao(v => !v); setSeletorAberto(false); setAvatarAberto(false); setCampoAtivo(null); }}
            aria-label="Editar perfil"
            aria-expanded={seletorAberto}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>

          {modoEdicao && seletorAberto && (
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
        </div>}
      </div>

      <div className="relative px-1.5" data-seletor-avatar>
        <button type="button" onClick={() => editavel && modoEdicao && setAvatarAberto(v => !v)} aria-label={modoEdicao ? "Escolher ícone do perfil" : undefined} className={cn("relative -mt-[42px] flex size-24 items-center justify-center rounded-[28px] border-[5px] border-background bg-primary text-3xl font-black text-primary-foreground", editavel && modoEdicao && "cursor-pointer", avatarAberto && "ring-2 ring-primary/40")}>
          <AvatarIcon id={avatar} />
          <span className="absolute -bottom-1.5 -right-1.5 rounded-lg border-[3px] border-background bg-amber-400 px-2 py-0.5 text-[0.68rem] font-black text-amber-950">
            Nv.{perfil.nivel}
          </span>
        </button>
        {modoEdicao && avatarAberto && <div className="animate-pop-in absolute left-1.5 top-[68px] z-20 flex max-w-[300px] flex-wrap gap-2 rounded-2xl border border-border bg-card p-3 shadow-lg">{AVATARES.map(({ id, label }) => <button type="button" key={id} onClick={() => escolherAvatar(id)} aria-label={`Usar ícone ${label}`} title={label} className={cn("grid size-10 place-items-center rounded-xl bg-muted text-xl hover:bg-primary/15", avatar === id && "bg-primary text-primary-foreground")}><AvatarIcon id={id} /></button>)}</div>}

        <div className="mt-3.5">
          <div className="flex items-center gap-3">{modoEdicao && campoAtivo === "nome" ? <input autoFocus value={nome} onChange={e => setNome(e.target.value)} onBlur={() => setCampoAtivo(null)} className="w-full rounded-xl border border-primary bg-background px-3 py-1 text-2xl font-black text-foreground outline-none ring-2 ring-primary/20" /> : <button type="button" onClick={() => editavel && modoEdicao && setCampoAtivo("nome")} className={cn("block text-left text-2xl font-black text-foreground", editavel && modoEdicao && "cursor-text")}>{nome}</button>}{perfil.publicCode && <span className="text-sm font-black text-muted-foreground">#{perfil.publicCode}</span>}</div>
          {editavel && (modoEdicao && campoAtivo === "email" ? <input autoFocus value={email} type="email" onChange={e => setEmail(e.target.value)} onBlur={() => setCampoAtivo(null)} className="mt-0.5 w-full rounded-xl border border-primary bg-background px-3 py-1 text-sm text-foreground outline-none ring-2 ring-primary/20" /> : <button type="button" onClick={() => modoEdicao && setCampoAtivo("email")} className={cn("mt-0.5 block text-left text-sm text-muted-foreground/70", modoEdicao && "cursor-text")}>{email}</button>)}
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{perfil.nivelLabel}</p>
        </div>
      </div>

      {editavel && modoEdicao && <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setNome(perfil.nome); setEmail(perfil.email); setSeletorAberto(false); setAvatarAberto(false); setCampoAtivo(null); setModoEdicao(false); }} className="rounded-xl bg-muted px-4 py-2.5 text-sm font-black">Cancelar</button><button type="button" disabled={salvando} onClick={salvar} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground"><Save className="size-4"/>{salvando ? "Salvando…" : "Salvar perfil"}</button></div>}

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
