"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Palette, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";

type TemaComprado = {
  id: string;
  name: string;
  description: string;
  owned: boolean;
  equipped?: boolean;
  value: { primary?: string; accent?: string };
};

/**
 * A tela dos temas.
 *
 * Antes tudo isso morava espremido num card das Configurações, dividindo
 * espaço com notificações e sessão. Escolher aparência é a coisa que as
 * pessoas mais mexem, e cada tema é uma paleta que só faz sentido vista
 * grande — então virou tela própria.
 *
 * São duas escolhas independentes, e por isso ficam em blocos separados: o
 * claro/escuro, que muda o fundo, e a paleta, que muda a cor da marca. Uma não
 * substitui a outra — dá pra usar o tema Vulcão no claro ou no escuro.
 */
export function TemasContent() {
  const [temas, setTemas] = useState<TemaComprado[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [aplicando, setAplicando] = useState<string | null>(null);
  const { perfil, retry } = usePerfil();

  // Os temas de selo não vêm da loja: são liberados por quem a pessoa é.
  const exclusivos: TemaComprado[] = [
    ...(perfil?.isPro ? [{ id: "pro-theme", name: "Tema PRO", description: "Exclusivo dos assinantes PRO.", owned: true, value: { primary: "#a855f7", accent: "#f0abfc" } }] : []),
    ...(perfil?.isDeveloper ? [{ id: "developer-theme", name: "Tema Desenvolvedor", description: "Exclusivo da equipe ZulCode.", owned: true, value: { primary: "#0f766e", accent: "#2dd4bf" } }] : []),
    ...(perfil?.isEarlyTester ? [{ id: "early-tester-theme", name: "Tema Pioneiro", description: "Exclusivo da fase de testes.", owned: true, value: { primary: "#2563eb", accent: "#60a5fa" } }] : []),
  ];
  const disponiveis = [...temas, ...exclusivos];

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    // Sem sessão o caminho também é uma promessa, e não um retorno seco: aí
    // nenhum setState acontece de forma síncrona dentro do efeito.
    const pedido: Promise<(TemaComprado & { kind: string })[]> = token
      ? fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      : Promise.resolve([]);

    void pedido.then((itens) => {
      setTemas(itens.filter((item) => item.kind === "THEME" && item.owned));
      setCarregado(true);
    });
  }, []);

  const aplicar = async (tema: TemaComprado) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setAplicando(tema.id);
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics/${tema.id}/equip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) retry();
    } finally {
      setAplicando(null);
    }
  };

  const remover = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setAplicando("reset");
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics/theme/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) retry();
    } finally {
      setAplicando(null);
    }
  };

  return (
    <div className="pt-5 sm:pt-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Configurações
      </Link>

      <h1 className="mt-4 text-2xl font-black sm:text-3xl">Aparência</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted-foreground">
        Como o ZulCode aparece pra você. As duas escolhas abaixo são independentes.
      </p>

      <section className="mt-6 rounded-[20px] border border-border bg-card p-5">
        <h2 className="text-[0.95rem] font-black">Claro ou escuro</h2>
        <p className="mt-1 text-[0.82rem] text-muted-foreground">Muda o fundo e o contraste do aplicativo.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-4 rounded-[20px] border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-black">
          <Palette className="size-4 text-primary" />
          Paleta
        </h2>
        <p className="mt-1 text-[0.82rem] text-muted-foreground">
          Troca a cor da marca no aplicativo inteiro, sem mexer no claro/escuro.
        </p>

        {!carregado ? (
          <div className="mt-4 space-y-2">
            {[0, 1].map((i) => <span key={i} className="zc-esqueleto block h-[68px] rounded-2xl bg-muted" aria-hidden />)}
          </div>
        ) : disponiveis.length ? (
          <>
            {/* Uma coluna no celular, duas do sm pra cima: cada tema precisa de
                largura pra mostrar as duas cores e o nome sem apertar. */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {disponiveis.map((tema) => {
                const emUso = perfil?.themeColor?.toLowerCase() === tema.value.primary?.toLowerCase();
                const ocupado = aplicando !== null;
                return (
                  <button
                    key={tema.id}
                    type="button"
                    disabled={ocupado || emUso}
                    onClick={() => aplicar(tema)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-150 disabled:cursor-default",
                      emUso ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 disabled:opacity-60"
                    )}
                  >
                    <span className="flex shrink-0 gap-1">
                      {[tema.value.primary, tema.value.accent].map((cor, indice) => (
                        <span
                          key={indice}
                          className="size-8 rounded-lg border border-black/10"
                          style={{ background: cor ?? "var(--muted)" }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem] font-black">{tema.name}</span>
                      <span className="block truncate text-[0.76rem] text-muted-foreground">{tema.description}</span>
                    </span>
                    {aplicando === tema.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : emUso ? (
                      <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {perfil?.themeColor && (
              <button
                type="button"
                disabled={aplicando !== null}
                onClick={remover}
                className="mt-4 text-[0.8rem] font-black text-primary transition-opacity duration-150 hover:opacity-70 disabled:opacity-50"
              >
                {aplicando === "reset" ? "Voltando…" : "Voltar à paleta padrão"}
              </button>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-center">
            <p className="text-[0.85rem] text-muted-foreground">Você ainda não tem nenhuma paleta.</p>
            <Link
              href="/loja"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground transition-all duration-150 hover:brightness-110"
            >
              <ShoppingBag className="size-4" />
              Ver na Loja
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
