"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilaDeComemoracoes } from "@/components/comemoracoes/fila";
import type { Comemoracao } from "@/lib/types/comemoracao";
import type { Raridade } from "@/lib/barril";

export function PreviaDasComemoracoes() {
  const busca = useSearchParams();
  const antes = Number(busca.get("antes") ?? 6);
  const depois = Number(busca.get("depois") ?? antes + 1);
  const so = busca.get("so");
  const [rodada, setRodada] = useState(0);

  const todas: Comemoracao[] = [
    { tipo: "ofensiva", ofensiva: { antes, depois, protegida: busca.get("protegida") === "1" } },
    // Com ?barril=<id> de um barril de verdade, o "Abrir" abre mesmo.
    { tipo: "barril", barril: { id: busca.get("barril") ?? "", raridade: (busca.get("raridade") as Raridade) ?? "epico", origem: "ofensiva-30" } },
    { tipo: "divisao", divisaoId: busca.get("divisao") ?? "ouro" },
    { tipo: "conquista", conquista: { id: busca.get("conquista") ?? "first-lesson", title: "Primeiro passo", description: "Conclua a sua primeira lição no ZulCode.", coins: 50 } },
  ];
  const itens = so ? todas.filter((c) => c.tipo === so) : todas;

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6 text-center">
      <button type="button" onClick={() => setRodada((r) => r + 1)} className="rounded-2xl bg-primary px-6 py-3 font-black text-primary-foreground">
        Ver de novo
      </button>
      <FilaDeComemoracoes key={rodada} itens={itens} aoTerminar={() => setRodada((r) => r + 1)} />
    </main>
  );
}
