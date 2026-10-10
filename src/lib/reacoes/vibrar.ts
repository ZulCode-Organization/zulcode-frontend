"use client";

import { lerPreferencias } from "@/lib/preferencias";

/**
 * A vibração do app.
 *
 * No aplicativo usa o motor do celular (plugin Haptics do Capacitor), que dá
 * toques curtos e precisos. No navegador do celular cai na vibração comum,
 * que é mais grosseira; no computador não faz nada.
 */
export type Vibracao = "toque" | "acerto" | "erro" | "impacto" | "comemoracao";

/** Durações em milissegundos para a vibração comum (vibra, pausa, vibra...). */
const PADROES: Record<Vibracao, number[]> = {
  toque: [8],
  acerto: [18],
  erro: [30, 60, 30],
  impacto: [40],
  comemoracao: [25, 70, 25, 70, 60],
};

export async function vibrar(tipo: Vibracao) {
  if (typeof window === "undefined" || !lerPreferencias().vibracao) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Haptics")) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (tipo === "toque") await Haptics.selectionChanged();
      else if (tipo === "acerto") await Haptics.notification({ type: NotificationType.Success });
      else if (tipo === "erro") await Haptics.notification({ type: NotificationType.Error });
      else if (tipo === "impacto") await Haptics.impact({ style: ImpactStyle.Heavy });
      else {
        // Comemoração: três batidas crescendo, como um rufar.
        await Haptics.impact({ style: ImpactStyle.Light });
        setTimeout(() => void Haptics.impact({ style: ImpactStyle.Medium }), 90);
        setTimeout(() => void Haptics.impact({ style: ImpactStyle.Heavy }), 180);
      }
      return;
    }
  } catch {
    // Sem o plugin (APK antigo): tenta a vibração comum.
  }
  navigator.vibrate?.(PADROES[tipo]);
}
