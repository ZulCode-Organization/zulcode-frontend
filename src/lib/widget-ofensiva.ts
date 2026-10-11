"use client";

import { pluginNativo } from "./plugin-nativo";

/**
 * O retrato que os widgets da tela inicial desenham.
 *
 * Os widgets rodam fora do app e não enxergam nem a sessão nem o localStorage,
 * por isso é o app que lhes entrega os números — sempre os mesmos que a barra
 * de cima acabou de mostrar — e as frases na língua da tela. O dia do último
 * estudo vai junto: com ele o celular vira o dia sozinho, sem o app aberto.
 * Fora do Android nada acontece.
 *
 * Os envios repetidos são descartados aqui. O perfil é recarregado várias
 * vezes por sessão (ao voltar da trilha, ao ganhar rupees), e reescrever o
 * mesmo retrato faria o Android redesenhar os widgets à toa.
 */
export interface RetratoDaOfensiva {
  dias: number;
  /** Estudou hoje. Os campos abaixo vieram depois: um APK antigo só lê estes três. */
  acesa: boolean;
  protegida: boolean;
  protecoes: number;
  /** aaaa-mm-dd no fuso do celular, ou vazio. */
  ultimoEstudo: string;
  diasProtegidos: string[];
  meta: number;
  minutosHoje: number;
  nome: string;
  /** widget.json, cru: quem preenche {dias} e {nome} é o celular. */
  textos: Record<string, unknown>;
}

export type TipoDeWidget = "ofensiva" | "semana" | "zul";
export type EstiloDosWidgets = "auto" | "claro" | "escuro" | "azul";

export interface EstadoDosWidgets {
  naTela: Record<TipoDeWidget, number>;
  estilo: EstiloDosWidgets;
  /** O lançador aceita que o app peça para pôr um widget na tela (Android 8+). */
  podeFixar: boolean;
}

interface PluginDoWidget {
  atualizar(dados: RetratoDaOfensiva): Promise<void>;
  limpar(): Promise<void>;
  estado(): Promise<EstadoDosWidgets>;
  previa(opcoes: { tipo: TipoDeWidget; largura: number; altura: number; estilo: "claro" | "escuro" | "azul" }): Promise<{ imagem: string }>;
  fixar(opcoes: { tipo: TipoDeWidget }): Promise<{ pedido: boolean }>;
  estilo(opcoes: { estilo: EstiloDosWidgets }): Promise<EstadoDosWidgets>;
}

let ultimoEnviado = "";

/** Disparado quando o retrato muda: as prévias das Configurações se redesenham. */
export const WIDGET_ATUALIZADO = "zulcode:widget";

/** Embrulhado em `{ plugin }`: ver plugin-nativo.ts. */
const plugin = () => pluginNativo<PluginDoWidget>("WidgetDaOfensiva");

export async function atualizarWidgetDaOfensiva(retrato: RetratoDaOfensiva) {
  const assinatura = JSON.stringify(retrato);
  if (assinatura === ultimoEnviado) return;

  const ponte = await plugin();
  if (!ponte) return;
  try {
    await ponte.plugin.atualizar(retrato);
    ultimoEnviado = assinatura;
    window.dispatchEvent(new Event(WIDGET_ATUALIZADO));
  } catch {
    // Um widget desatualizado não pode derrubar a barra de cima.
  }
}

/** Ao sair da conta: os widgets voltam a convidar para entrar. */
export async function limparWidgetDaOfensiva() {
  ultimoEnviado = "";
  const ponte = await plugin();
  if (!ponte) return;
  try {
    await ponte.plugin.limpar();
  } catch {
    // Idem.
  }
}

/**
 * O que as Configurações mostram. `null` fora do app e num APK anterior aos
 * widgets novos (que não tem estes métodos): aí a seção nem aparece.
 */
export async function estadoDosWidgets(): Promise<EstadoDosWidgets | null> {
  try {
    return (await (await plugin())?.plugin.estado()) ?? null;
  } catch {
    return null;
  }
}

/** O widget desenhado pelo próprio celular, com os dados de agora (PNG em data URL). */
export async function previaDoWidget(tipo: TipoDeWidget, largura: number, altura: number, estilo: "claro" | "escuro" | "azul") {
  try {
    return (await (await plugin())?.plugin.previa({ tipo, largura, altura, estilo }))?.imagem ?? null;
  } catch {
    return null;
  }
}

/** Pede ao lançador para pôr o widget na tela; a confirmação é dele. */
export async function fixarWidget(tipo: TipoDeWidget) {
  try {
    return (await (await plugin())?.plugin.fixar({ tipo }))?.pedido ?? false;
  } catch {
    return false;
  }
}

export async function mudarEstiloDosWidgets(estilo: EstiloDosWidgets) {
  try {
    return (await (await plugin())?.plugin.estilo({ estilo })) ?? null;
  } catch {
    return null;
  }
}
