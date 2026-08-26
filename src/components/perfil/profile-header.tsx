"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";
import { AVATARES, AvatarIcon } from "@/components/shared/avatar-icon";
import { usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

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

const BANNER_DEV = "linear-gradient(135deg, #042f2e, #0f766e, #2dd4bf)";
const BANNER_TESTER = "linear-gradient(135deg, #172554, #2563eb, #60a5fa)";
const BANNER_PRO = "linear-gradient(135deg, #7c3aed, #d946ef 55%, #f0abfc)";

export function ProfileHeader({ perfil, editavel = true }: ProfileHeaderProps) {
  const { salvarDados } = usePerfil();
  const nivelMaximo = perfil.xpNecessarioNivel === null;
  const progresso = nivelMaximo
    ? 100
    : Math.min(100, Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100));

  const [corCapa, setCorCapa] = useState<string | null>(perfil.bannerColor ?? "#22c55e");
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [avatar, setAvatar] = useState(perfil.avatarId ?? "orbit");
  const [editorAtivo, setEditorAtivo] = useState<"banner" | "avatar" | "nome" | null>(null);
  const [avatarAberto, setAvatarAberto] = useState(false);
  const [nome, setNome] = useState(perfil.nome);
  const [avataresComprados, setAvataresComprados] = useState<string[]>([]);
  const [bannersComprados, setBannersComprados] = useState<{ id: string; name: string; gradient: string }[]>([]);
  const seletorRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCorCapa(perfil.bannerColor ?? "#22c55e"), [perfil.bannerColor]);
  useEffect(() => setAvatar(perfil.avatarId ?? "orbit"), [perfil.avatarId]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then((itens: { id: string; name: string; kind: string; owned: boolean; value: { avatarId?: string; gradient?: string } }[]) => {
        setAvataresComprados(itens.filter((item) => item.kind === "AVATAR" && item.owned && item.value.avatarId).map((item) => item.value.avatarId!));
        setBannersComprados(itens.filter((item) => item.kind === "BANNER" && item.owned && item.value.gradient).map((item) => ({ id: item.id, name: item.name, gradient: item.value.gradient! })));
      })
      .catch(() => { setAvataresComprados([]); setBannersComprados([]); });
  }, []);

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
    void salvarDados({ bannerColor: cor });
  };
  const escolherBannerComprado = (banner: { id: string; gradient: string }) => {
    setCorCapa(banner.gradient);
    setSeletorAberto(false);
    void salvarDados({ bannerColor: banner.gradient });
  };
  const escolherAvatar = (proximo: string) => { setAvatar(proximo); setAvatarAberto(false); void salvarDados({ avatarId: proximo }); };
  const salvarNome = () => { const novoNome = nome.trim(); if (novoNome && novoNome !== perfil.nome) void salvarDados({ nome: novoNome }); else setNome(perfil.nome); setEditorAtivo(null); };
  const capaStyle = corCapa ? { background: corCapa } : undefined;
  const mostraArtePioneiro = corCapa === BANNER_TESTER;
  const mostraArteDev = corCapa === BANNER_DEV;
  const mostraArtePro = corCapa === BANNER_PRO;
  const seloPerfil = perfil.isDeveloper
    ? { texto: "DEV", classe: "bg-teal-400 text-teal-950" }
    : perfil.isEarlyTester
      ? { texto: "BETA", classe: "bg-blue-400 text-blue-950" }
      : perfil.isPro
        ? { texto: "PRO", classe: "bg-violet-400 text-violet-950" }
        : { texto: `Nv.${perfil.nivel}`, classe: "bg-amber-400 text-amber-950" };

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
          onClick={() => editavel && setSeletorAberto(true)}
          className={cn(
            "relative h-[150px] overflow-hidden rounded-3xl border border-border",
            editavel && "group cursor-pointer",
            seletorAberto && "ring-2 ring-primary/40",
            !corCapa && "zc-hatch"
          )}
          style={capaStyle}
        >
          {!corCapa && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[0.72rem] text-muted-foreground/70">
              [ capa de perfil ]
            </span>
          )}
          {mostraArtePioneiro && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><rect width="800" height="180" fill="#101b4b"/><g stroke="#3b82f6" strokeOpacity=".28" strokeWidth="1"><path d="M0 30h800M0 60h800M0 90h800M0 120h800M0 150h800M80 0v180M160 0v180M240 0v180M320 0v180M400 0v180M480 0v180M560 0v180M640 0v180M720 0v180"/></g><path d="M-20 142C85 75 136 148 226 94S367 35 455 91 600 156 702 55 795 34 830 58" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/><g fill="#dbeafe"><circle cx="90" cy="103" r="7"/><circle cx="226" cy="94" r="7"/><circle cx="455" cy="91" r="7"/><circle cx="702" cy="55" r="7"/></g><g transform="translate(553 24)"><rect width="186" height="55" rx="27" fill="#dbeafe"/><text x="25" y="35" fill="#172554" fontFamily="Arial, sans-serif" fontSize="21" fontWeight="700" letterSpacing="3">BETA</text><path d="M136 16h28v6h-28zm0 12h28v6h-28zm0 12h18v6h-18z" fill="#2563eb"/></g></svg>}
          {mostraArteDev && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="#99f6e4" strokeOpacity=".48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="m87 55-42 35 42 35m57-70 42 35-42 35m-23-82-20 124"/><path d="M476 145 596 22l65 69 58-91 66 145"/></g><g fill="#5eead4" fillOpacity=".28"><circle cx="596" cy="22" r="12"/><circle cx="661" cy="91" r="12"/><circle cx="719" cy="0" r="12"/></g><g transform="translate(595 110)"><rect width="153" height="42" rx="21" fill="#ccfbf1" fillOpacity=".94"/><text x="22" y="28" fill="#115e59" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" letterSpacing="2">BUILD</text><path d="m118 14 13 7-13 7z" fill="#0f766e"/></g></svg>}
          {mostraArtePro && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><g fill="#fdf4ff" fillOpacity=".28"><circle cx="600" cy="32" r="4"/><circle cx="670" cy="72" r="7"/><circle cx="745" cy="28" r="4"/><circle cx="540" cy="115" r="5"/></g><path d="m627 37 16 34 37 5-27 26 7 37-33-18-33 18 7-37-27-26 37-5z" fill="#fef3c7" fillOpacity=".88"/><path d="M88 137 169 51l65 76 63-96 96 106" fill="none" stroke="#f5d0fe" strokeOpacity=".5" strokeWidth="5"/><g transform="translate(64 32)"><rect width="154" height="44" rx="22" fill="#fdf4ff" fillOpacity=".92"/><text x="25" y="29" fill="#86198f" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" letterSpacing="2">PRO</text></g></svg>}
          {editavel && <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"><Pencil className="size-6 text-white" /></span>}
        </div>

        {editavel && <div className="absolute right-3.5 top-3.5" ref={seletorRef}>
          {seletorAberto && (
            <div
              className="animate-pop-in absolute right-0 top-11 z-20 w-[220px] rounded-2xl border border-border bg-card p-3.5 shadow-lg"
              role="menu"
            >
              <div className="flex flex-wrap gap-2.5">{CORES_CAPA.map((cor) => (
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
              ))}</div>
              {[...(perfil.isPro ? [{ id: "pro-banner", name: "Banner PRO", gradient: BANNER_PRO }] : []), ...(perfil.isDeveloper ? [{ id: "developer-banner", name: "Banner Desenvolvedor", gradient: BANNER_DEV }] : []), ...(perfil.isEarlyTester ? [{ id: "early-tester-banner", name: "Banner Pioneiro", gradient: BANNER_TESTER }] : []), ...bannersComprados].length > 0 && <div className="mt-3 border-t border-border pt-3"><p className="mb-2 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Banners disponíveis</p><div className="grid gap-2">{[...(perfil.isPro ? [{ id: "pro-banner", name: "Banner PRO", gradient: BANNER_PRO }] : []), ...(perfil.isDeveloper ? [{ id: "developer-banner", name: "Banner Desenvolvedor", gradient: BANNER_DEV }] : []), ...(perfil.isEarlyTester ? [{ id: "early-tester-banner", name: "Banner Pioneiro", gradient: BANNER_TESTER }] : []), ...bannersComprados].map((banner) => <button key={banner.id} type="button" onClick={() => escolherBannerComprado(banner)} className="flex items-center gap-2 rounded-xl p-1.5 text-left text-xs font-bold hover:bg-muted"><span className="h-8 w-12 rounded-lg" style={{ background: banner.gradient }} /><span className="truncate">{banner.name}</span></button>)}</div></div>}
            </div>
          )}
        </div>}
      </div>

      <div className="relative px-1.5" data-seletor-avatar>
        <button type="button" onClick={() => editavel && setAvatarAberto(v => !v)} aria-label="Escolher ícone do perfil" className={cn("group relative -mt-[42px] flex size-24 items-center justify-center rounded-[28px] border-[5px] border-background bg-primary text-3xl font-black text-primary-foreground", editavel && "cursor-pointer", avatarAberto && "ring-2 ring-primary/40")} style={{ background: corCapa ?? "#22c55e" }}>
          <AvatarIcon id={avatar} />
          {editavel && <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"><Pencil className="size-5 text-white" /></span>}
          <span className={cn("absolute -bottom-1.5 -right-2 z-10 rounded-lg border-[3px] border-background px-2 py-0.5 text-[0.68rem] font-black", seloPerfil.classe)}>
            {seloPerfil.texto}
          </span>
        </button>
        {avatarAberto && <div className="animate-pop-in absolute left-1.5 top-[68px] z-20 max-w-[300px] rounded-2xl border border-border bg-card p-3 shadow-lg"><p className="mb-2 text-xs font-black text-muted-foreground">Ícones do perfil</p><div className="flex flex-wrap gap-2">{AVATARES.filter(({ id }) => (id !== "comet" || avataresComprados.includes(id)) && (id !== "pro" || perfil.isPro) && (id !== "developer" || perfil.isDeveloper) && (id !== "early-tester" || perfil.isEarlyTester)).map(({ id, label }) => <button type="button" key={id} onClick={() => escolherAvatar(id)} aria-label={`Usar ícone ${label}`} title={label} className={cn("grid size-10 place-items-center rounded-xl bg-muted text-xl hover:bg-primary/15", avatar === id && "bg-primary text-primary-foreground")}><AvatarIcon id={id} /></button>)}</div></div>}

        <div className="mt-3.5">
          <div className="flex items-center gap-3">{editorAtivo === "nome" ? <input autoFocus value={nome} onChange={e => setNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setNome(perfil.nome); setEditorAtivo(null); } }} className="w-full rounded-xl border border-primary bg-background px-3 py-1 text-2xl font-black text-foreground outline-none ring-2 ring-primary/20" /> : <button type="button" onClick={() => editavel && setEditorAtivo("nome")} className={cn("group flex items-center gap-2 text-left text-2xl font-black text-foreground", editavel && "cursor-text")}>{nome}{editavel && <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}</button>}{perfil.publicCode && <span className="text-sm font-black text-muted-foreground">#{perfil.publicCode}</span>}</div>
          {editavel && <p className="mt-0.5 text-sm text-muted-foreground/70">{perfil.email}</p>}
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
