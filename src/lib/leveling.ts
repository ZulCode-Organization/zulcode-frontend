/**
 * Espelha `zulcode-backend/src/users/leveling.ts` — a API já manda `nivel`,
 * `nivelLabel` e `xpProximoNivel` prontos em GET/PUT /user, mas não manda o
 * "início" do nível atual, então pra desenhar a barra de progresso *dentro*
 * do nível (quanto já andou vs. quanto falta) a gente recalcula aqui em
 * cima do mesmo XP. Se a curva mudar no backend, precisa espelhar aqui também.
 */
const NIVEL_THRESHOLDS = [0, 300, 700, 1200, 1800, 2600, 3600, 4800, 6200, 8000] as const;

export interface ProgressoNivel {
  /** XP já acumulado dentro do nível atual (zera a cada level up). */
  xpNivelAtual: number;
  /** XP total necessário pra completar o nível atual; null no nível máximo. */
  xpNecessarioNivel: number | null;
  /** 0–100, já limitado pro caso de nível máximo. */
  percentual: number;
}

export function calcularProgressoNivel(xp: number, nivel: number): ProgressoNivel {
  const inicioNivel = NIVEL_THRESHOLDS[nivel - 1] ?? 0;
  const inicioProximoNivel = NIVEL_THRESHOLDS[nivel] as number | undefined;

  if (inicioProximoNivel === undefined) {
    return { xpNivelAtual: xp - inicioNivel, xpNecessarioNivel: null, percentual: 100 };
  }

  const xpNivelAtual = xp - inicioNivel;
  const xpNecessarioNivel = inicioProximoNivel - inicioNivel;
  const percentual = Math.min(100, Math.round((xpNivelAtual / xpNecessarioNivel) * 100));

  return { xpNivelAtual, xpNecessarioNivel, percentual };
}
