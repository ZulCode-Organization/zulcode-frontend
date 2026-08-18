"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { tabelaLideresBloqueio } from "@/data/painel-lateral";

const DIVISOES = [
  { id: "bronze", nome: "Bronze", cor: "bg-[#C08457]", atual: true, tamanho: 74 },
  { id: "prata", nome: "Prata", cor: "bg-muted", atual: false, tamanho: 56 },
  { id: "ouro", nome: "Ouro", cor: "bg-muted", atual: false, tamanho: 56 },
  { id: "safira", nome: "Safira", cor: "bg-muted", atual: false, tamanho: 56 },
];

function LideresContent() {
  const { perfil } = usePerfil();
  const xpAtual = perfil?.xp ?? 0;
  const falta = Math.max(0, tabelaLideresBloqueio.xpNecessario - xpAtual);
  const pct = Math.min(100, Math.round((xpAtual / tabelaLideresBloqueio.xpNecessario) * 100));

  return (
    <div className="mx-auto max-w-[640px] pt-3">
      <div className="flex origin-top scale-[0.8] flex-wrap items-end justify-center gap-3.5 sm:scale-100">
        {DIVISOES.map((divisao) => (
          <span
            key={divisao.id}
            title={divisao.nome}
            style={{ width: divisao.tamanho, height: divisao.tamanho }}
            className={`flex items-center justify-center rounded-[16px_16px_26px_26px] shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] ${divisao.cor}`}
          >
            <Trophy
              className={`size-6.5 ${divisao.atual ? "text-white/90" : "text-muted-foreground/60"}`}
            />
          </span>
        ))}
      </div>

      <div className="-mt-2 text-center sm:mt-5.5">
        <h1 className="text-xl font-black text-foreground sm:text-2xl">Divisão Bronze</h1>
        <p className="mt-2 text-[0.88rem] text-muted-foreground sm:text-[0.95rem]">
          O ranking abre quando você alcançar {tabelaLideresBloqueio.xpNecessario} XP.
        </p>
      </div>

      <div className="my-4 h-px bg-border sm:my-5.5" aria-hidden />

      <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-sm font-extrabold">
          <span className="text-foreground">Seu progresso</span>
          <span className="text-primary">
            {xpAtual} / {tabelaLideresBloqueio.xpNecessario} XP
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {falta === 0
            ? "Você já tem XP suficiente — a disputa entre alunos entra no ar em breve."
            : `Faltam ${falta} XP pra você entrar na disputa. Cada lição concluída te aproxima.`}
        </p>
        <Link
          href="/home"
          className="mt-5 block rounded-[14px] border-2 border-border py-3.5 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          Começar uma lição
        </Link>
      </div>
    </div>
  );
}

export default function TabelaLideresPage() {
  useRequireAuth();

  return (
    <AppShell rightPanel={<SideFooter />}>
      <LideresContent />
    </AppShell>
  );
}
