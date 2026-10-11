"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { aoTocarNumAviso } from "@/lib/avisos";

/** Tocar numa notificação abre o app já na tela dela (a "rota" do aviso). */
export function AbrirPeloAviso() {
  const router = useRouter();
  useEffect(() => {
    let parar: (() => void) | null = null;
    let desmontou = false;
    void aoTocarNumAviso((rota) => router.push(rota)).then((f) => {
      if (desmontou) f();
      else parar = f;
    });
    return () => {
      desmontou = true;
      parar?.();
    };
  }, [router]);
  return null;
}
