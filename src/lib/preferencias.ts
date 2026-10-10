"use client";

import { useSyncExternalStore } from "react";

/**
 * Preferências deste aparelho: som e vibração.
 *
 * Ficam no aparelho, e não na conta, de propósito: a mesma pessoa quer o
 * celular em silêncio no ônibus e o computador com som em casa.
 */
export interface Preferencias {
  sons: boolean;
  vibracao: boolean;
}

const PADRAO: Preferencias = { sons: true, vibracao: true };
const CHAVE = "zc-preferencias";

let atuais: Preferencias | null = null;
const ouvintes = new Set<() => void>();

function ler(): Preferencias {
  if (atuais) return atuais;
  try {
    atuais = { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? "{}") };
  } catch {
    // Armazenamento bloqueado (aba anônima): vale o padrão, só não fica salvo.
    atuais = { ...PADRAO };
  }
  return atuais!;
}

/** Para quem toca som ou vibra fora de um componente. */
export function lerPreferencias(): Preferencias {
  return typeof window === "undefined" ? PADRAO : ler();
}

export function mudarPreferencia<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]) {
  atuais = { ...ler(), [chave]: valor };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atuais));
  } catch {
    // Sem armazenamento, a escolha vale até fechar o app.
  }
  ouvintes.forEach((f) => f());
}

export function usePreferencias(): Preferencias {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      // Outra aba mudou: relê da próxima vez.
      const outraAba = (e: StorageEvent) => {
        if (e.key !== CHAVE) return;
        atuais = null;
        f();
      };
      window.addEventListener("storage", outraAba);
      return () => {
        ouvintes.delete(f);
        window.removeEventListener("storage", outraAba);
      };
    },
    ler,
    () => PADRAO,
  );
}
