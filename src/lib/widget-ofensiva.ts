"use client";

/**
 * O retrato que o widget da tela inicial desenha.
 *
 * O widget roda fora do app e não enxerga nem a sessão nem o localStorage, por
 * isso é o app que lhe entrega os números — sempre os mesmos que a barra de
 * cima acabou de mostrar. Fora do Android nada acontece: no navegador o plugin
 * não existe, e tentar usá-lo só geraria ruído no console.
 *
 * Os envios repetidos são descartados aqui. O perfil é recarregado várias
 * vezes por sessão (ao voltar da trilha, ao ganhar rupees), e reescrever o
 * mesmo retrato faria o Android redesenhar o widget à toa.
 */
export interface RetratoDaOfensiva {
  dias: number;
  acesa: boolean;
  protegida: boolean;
}

interface PluginDoWidget {
  atualizar(dados: RetratoDaOfensiva): Promise<void>;
  limpar(): Promise<void>;
}

let ultimoEnviado = "";

async function plugin(): Promise<PluginDoWidget | null> {
  try {
    const { Capacitor, registerPlugin } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") return null;
    return registerPlugin<PluginDoWidget>("WidgetDaOfensiva");
  } catch {
    return null;
  }
}

export async function atualizarWidgetDaOfensiva(retrato: RetratoDaOfensiva) {
  const assinatura = `${retrato.dias}|${retrato.acesa}|${retrato.protegida}`;
  if (assinatura === ultimoEnviado) return;

  const ponte = await plugin();
  if (!ponte) return;
  try {
    await ponte.atualizar(retrato);
    ultimoEnviado = assinatura;
  } catch {
    // Um widget desatualizado não pode derrubar a barra de cima.
  }
}

/** Ao sair da conta: o widget volta a convidar para entrar. */
export async function limparWidgetDaOfensiva() {
  ultimoEnviado = "";
  const ponte = await plugin();
  if (!ponte) return;
  try {
    await ponte.limpar();
  } catch {
    // Idem.
  }
}
