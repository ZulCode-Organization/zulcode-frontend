"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useRedirectIfAuth } from "@/hooks/useAuthGuard";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { FundoAscii, type FundoAsciiControle } from "@/components/fundo-ascii/fundo-ascii";
import { CabecaDoZul, useReacaoDoZul, type AnimacaoDaCabeca, type ReacaoDoZul } from "@/components/zul/cabeca-do-zul";
import { LoginForm, type CampoDaEntrada } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { vibrar } from "@/lib/reacoes/vibrar";
import { tocar } from "@/lib/reacoes/sons";
import { prepararReacoes } from "@/lib/reacoes";
import { cn } from "@/lib/utils";

type Modo = "inicio" | "entrar" | "criar";

/** O que o Zul diz a cada toque nele, em ordem. */
const FALAS_DO_TOQUE: { fala: string; reacao: ReacaoDoZul }[] = [
  { fala: "Ei, isso faz cócegas!", reacao: "aperta" },
  { fala: 'print("oi!")', reacao: "pulo" },
  { fala: "Bora programar?", reacao: "gira" },
  { fala: "Mais um toque e eu viro bug!", reacao: "treme" },
  { fala: "Achou um easter egg!", reacao: "danca" },
];

const FALA_DO_MODO: Record<Modo, string> = {
  inicio: "Oi! Eu sou o Zul.",
  entrar: "Que bom te ver de novo!",
  criar: "Bora criar sua conta!",
};

const FALA_DO_CAMPO: Record<Exclude<CampoDaEntrada, null>, string> = {
  nome: "Como você quer ser chamado?",
  email: "Pode digitar, eu acompanho.",
  senha: "Não tô olhando, juro!",
};

/**
 * A porta de entrada: o planeta de caracteres da landing girando no pé da
 * tela, o Zul flutuando (toque nele!) e os dois botões. Entrar e criar conta
 * sobem numa folha por cima, sem trocar de página: o Zul vai para a borda da
 * folha e comenta o que a pessoa está preenchendo.
 */
export default function Welcome() {
  useRedirectIfAuth();
  const fundo = useRef<FundoAsciiControle>(null);
  const { reacao, reagir } = useReacaoDoZul();
  const [animacao, setAnimacao] = useState<AnimacaoDaCabeca>("olhando");
  const [modo, setModo] = useState<Modo>("inicio");
  // O último formulário aberto fica na folha enquanto ela desce, em vez de sumir antes.
  const [formulario, setFormulario] = useState<Exclude<Modo, "inicio">>("criar");
  const [fala, setFala] = useState(FALA_DO_MODO.inicio);
  const toques = useRef(0);
  // Só a primeira fala espera o Zul terminar de cair; as outras entram na hora.
  const [mexeu, setMexeu] = useState(false);
  const volta = useRef<number | null>(null);
  const aberto = modo !== "inicio";

  useEffect(() => {
    prepararReacoes("toque");
    return () => {
      if (volta.current) window.clearTimeout(volta.current);
    };
  }, []);

  // No Android, o botão voltar fecha a folha em vez de sair da tela.
  useEffect(() => {
    if (!aberto) return;
    let remover: (() => void) | null = null;
    let desmontou = false;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("App")) return;
      const { App } = await import("@capacitor/app");
      const ouvinte = await App.addListener("backButton", () => {
        setModo("inicio");
        setFala(FALA_DO_MODO.inicio);
      });
      if (desmontou) void ouvinte.remove();
      else remover = () => void ouvinte.remove();
    })();
    return () => {
      desmontou = true;
      remover?.();
    };
  }, [aberto]);

  const balancar = () => {
    setAnimacao("balancando");
    if (volta.current) window.clearTimeout(volta.current);
    volta.current = window.setTimeout(() => setAnimacao("olhando"), 2400);
  };

  const tocarNoZul = () => {
    const { fala: f, reacao: r } = FALAS_DO_TOQUE[toques.current % FALAS_DO_TOQUE.length];
    toques.current += 1;
    setMexeu(true);
    reagir(r);
    window.setTimeout(() => void vibrar("toque"), 70);
    setFala(f);
    if (r === "gira" || r === "danca") balancar();
    fundo.current?.girar();
  };

  const abrir = (novo: Modo) => {
    setModo(novo);
    setFala(FALA_DO_MODO[novo]);
    setMexeu(true);
    if (novo !== "inicio") {
      setFormulario(novo);
      reagir("pulo");
      window.setTimeout(() => void vibrar("toque"), 70);
      fundo.current?.girar(0.003);
    }
  };

  const aoCampo = (campo: CampoDaEntrada) => {
    if (campo) {
      setFala(FALA_DO_CAMPO[campo]);
      reagir(campo === "senha" ? "inclina" : "aperta");
      void vibrar("toque");
    }
  };

  return (
    <div
      className="fixed inset-0 touch-pan-y overflow-hidden bg-background text-foreground"
      // Todo botão tocado aqui responde com o clique das aulas e uma vibração forte.
      onClickCapture={(e) => {
        if (!(e.target as HTMLElement).closest("button:not(:disabled)")) return;
        void tocar("toque");
        void vibrar("impacto");
      }}
    >
      {/* Com a folha aberta, as ondas do nivelamento sobem e ficam atrás do Zul. */}
      <FundoAscii
        ref={fundo}
        modo={aberto ? "ondas" : "globo"}
        alturaDasOndas={aberto ? 0.05 : 0.62}
        origemDaTroca={{ x: 0.5, y: 0.98 }}
        arrastavel
      />

      {/* O Zul, o nome e os botões. Somem para trás quando a folha sobe. */}
      <div
        className={cn(
          "relative mx-auto flex h-full w-full max-w-md flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] transition-[opacity,transform] duration-500",
          aberto && "pointer-events-none -translate-y-10 scale-95 opacity-0",
        )}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <p key={fala} aria-live="polite" className="zc-balao-entra rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-[0.95rem] font-extrabold text-foreground" style={{ animationDelay: mexeu ? "0s" : "0.9s" }}>
            {fala}
          </p>
          <button type="button" onClick={tocarNoZul} aria-label="Tocar no Zul" className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
            <CabecaDoZul animacao={animacao} reacao={reacao} cair sombra className="size-44" alt="O Zul, mascote do ZulCode" />
          </button>
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <h1 className="animate-fade-in-up text-4xl font-black tracking-tight text-foreground" style={{ animationDelay: "1s" }}>
              ZulCode
            </h1>
            <p className="animate-fade-in-up max-w-xs font-bold leading-relaxed text-muted-foreground" style={{ animationDelay: "1.1s" }}>
              Aprenda programação de forma gamificada, um pouquinho por dia.
            </p>
          </div>
        </div>
        <div className="animate-fade-in-up flex flex-col gap-4" style={{ animationDelay: "1.2s" }}>
          <BotaoRelevo onClick={() => abrir("criar")}>Começar agora</BotaoRelevo>
          <BotaoRelevo variante="neutro" onClick={() => abrir("entrar")}>
            Já tenho uma conta
          </BotaoRelevo>
        </div>
      </div>

      {/* A folha de entrar / criar conta, com o Zul espiando na borda. */}
      <div
        role="dialog"
        aria-modal={aberto}
        aria-label={formulario === "entrar" ? "Entrar na sua conta" : "Criar sua conta"}
        inert={!aberto}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-8.5rem-env(safe-area-inset-top))] w-full max-w-md flex-col rounded-t-[1.75rem] border-x-2 border-t-2 border-border bg-card transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.22,1.15,.36,1)]",
          // Fechada, desce também a altura do Zul que fica em cima dela: senão a cabeça espiava no pé da tela.
          aberto ? "translate-y-0" : "translate-y-[calc(100%+9rem)]",
        )}
      >
        <div className={cn("pointer-events-none absolute -top-[6.75rem] left-5 right-5 flex items-end gap-3 transition-opacity duration-300", !aberto && "opacity-0")}>
          <CabecaDoZul animacao={animacao} reacao={reacao} className="size-20 shrink-0" />
          {aberto && (
            <p key={fala} className="zc-balao-entra mb-3 rounded-2xl border-2 border-border bg-card px-3.5 py-2 text-sm font-extrabold text-foreground">
              {fala}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => abrir("inicio")}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" strokeWidth={2.6} />
        </button>
        <div className="zc-scroll-hidden flex justify-center overflow-y-auto px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7">
          {formulario === "entrar" ? (
            <Suspense fallback={<div className="h-[420px] w-full max-w-sm" />}>
              <LoginForm onTrocar={() => abrir("criar")} onCampo={aoCampo} />
            </Suspense>
          ) : (
            <SignupForm onTrocar={() => abrir("entrar")} onCampo={aoCampo} />
          )}
        </div>
      </div>
    </div>
  );
}
