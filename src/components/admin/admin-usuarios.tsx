"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Coins, Flame, Heart, Search, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { cn } from "@/lib/utils";
import { BotaoAcao } from "./botao-acao";
import { chamarAdmin, useAcao } from "./use-acao";

export type UsuarioAdmin = {
  id: string;
  name: string;
  email: string;
  publicCode?: string;
  avatarId?: string;
  role: string;
  xp: number;
  coins: number;
  lives: number;
  currentStreak: number;
  isPro: boolean;
  isDeveloper: boolean;
  isEarlyTester: boolean;
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
};

type Selo = "isPro" | "isDeveloper" | "isEarlyTester" | "isVerified";

const SELOS: { campo: Selo; rotulo: string; cor: string }[] = [
  { campo: "isVerified", rotulo: "Verificado", cor: "bg-sky-500" },
  { campo: "isPro", rotulo: "Pro", cor: "bg-violet-500" },
  { campo: "isDeveloper", rotulo: "Dev", cor: "bg-teal-500" },
  { campo: "isEarlyTester", rotulo: "Tester", cor: "bg-blue-500" },
];

const FILTROS = [
  { valor: "all", rotulo: "Todos" },
  { valor: "whitelist", rotulo: "Ativos" },
  { valor: "blacklist", rotulo: "Bloqueados" },
];

/** Botão de selo: cada um espera a própria requisição, sem travar os vizinhos. */
function BotaoSelo({ usuario, campo, rotulo, cor, aoMudar }: { usuario: UsuarioAdmin; campo: Selo; rotulo: string; cor: string; aoMudar: () => Promise<void> }) {
  const ligado = usuario[campo];
  const { estado, rodar, enviando } = useAcao(async () => {
    await chamarAdmin(
      `${API_BASE_URL}/admin/users/${usuario.id}/badges`,
      { method: "PATCH", body: JSON.stringify({ [campo]: !ligado }) },
      "Não foi possível alterar o selo."
    );
    await aoMudar();
  });

  return (
    <button
      type="button"
      onClick={() => void rodar()}
      disabled={enviando}
      aria-pressed={ligado}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all duration-200 disabled:opacity-60",
        ligado ? `${cor} text-white` : "bg-muted text-muted-foreground hover:text-foreground",
        estado === "enviando" && "animate-pulse"
      )}
    >
      {campo === "isVerified" && ligado && <SeloVerificado className="text-[0.9rem] text-white" />}
      {rotulo}
    </button>
  );
}

/** Um número da ficha, com ícone. */
function Medida({ Icone, rotulo, valor, cor }: { Icone: typeof Coins; rotulo: string; valor: number; cor: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 text-center">
      <Icone className={cn("mx-auto size-4", cor)} />
      <strong className="mt-1.5 block text-lg font-black tabular-nums">{valor}</strong>
      <span className="text-[0.68rem] font-black uppercase tracking-wide text-muted-foreground">{rotulo}</span>
    </div>
  );
}

/**
 * Ficha do usuário.
 *
 * Antes cada pessoa era uma linha com quatro botõezinhos no canto, e não havia
 * onde caber moedas, XP e penas sem virar sopa. Aqui a pessoa inteira fica num
 * painel só: quem ela é, quanto tem, quais selos carrega e o que dá pra fazer.
 */
function FichaUsuario({ usuario, aoFechar, recarregar }: { usuario: UsuarioAdmin; aoFechar: () => void; recarregar: () => Promise<void> }) {
  const [moedas, setMoedas] = useState("");
  const [xp, setXp] = useState("");
  const [penas, setPenas] = useState("");
  const [motivo, setMotivo] = useState("");
  const [motivoBan, setMotivoBan] = useState("");

  const nada = !moedas && !xp && !penas;

  const conceder = useAcao(async () => {
    await chamarAdmin(
      `${API_BASE_URL}/admin/users/${usuario.id}/resources`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...(moedas ? { coins: Number(moedas) } : {}),
          ...(xp ? { xp: Number(xp) } : {}),
          ...(penas ? { lives: Number(penas) } : {}),
          ...(motivo.trim() ? { reason: motivo.trim() } : {}),
        }),
      },
      "Não foi possível conceder os recursos."
    );
    setMoedas("");
    setXp("");
    setPenas("");
    setMotivo("");
    await recarregar();
  });

  const banir = useAcao(async () => {
    const caminho = usuario.isBanned ? "unban" : "ban";
    await chamarAdmin(
      `${API_BASE_URL}/admin/users/${usuario.id}/${caminho}`,
      {
        method: "PATCH",
        ...(usuario.isBanned ? {} : { body: JSON.stringify({ reason: motivoBan.trim() || "Bloqueado pela administração" }) }),
      },
      "Não foi possível concluir."
    );
    setMotivoBan("");
    await recarregar();
  });

  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-40 bg-black/50" onClick={aoFechar} role="presentation" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${usuario.name}`}
        className="zc-scroll-hidden fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <AvatarIcon id={usuario.avatarId ?? "orbit"} />
            </span>
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 truncate text-xl font-black">
                {usuario.name}
                {usuario.isVerified && <SeloVerificado className="text-[1.1rem]" />}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{usuario.email}</p>
            </div>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar ficha" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {usuario.isBanned && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">
            Bloqueado{usuario.banReason ? `: ${usuario.banReason}` : "."}
          </p>
        )}

        <div className="mt-6 grid grid-cols-4 gap-2">
          <Medida Icone={Zap} rotulo="XP" valor={usuario.xp} cor="text-amber-500" />
          <Medida Icone={Coins} rotulo="Moedas" valor={usuario.coins} cor="text-yellow-500" />
          <Medida Icone={Heart} rotulo="Penas" valor={usuario.lives} cor="text-rose-500" />
          <Medida Icone={Flame} rotulo="Ofensiva" valor={usuario.currentStreak} cor="text-orange-500" />
        </div>

        <section className="mt-7">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="size-4" /> Selos
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {SELOS.map((selo) => (
              <BotaoSelo key={selo.campo} usuario={usuario} campo={selo.campo} rotulo={selo.rotulo} cor={selo.cor} aoMudar={recarregar} />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            O verificado é só a marca do lado do nome: não troca avatar, capa nem tema, e não tem relação com o Pro.
          </p>
        </section>

        <section className="mt-7 rounded-2xl border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-4" /> Conceder recursos
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Os valores somam ao que a pessoa já tem. Use negativo para retirar. As penas param em 5.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { rotulo: "Moedas", valor: moedas, set: setMoedas },
              { rotulo: "XP", valor: xp, set: setXp },
              { rotulo: "Penas", valor: penas, set: setPenas },
            ].map((campo) => (
              <label key={campo.rotulo} className="text-[0.68rem] font-black uppercase tracking-wide text-muted-foreground">
                {campo.rotulo}
                <input
                  type="number"
                  value={campo.valor}
                  onChange={(e) => campo.set(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-bold tabular-nums text-foreground outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (fica no extrato da pessoa)"
            maxLength={160}
            className="mt-2.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <BotaoAcao
            estado={conceder.estado}
            onClick={() => void conceder.rodar()}
            disabled={nada}
            rotuloEnviando="Concedendo…"
            rotuloConcluido="Concedido"
            className="mt-3 w-full"
          >
            Conceder
          </BotaoAcao>
          {conceder.erro && <p className="mt-2 text-sm font-bold text-destructive">{conceder.erro}</p>}
        </section>

        <section className="mt-7 rounded-2xl border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
            <Ban className="size-4" /> Acesso
          </h3>
          {!usuario.isBanned && (
            <input
              value={motivoBan}
              onChange={(e) => setMotivoBan(e.target.value)}
              placeholder="Motivo do bloqueio"
              className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          )}
          <BotaoAcao
            estado={banir.estado}
            onClick={() => void banir.rodar()}
            variante={usuario.isBanned ? "primario" : "perigo"}
            rotuloEnviando={usuario.isBanned ? "Desbloqueando…" : "Bloqueando…"}
            rotuloConcluido="Pronto"
            className="mt-3 w-full"
          >
            {usuario.isBanned ? "Desbloquear conta" : "Bloquear conta"}
          </BotaoAcao>
          {banir.erro && <p className="mt-2 text-sm font-bold text-destructive">{banir.erro}</p>}
        </section>
      </aside>
    </>
  );
}

export function AdminUsers() {
  const [filtro, setFiltro] = useState("all");
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  // De qual filtro e a lista que esta na tela. Enquanto ele nao alcanca o
  // filtro escolhido, o esqueleto aparece -- o carregamento e deduzido, e nao
  // uma bandeira ligada na mao. Assim recarregar depois de conceder algo nao
  // pisca esqueleto nenhum: a lista continua sendo do mesmo filtro.
  const [carregadoDe, setCarregadoDe] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  // `comEsqueleto` so na primeira carga e na troca de filtro. Quando a ficha
  // recarrega depois de conceder algo, a lista continua na tela e so os
  // numeros mudam -- piscar o esqueleto ali daria a impressao de que a pagina
  // recomecou do zero.
  const carregar = useCallback(async () => {
    try {
      const dados = await chamarAdmin(`${API_BASE_URL}/admin/users?filter=${filtro}`, {}, "Não foi possível carregar os usuários.");
      setUsuarios(Array.isArray(dados) ? dados : []);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os usuários.");
    } finally {
      setCarregadoDe(filtro);
    }
  }, [filtro]);

  // Todo setState do `carregar` acontece depois do await, entao nao ha
  // atualizacao sincrona dentro do efeito. A regra nao consegue enxergar isso
  // atraves do useCallback e acusa de qualquer jeito.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void carregar(); }, [carregar]);

  const carregando = carregadoDe !== filtro;

  // A busca é local: a lista já veio inteira do servidor, então filtrar aqui
  // responde a cada tecla sem uma ida e volta na rede por letra digitada.
  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase().replace(/^#/, "");
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) => u.name.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo) || (u.publicCode ?? "").includes(termo)
    );
  }, [usuarios, busca]);

  const aberto = usuarios.find((u) => u.id === abertoId) ?? null;

  return (
    <section className="py-7">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Acesso</p>
      <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Usuários</h1>
      <p className="mt-2 text-muted-foreground">Abra uma pessoa para ver a ficha, mexer nos selos e conceder recursos.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou código"
            className="w-full rounded-xl border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        {FILTROS.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setFiltro(item.valor)}
            className={cn(
              "rounded-xl px-4 py-3 text-sm font-black transition-colors duration-150",
              filtro === item.valor ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{erro}</p>}

      {carregando ? (
        <div className="mt-5 space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {visiveis.map((usuario, indice) => (
            <button
              key={usuario.id}
              type="button"
              onClick={() => setAbertoId(usuario.id)}
              style={{ animationDelay: `${Math.min(indice, 12) * 25}ms` }}
              className="animate-fade-in-up flex w-full items-center gap-3.5 rounded-2xl border bg-card p-3.5 text-left transition-colors duration-150 hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <AvatarIcon id={usuario.avatarId ?? "orbit"} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate font-black">
                  {usuario.name}
                  {usuario.isVerified && <SeloVerificado className="text-[0.95rem]" />}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {usuario.email} · {usuario.xp} XP · {usuario.coins} moedas
                </span>
              </span>
              <span className="hidden shrink-0 gap-1.5 sm:flex">
                {SELOS.filter((s) => usuario[s.campo]).map((s) => (
                  <span key={s.campo} className={cn("rounded-lg px-2 py-1 text-[0.65rem] font-black text-white", s.cor)}>
                    {s.rotulo}
                  </span>
                ))}
                {usuario.isBanned && <span className="rounded-lg bg-destructive px-2 py-1 text-[0.65rem] font-black text-white">Bloqueado</span>}
              </span>
            </button>
          ))}
          {!visiveis.length && (
            <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              {busca ? "Ninguém encontrado para essa busca." : "Nenhum usuário nesse filtro."}
            </p>
          )}
        </div>
      )}

      {aberto && <FichaUsuario usuario={aberto} aoFechar={() => setAbertoId(null)} recarregar={carregar} />}
    </section>
  );
}
