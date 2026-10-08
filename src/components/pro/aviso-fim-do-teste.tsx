"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { SeloPro } from "@/components/shared/selo-pro";
import { estadoDaAssinatura, fimDoTeste, type EstadoAssinatura } from "@/lib/pro/planos";
import { GRADIENTE_PRO } from "./momentos";

// Cada tela monta o próprio AppShell; sem isto, navegar pelo app pediria o
// estado da assinatura de novo a cada troca de página.
let consulta: { quando: number; promessa: Promise<EstadoAssinatura> } | null = null;
const estadoGuardado = () => {
  if (!consulta || Date.now() - consulta.quando > 10 * 60_000) {
    const promessa = estadoDaAssinatura();
    promessa.catch(() => {
      consulta = null;
    });
    consulta = { quando: Date.now(), promessa };
  }
  return consulta.promessa;
};

const lerDispensa = (chave: string) => {
  try {
    return localStorage.getItem(chave) === "1";
  } catch {
    return false;
  }
};

/**
 * O aviso do último dia de teste, prometido na tela do PRO.
 *
 * O e-mail de três dias antes sai pelo Stripe; este é o segundo lembrete, aqui
 * dentro, nas últimas 24 horas. Só aparece para quem está em teste e não
 * cancelou — e, dispensado, não volta para aquele mesmo teste.
 */
export function AvisoFimDoTeste() {
  const { perfil } = usePerfil();
  const [estado, setEstado] = useState<EstadoAssinatura | null>(null);
  const [dispensado, setDispensado] = useState(false);
  const ehPro = Boolean(perfil?.isPro);

  useEffect(() => {
    if (!ehPro) return;
    let vivo = true;
    estadoGuardado()
      .then((e) => vivo && setEstado(e))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [ehPro]);

  const teste = fimDoTeste(estado);
  if (!estado || !teste || teste.horasRestantes > 24 || estado.canceladaNoFim) return null;

  const chave = `zulcode:aviso-teste:${estado.validoAte}`;
  if (dispensado || lerDispensa(chave)) return null;

  const hora = new Date(teste.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <aside
      role="status"
      className="zc-pro-sobe fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-40 rounded-[20px] p-4 text-white shadow-[0_12px_40px_rgba(79,99,227,.45)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[340px]"
      style={{ background: GRADIENTE_PRO }}
    >
      <button
        type="button"
        aria-label="Dispensar aviso"
        onClick={() => {
          try {
            localStorage.setItem(chave, "1");
          } catch {}
          setDispensado(true);
        }}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white"
      >
        <X className="size-4" strokeWidth={2.6} />
      </button>
      <SeloPro className="h-5" />
      <p className="mt-2 text-[1.05rem] font-black leading-tight">Seu teste termina hoje</p>
      <p className="mt-1 text-[0.85rem] leading-snug text-white/85">
        A primeira cobrança acontece às {hora}. Para não pagar, cancele antes disso.
      </p>
      <Link
        href="/pro"
        className="zc-press mt-3 block rounded-[14px] bg-white py-3 text-center text-[0.75rem] font-black uppercase tracking-[0.06em] text-violet-700"
      >
        Ver minha assinatura
      </Link>
    </aside>
  );
}
