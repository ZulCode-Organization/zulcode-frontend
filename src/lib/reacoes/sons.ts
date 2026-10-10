"use client";

import { lerPreferencias } from "@/lib/preferencias";

/**
 * Os sons do app.
 *
 * Vêm de pacotes do Kenney (kenney.nl), domínio público (CC0): uso livre,
 * crédito opcional — damos assim mesmo, nas Configurações. Para trocar um som,
 * substitua o arquivo em /public/sons ou aponte outro aqui.
 *
 * O volume de cada um equaliza os arquivos, que vêm de pacotes diferentes e
 * não têm a mesma altura: sem isso o acerto soaria o dobro do erro.
 */
const SONS = {
  toque: { arquivo: "toque.ogg", volume: 0.5 },
  acerto: { arquivo: "acerto.ogg", volume: 0.6 },
  erro: { arquivo: "erro.ogg", volume: 0.85 },
  licaoConcluida: { arquivo: "licao-concluida.ogg", volume: 0.9 },
  ofensiva: { arquivo: "ofensiva.ogg", volume: 0.8 },
  rupees: { arquivo: "rupees.ogg", volume: 0.9 },
  compra: { arquivo: "compra.ogg", volume: 1 },
  perdaDePena: { arquivo: "perda-de-pena.ogg", volume: 0.8 },
  conquista: { arquivo: "conquista.ogg", volume: 0.85 },
  nivel: { arquivo: "nivel.ogg", volume: 0.85 },
} as const;

export type Som = keyof typeof SONS;

/** O teto de tudo: os sons acompanham o app, não competem com a música de quem estuda ouvindo. */
const VOLUME_GERAL = 0.7;

let contexto: AudioContext | null = null;
const carregados = new Map<Som, Promise<AudioBuffer | null>>();

function abrirContexto(): AudioContext | null {
  if (contexto) return contexto;
  const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Contexto) return null;
  contexto = new Contexto();
  return contexto;
}

/**
 * O navegador só deixa tocar som depois que a pessoa encosta na tela. O
 * primeiro toque em qualquer lugar destrava o áudio, para que os sons que não
 * nascem de um toque (as rupees chegando, a chama acendendo) também toquem.
 */
if (typeof window !== "undefined") {
  const destravar = () => {
    void abrirContexto()?.resume().catch(() => {});
    window.removeEventListener("pointerdown", destravar, true);
    window.removeEventListener("keydown", destravar, true);
  };
  window.addEventListener("pointerdown", destravar, true);
  window.addEventListener("keydown", destravar, true);
}

function carregar(som: Som): Promise<AudioBuffer | null> {
  const ja = carregados.get(som);
  if (ja) return ja;
  const ctx = abrirContexto();
  const pedido = ctx
    ? fetch(`/sons/${SONS[som].arquivo}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((dados) => ctx.decodeAudioData(dados))
        // Um formato que o aparelho não sabe tocar fica em silêncio, sem erro.
        .catch(() => null)
    : Promise.resolve(null);
  carregados.set(som, pedido);
  return pedido;
}

/** Baixa os sons de uma tela antes da hora, para o primeiro não chegar atrasado. */
export function prepararSons(...sons: Som[]) {
  if (typeof window === "undefined" || !lerPreferencias().sons) return;
  for (const som of sons) void carregar(som);
}

export async function tocar(som: Som) {
  if (typeof window === "undefined" || !lerPreferencias().sons) return;
  const ctx = abrirContexto();
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  const buffer = await carregar(som);
  if (!buffer || ctx.state !== "running") return;
  const fonte = ctx.createBufferSource();
  fonte.buffer = buffer;
  const ganho = ctx.createGain();
  ganho.gain.value = SONS[som].volume * VOLUME_GERAL;
  fonte.connect(ganho).connect(ctx.destination);
  fonte.start();
}
