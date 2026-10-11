"use client";

import { pluginNativo } from "./plugin-nativo";
import { diaLocal } from "./sequencia";

/**
 * Os avisos do app no Android: permissão, lembrete de estudo e o toque que
 * abre o app numa tela.
 *
 * Quem desenha e agenda é o lado nativo (android/.../avisos). Aqui só se fala
 * com ele. Fora do app (navegador) e num APK antigo, sem esta ponte, tudo
 * devolve `null` e a tela explica o que falta.
 */

export interface EstadoDosAvisos {
  /** As notificações do app estão liberadas no celular. */
  ativas: boolean;
  /** "granted", "denied" ou "prompt" (Android 13+ ainda não perguntou). */
  permissao: string;
  /** O Firebase está no APK: só aí dá para receber avisos do servidor. */
  firebase: boolean;
  lembrete: { ativo: boolean; hora: number; minuto: number };
}

/** Os textos do lembrete na língua da pessoa, com {dias}, {diasTexto} e {nome} para o celular preencher. */
export interface TextosDosAvisos {
  canais: { lembretes: string; novidades: string };
  acoes: { estudar: string; depois: string };
  rotuloDia: string;
  rotuloDias: string;
  /** Para o celular escrever "1 dia" / "12 dias" no lugar de {diasTexto}. */
  unidade: { um: string; varios: string };
  lembrete: { titulo: string; texto: string }[];
  comecar: { titulo: string; texto: string }[];
  risco: { titulo: string; texto: string }[];
}

interface PluginDosAvisos {
  estado(): Promise<EstadoDosAvisos>;
  pedirPermissao(): Promise<EstadoDosAvisos>;
  configurar(opcoes: { ativo?: boolean; hora?: number; minuto?: number; textos?: TextosDosAvisos }): Promise<EstadoDosAvisos>;
  progresso(dados: { dias: number; ultimoEstudo: string; nome: string }): Promise<void>;
  exemplo(): Promise<void>;
  abrirConfiguracoes(): Promise<void>;
  limpar(): Promise<void>;
  addListener(evento: "avisoTocado", ouvir: (dados: { rota: string }) => void): Promise<{ remove: () => Promise<void> }>;
}

/** Embrulhado em `{ plugin }`: ver plugin-nativo.ts. */
const plugin = () => pluginNativo<PluginDosAvisos>("AvisosDoZul");

/** O plugin existe? Falso no navegador e num APK antigo. */
export async function avisosDisponiveis() {
  return (await plugin()) !== null;
}

export async function estadoDosAvisos() {
  return (await plugin())?.plugin.estado() ?? null;
}

export async function pedirPermissaoDeAvisos() {
  return (await plugin())?.plugin.pedirPermissao() ?? null;
}

export async function configurarLembrete(opcoes: { ativo?: boolean; hora?: number; minuto?: number; textos?: TextosDosAvisos }) {
  return (await plugin())?.plugin.configurar(opcoes) ?? null;
}

export async function mostrarExemploDeAviso() {
  await (await plugin())?.plugin.exemplo();
}

/** Abre as configurações de notificação do ZulCode no Android. */
export async function abrirConfiguracoesDeAvisos() {
  await (await plugin())?.plugin.abrirConfiguracoes();
}

export async function limparAvisos() {
  await (await plugin())?.plugin.limpar();
}

let ultimoProgresso = "";

/**
 * Conta ao celular a ofensiva e o último dia de estudo, para o lembrete das
 * 19h saber se fica quieto e mostrar o número certo. Repetições iguais não
 * saem (o perfil recarrega várias vezes por sessão).
 */
export async function informarProgresso(dados: { dias: number; ultimaAtividade: string | null | undefined; nome: string }) {
  const ultimoEstudo = dados.ultimaAtividade ? diaLocal(new Date(dados.ultimaAtividade)) : "";
  const assinatura = `${dados.dias}|${ultimoEstudo}|${dados.nome}`;
  if (assinatura === ultimoProgresso) return;
  ultimoProgresso = assinatura;
  await (await plugin())?.plugin.progresso({ dias: dados.dias, ultimoEstudo, nome: dados.nome });
}

/** Ouve o toque numa notificação; devolve a função que para de ouvir. */
export async function aoTocarNumAviso(ir: (rota: string) => void): Promise<() => void> {
  const p = await plugin();
  if (!p) return () => {};
  const ouvinte = await p.plugin.addListener("avisoTocado", ({ rota }) => {
    // Só rotas do próprio app: um aviso nunca leva para fora dele.
    if (typeof rota === "string" && rota.startsWith("/") && !rota.startsWith("//")) ir(rota);
  });
  return () => void ouvinte.remove();
}
