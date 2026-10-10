"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Faz as barras do Android (a da hora, em cima, e a de navegação, embaixo)
 * seguirem o tema do app.
 *
 * Há dois jeitos de o celular desenhar essas barras, e o app precisa dar
 * certo nos dois:
 *
 * - **O app vai até as bordas** (Android 15+ com a WebView atualizada, graças
 *   ao `viewport-fit=cover` do `layout.tsx`). As barras são transparentes e o
 *   que aparece atrás é o fundo da página; só falta a cor dos ícones. O
 *   Capacitor publica a altura das barras em `--safe-area-inset-top`, e é por
 *   ela ser maior que zero que se sabe que é este caso.
 * - **O Android desenha as barras** (celulares mais antigos, ou WebView
 *   desatualizada). Aí a cor delas também tem que vir daqui, pela ponte
 *   `CoresDasBarras`, que só existe no APK a partir desta versão.
 *
 * Num APK antigo, sem a ponte, e com as barras desenhadas pelo Android, os
 * ícones ficam como o sistema os deixou: mudar só a cor deles podia pôr um
 * relógio claro sobre uma faixa clara.
 *
 * A cor dos ícones vai antes da do fundo: o `SystemBars` repinta o fundo da
 * janela quando aplica um estilo, e na ordem contrária ele desfaria a cor.
 */
export function BarrasDoSistema() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    let cancelado = false;
    (async () => {
      try {
        const { Capacitor, SystemBars, SystemBarsStyle, registerPlugin } = await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "android") return;
        const escuro = resolvedTheme === "dark";
        const comCores = Capacitor.isPluginAvailable("CoresDasBarras");
        if (!comCores && !(await vaiAteAsBordas())) return;
        if (cancelado) return;

        await SystemBars.setStyle({ style: escuro ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
        if (comCores) {
          const cor = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
          await registerPlugin<{ pintar(dados: { cor: string; escuro: boolean }): Promise<void> }>("CoresDasBarras").pintar({ cor, escuro });
        }
      } catch {
        // Sem app por baixo, ou um app antigo sem as pontes: as barras ficam
        // como o Android as deixou. É acabamento, não pode quebrar a tela.
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [resolvedTheme]);

  return null;
}

/**
 * O Capacitor só publica a altura das barras depois que a página termina de
 * montar; espera um pouco antes de concluir que ela é zero.
 */
async function vaiAteAsBordas() {
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const topo = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top"));
    if (topo > 0) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}
