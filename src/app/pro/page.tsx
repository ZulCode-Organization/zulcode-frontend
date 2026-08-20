"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, X, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ChamasRoxas } from "@/components/pro/chamas-roxas";

/**
 * Página do PRO — tela cheia, sem sidebar, como as telas de oferta que a
 * referência mostra. No lugar da faixa de nuvens, chamas roxas: a ave da
 * marca sai de dentro do fogo.
 *
 * Nenhum preço aparece aqui de propósito. O PRO ainda não abriu e o app
 * inteiro diz isso ("tá chegando"); inventar valor e um botão de assinar que
 * não cobra nada seria mentir pro usuário. A estrutura dos planos está
 * pronta: quando os valores existirem, entram em PLANOS abaixo.
 */

const COMPARACAO = [
  { recurso: "Conteúdo completo", gratis: true },
  { recurso: "Vidas ilimitadas", gratis: false },
  { recurso: "XP em dobro", gratis: false },
  { recurso: "Sem anúncios", gratis: false },
];

export default function ProPage() {
  useRequireAuth();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#0b0414]">
      {/* ---------- Topo escuro: a ave saindo das chamas ---------- */}
      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fechar"
          className="absolute left-4 top-4 z-30 flex size-10 items-center justify-center rounded-xl text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:left-8 lg:top-6"
        >
          <X className="size-5" />
        </button>

        <span className="absolute right-4 top-5 z-30 rounded-lg bg-violet-600 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-white lg:right-8 lg:top-7">
          Pro
        </span>

        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pb-0 pt-20 text-center sm:pt-24">
          <h1 className="text-balance text-2xl font-black leading-tight text-white sm:text-[2rem]">
            Aprenda sem freio com o{" "}
            <span className="text-violet-400">ZulCode PRO</span>
          </h1>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/70">
            Vidas ilimitadas pra errar quantas vezes precisar, XP em dobro e
            nenhum anúncio no meio do caminho.
          </p>

          {/* Faíscas soltas, como as estrelinhas da referência. */}
          <span className="pointer-events-none absolute left-[12%] top-[42%] size-2 rotate-45 bg-violet-300/80" aria-hidden />
          <span className="pointer-events-none absolute right-[14%] top-[38%] size-3 rotate-45 bg-fuchsia-300/70" aria-hidden />
          <span className="pointer-events-none absolute right-[26%] top-[58%] size-1.5 rotate-45 bg-violet-200/70" aria-hidden />

          {/* A ave fica atrás das chamas (que são desenhadas depois, fora
              desta coluna): o fogo cobre a base dela e ela parece sair de
              dentro. */}
          <div className="relative mt-8 h-[250px] w-full sm:h-[280px]">
            <div
              className="zc-brasa absolute bottom-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-violet-600/55 blur-3xl"
              aria-hidden
            />
            <Image
              src="/icon-only.svg"
              alt=""
              width={160}
              height={160}
              priority
              className="absolute bottom-[112px] left-1/2 z-10 w-[152px] -translate-x-1/2 sm:bottom-[124px] sm:w-[176px]"
            />
          </div>
        </div>

        {/* Fora da coluna de texto pra pegar a largura inteira da tela — dentro
            dela, o fogo ficava numa faixa central com o fundo escuro sobrando
            dos dois lados. */}
        <ChamasRoxas className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[180px] w-full sm:h-[205px]" />
      </div>

      {/* ---------- Comparação, sobre fundo claro ---------- */}
      <div className="bg-background px-6 pb-16 pt-10">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1 sm:gap-x-10">
            <span />
            <span className="pb-3 text-center text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">
              Grátis
            </span>
            <span className="pb-3 text-center">
              <span className="rounded-lg bg-violet-600 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-white">
                Pro
              </span>
            </span>

            {COMPARACAO.map((linha) => (
              <div key={linha.recurso} className="contents">
                <span className="border-t border-border py-4 text-[0.95rem] text-foreground">
                  {linha.recurso}
                </span>
                <span className="flex justify-center border-t border-border py-4">
                  {linha.gratis ? (
                    <Check className="size-5 text-foreground" strokeWidth={3} />
                  ) : (
                    <Minus className="size-5 text-muted-foreground/50" />
                  )}
                </span>
                <span className="flex justify-center border-t border-border bg-violet-500/10 py-4">
                  <Check className="size-5 text-violet-500" strokeWidth={3} />
                </span>
              </div>
            ))}
          </div>

          {/* ---------- Planos ---------- */}
          <div className="mt-10 rounded-[20px] border-2 border-dashed border-violet-500/40 bg-violet-500/5 px-6 py-7 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/15 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-violet-500">
              <Zap className="size-3.5" />
              Chegando
            </span>
            <h2 className="mt-3 text-lg font-black text-foreground">
              Os planos ainda estão sendo fechados
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[0.9rem] leading-relaxed text-muted-foreground">
              Preferimos abrir com preço certo e cobrança funcionando do que
              com uma tela bonita que não cobra nada. Quando abrir, o aviso
              aparece aqui e na Loja.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-2xl bg-violet-600/40 py-4 text-[0.82rem] font-black uppercase tracking-[0.06em] text-white/70"
          >
            Assinar — em breve
          </button>

          <Link
            href="/loja"
            className="mt-3 block py-2 text-center text-[0.8rem] font-black uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Agora não
          </Link>
        </div>
      </div>
    </div>
  );
}
