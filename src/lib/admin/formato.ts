/** Formatação dos números e datas do administrativo, sempre em pt-BR. */

export const numero = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("pt-BR") : "—");

/** 1.284 / 12,9 mil / 4,2 mi — para números grandes em blocos de destaque. */
export function compacto(n: number | null | undefined) {
  if (typeof n !== "number") return "—";
  const abs = Math.abs(n);
  if (abs < 10_000) return n.toLocaleString("pt-BR");
  if (abs < 1_000_000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
}

export const reais = (n: number | null | undefined) =>
  typeof n === "number" ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export const porcento = (n: number | null | undefined, casas = 1) =>
  typeof n === "number" ? `${n.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%` : "—";

const FUSO = "America/Sao_Paulo";

export function data(iso: string | Date | null | undefined, opcoes: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR", { timeZone: FUSO, ...opcoes }).replace(".", "");
}

export function dataHora(iso: string | Date | null | undefined) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
}

/** Um dia 'AAAA-MM-DD' (marcador, sem hora) como "09 out". */
export function dia(aaaammdd: string, opcoes?: Intl.DateTimeFormatOptions) {
  const d = new Date(`${aaaammdd}T12:00:00Z`);
  // O formato curto do pt-BR sai "10 de set."; no eixo de um gráfico, "10 set" cabe e lê igual.
  if (!opcoes) return `${String(d.getUTCDate()).padStart(2, "0")} ${d.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "short" }).replace(".", "")}`;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", ...opcoes }).replace(".", "");
}

/** "há 3 min", "há 2 dias", "agora". Para última atividade e registros. */
export function relativo(iso: string | Date | null | undefined) {
  if (!iso) return "nunca";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 0) {
    const f = -s;
    if (f < 3600) return `em ${Math.max(1, Math.round(f / 60))} min`;
    if (f < 86_400) return `em ${Math.round(f / 3600)} h`;
    return `em ${Math.round(f / 86_400)} dias`;
  }
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86_400) return `há ${Math.round(s / 3600)} h`;
  if (s < 30 * 86_400) return `há ${Math.round(s / 86_400)} dia${Math.round(s / 86_400) === 1 ? "" : "s"}`;
  return data(d);
}

/** A variação com sinal, para os blocos de destaque: "+12,5%" / "−3%". */
export function variacao(v: number | null | undefined) {
  if (typeof v !== "number") return null;
  const s = Math.abs(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return v > 0 ? `+${s}%` : v < 0 ? `−${s}%` : "0%";
}
