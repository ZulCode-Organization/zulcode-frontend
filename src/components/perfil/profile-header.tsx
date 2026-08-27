"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { usePerfil } from "@/hooks/use-perfil";
import { LadrilhoCurso } from "@/components/app-shell/topbar-cursos";

interface ProfileHeaderProps {
  /** Abre a tela de edição do perfil. Só faz sentido com `editavel`. */
  onEditar?: () => void;
  perfil: PerfilUsuario;
  editavel?: boolean;
}

/** "novembro de 2025", a partir do createdAt que a API devolve. */
function mesEAno(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/**
 * Segue / seguidores. O backend não tem sistema de amizade — nenhum model,
 * nenhuma rota — então os números ficam em zero e o bloco vem marcado como
 * "em breve". Colocar um contador qualquer aqui seria inventar relação social
 * que não existe.
 */
function ContadoresSociais() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-black">
      <span className="text-muted-foreground">Segue 0</span>
      <span className="text-muted-foreground">Tem 0 seguidores</span>
      <span className="rounded-md bg-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground">
        Em breve
      </span>
    </div>
  );
}

/** Onde a arte do Banner Richard deve estar. */
const ARTE_RICHARD = "/banner-richard.png";

/**
 * Arte do Banner Richard.
 *
 * Usa a ilustração de `/public` quando ela existe; se o arquivo não estiver
 * lá, cai no desenho vetorial antigo em vez de deixar a capa vazia. O
 * gradiente por trás não muda: o backend valida a cor exata em
 * `users.service.ts`, e alterá-la quebraria o desbloqueio da conquista.
 */
function ArteRichard() {
  const [semArquivo, setSemArquivo] = useState(false);

  if (!semArquivo) {
    return (
      <Image
        src={ARTE_RICHARD}
        alt=""
        fill
        sizes="(min-width: 1024px) 760px, 100vw"
        onError={() => setSemArquivo(true)}
        className="pointer-events-none select-none object-cover"
        priority={false}
      />
    );
  }

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><rect width="800" height="180" fill="#111827"/><g stroke="#38bdf8" strokeOpacity=".23" strokeWidth="1"><path d="M0 30h800M0 60h800M0 90h800M0 120h800M0 150h800M80 0v180M160 0v180M240 0v180M320 0v180M400 0v180M480 0v180M560 0v180M640 0v180M720 0v180"/></g><g fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round"><path d="m66 124 42-43 35 28 61-69"/><path d="M522 24h188M522 38h138M522 52h164"/></g><g fill="#38bdf8"><circle cx="108" cy="81" r="6"/><circle cx="143" cy="109" r="6"/><circle cx="204" cy="40" r="6"/></g><g transform="translate(528 98)"><rect width="202" height="48" rx="24" fill="#e0f2fe"/><text x="23" y="31" fill="#0c4a6e" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" letterSpacing="2">RICHARD</text><path d="m163 15 17 9-17 9z" fill="#0284c7"/></g></svg>
  );
}

const BANNER_DEV = "linear-gradient(135deg, #042f2e, #0f766e, #2dd4bf)";
const BANNER_TESTER = "linear-gradient(135deg, #172554, #2563eb, #60a5fa)";
const BANNER_PRO = "linear-gradient(135deg, #7c3aed, #d946ef 55%, #f0abfc)";
const BANNER_RICHARD = "linear-gradient(135deg, #111827, #1e3a8a 52%, #38bdf8)";

export function ProfileHeader({ perfil, editavel = true, onEditar }: ProfileHeaderProps) {
  const { salvarDados, cursosEmAndamento, cursosConcluidos } = usePerfil();
  const cursos = [...cursosEmAndamento, ...cursosConcluidos];
  const nivelMaximo = perfil.xpNecessarioNivel === null;
  const progresso = nivelMaximo
    ? 100
    : Math.min(100, Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100));

  // A capa e o ícone vêm direto do perfil: escolher os dois é papel do
  // EditorAvatar, e quando ele salva o perfil recarrega e chega aqui atualizado.
  const corCapa = perfil.bannerColor ?? "#22c55e";
  const avatar = perfil.avatarId ?? "orbit";
  const [editorAtivo, setEditorAtivo] = useState<"nome" | null>(null);
  const [nome, setNome] = useState(perfil.nome);

  useEffect(() => setNome(perfil.nome), [perfil.nome]);

  const salvarNome = () => { const novoNome = nome.trim(); if (novoNome && novoNome !== perfil.nome) void salvarDados({ nome: novoNome }); else setNome(perfil.nome); setEditorAtivo(null); };
  const capaStyle = { background: corCapa };
  const mostraArtePioneiro = corCapa === BANNER_TESTER;
  const mostraArteDev = corCapa === BANNER_DEV;
  const mostraArtePro = corCapa === BANNER_PRO;
  const mostraArteRichard = corCapa === BANNER_RICHARD;
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
        {/* A capa inteira é o botão de editar: no hover ela recebe o véu com o
            lápis no meio, e o clique abre a tela de edição do perfil. */}
        <div
          onClick={() => editavel && onEditar?.()}
          role={editavel ? "button" : undefined}
          tabIndex={editavel ? 0 : undefined}
          aria-label={editavel ? "Editar o perfil" : undefined}
          onKeyDown={(evento) => {
            if (!editavel || (evento.key !== "Enter" && evento.key !== " ")) return;
            evento.preventDefault();
            onEditar?.();
          }}
          className={cn(
            "relative h-[150px] overflow-hidden rounded-3xl border border-border",
            editavel && "group cursor-pointer"
          )}
          style={capaStyle}
        >
          {mostraArtePioneiro && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><rect width="800" height="180" fill="#101b4b"/><g stroke="#3b82f6" strokeOpacity=".28" strokeWidth="1"><path d="M0 30h800M0 60h800M0 90h800M0 120h800M0 150h800M80 0v180M160 0v180M240 0v180M320 0v180M400 0v180M480 0v180M560 0v180M640 0v180M720 0v180"/></g><path d="M-20 142C85 75 136 148 226 94S367 35 455 91 600 156 702 55 795 34 830 58" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/><g fill="#dbeafe"><circle cx="90" cy="103" r="7"/><circle cx="226" cy="94" r="7"/><circle cx="455" cy="91" r="7"/><circle cx="702" cy="55" r="7"/></g><g transform="translate(553 24)"><rect width="186" height="55" rx="27" fill="#dbeafe"/><text x="25" y="35" fill="#172554" fontFamily="Arial, sans-serif" fontSize="21" fontWeight="700" letterSpacing="3">BETA</text><path d="M136 16h28v6h-28zm0 12h28v6h-28zm0 12h18v6h-18z" fill="#2563eb"/></g></svg>}
          {mostraArteRichard && <ArteRichard />}
          {mostraArteDev && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="#99f6e4" strokeOpacity=".48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="m87 55-42 35 42 35m57-70 42 35-42 35m-23-82-20 124"/><path d="M476 145 596 22l65 69 58-91 66 145"/></g><g fill="#5eead4" fillOpacity=".28"><circle cx="596" cy="22" r="12"/><circle cx="661" cy="91" r="12"/><circle cx="719" cy="0" r="12"/></g><g transform="translate(595 110)"><rect width="153" height="42" rx="21" fill="#ccfbf1" fillOpacity=".94"/><text x="22" y="28" fill="#115e59" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" letterSpacing="2">BUILD</text><path d="m118 14 13 7-13 7z" fill="#0f766e"/></g></svg>}
          {mostraArtePro && <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice"><g fill="#fdf4ff" fillOpacity=".28"><circle cx="600" cy="32" r="4"/><circle cx="670" cy="72" r="7"/><circle cx="745" cy="28" r="4"/><circle cx="540" cy="115" r="5"/></g><path d="m627 37 16 34 37 5-27 26 7 37-33-18-33 18 7-37-27-26 37-5z" fill="#fef3c7" fillOpacity=".88"/><path d="M88 137 169 51l65 76 63-96 96 106" fill="none" stroke="#f5d0fe" strokeOpacity=".5" strokeWidth="5"/><g transform="translate(64 32)"><rect width="154" height="44" rx="22" fill="#fdf4ff" fillOpacity=".92"/><text x="25" y="29" fill="#86198f" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" letterSpacing="2">PRO</text></g></svg>}
          {/* Véu com o lápis cobrindo a capa inteira no hover. */}
          {editavel && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <Pencil className="size-7 text-white" />
            </span>
          )}

        </div>

      </div>

      <div className="relative px-1.5">
        {/* O avatar não é mais clicável: quem edita é o lápis da capa. */}
        <span className="relative -mt-[42px] flex size-24 items-center justify-center rounded-[28px] border-[5px] border-background bg-primary text-3xl font-black text-primary-foreground" style={{ background: corCapa ?? "#22c55e" }}>
          <AvatarIcon id={avatar} />
          <span className={cn("absolute -bottom-1.5 -right-2 z-10 rounded-lg border-[3px] border-background px-2 py-0.5 text-[0.68rem] font-black", seloPerfil.classe)}>
            {seloPerfil.texto}
          </span>
        </span>

        <div className="mt-3.5">
          <div className="flex items-center gap-3">{editorAtivo === "nome" ? <input autoFocus value={nome} onChange={e => setNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setNome(perfil.nome); setEditorAtivo(null); } }} className="w-full rounded-xl border border-primary bg-background px-3 py-1 text-2xl font-black text-foreground outline-none ring-2 ring-primary/20" /> : <button type="button" onClick={() => editavel && setEditorAtivo("nome")} className={cn("group flex items-center gap-2 text-left text-2xl font-black text-foreground", editavel && "cursor-text")}>{nome}{editavel && <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}</button>}{perfil.publicCode && <span className="text-sm font-black text-muted-foreground">#{perfil.publicCode}</span>}</div>
          {editavel && <p className="mt-0.5 text-sm text-muted-foreground/70">{perfil.email}</p>}

          {/* Identidade: desde quando está por aqui, o social e os cursos que
              a pessoa faz — o bloco da referência. */}
          <p className="mt-1.5 text-sm text-muted-foreground">
            {perfil.membroDesde ? `Por aqui desde ${mesEAno(perfil.membroDesde)}` : perfil.nivelLabel}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <ContadoresSociais />
            {/* Os cursos da pessoa viram só estes ladrilhos: o card que os
                listava embaixo saiu, então entram aqui os dois grupos — em
                andamento e concluídos — pra nenhum sumir da tela. */}
            {cursos.length > 0 && (
              <div className="flex items-center gap-2">
                {cursos.slice(0, 5).map((curso) => (
                  <span key={curso.id} title={`${curso.nome} · ${curso.percentual}%`} className="inline-flex">
                    <LadrilhoCurso curso={{ id: curso.id, name: curso.nome, icon: "" }} px={30} largura={42} />
                  </span>
                ))}
                {cursos.length > 5 && (
                  <span className="text-xs font-black text-muted-foreground">+{cursos.length - 5}</span>
                )}
              </div>
            )}
          </div>
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
