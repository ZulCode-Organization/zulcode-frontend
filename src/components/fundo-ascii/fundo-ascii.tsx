"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Os fundos em caracteres do ZulCode, desenhados num canvas:
 *
 * - "globo": o planeta da landing nascendo no pé da tela, com as linguagens
 *   acesas e ligadas. Gira sozinho, com o arraste e com a página.
 * - "ondas": três camadas de ondas de caracteres na metade de baixo.
 * - "grade": a tela coberta de caracteres; cada toque solta uma onda que se
 *   espalha e acende na cor da marca.
 *
 * Trocar o `modo` faz uma transição: um círculo se abre a partir de
 * `origemDaTroca` revelando o fundo novo enquanto o antigo some. As cores vêm
 * do tema (--primary, --foreground...), então funciona no claro e no escuro.
 * Para quem pediu menos movimento, desenha um quadro e fica parado.
 */
export type ModoDoFundo = "globo" | "ondas" | "grade";

export interface FundoAsciiControle {
  /** Uma onda que sai deste ponto (coordenadas da tela, como as do toque). */
  onda: (clientX: number, clientY: number, forca?: number) => void;
  /** Dá um empurrão no giro do planeta. */
  girar: (velocidade?: number) => void;
  /** Quanto o dedo está arrastando agora, em px. Vai direto para o desenho,
   *  sem passar pelo React: o fundo acompanha o dedo em todo quadro. */
  arrastar: (dx: number) => void;
}

interface FundoAsciiProps {
  modo: ModoDoFundo;
  /** A página atual de um passo a passo: o planeta roda e as ondas deslizam com ela. */
  pagina?: number;
  /** Quanto o dedo está arrastando agora, em px (o fundo acompanha). */
  arraste?: number;
  /** Arrastar na área em volta gira o planeta. */
  arrastavel?: boolean;
  /** De onde sai a transição entre os modos, em fração da área (0 a 1). */
  origemDaTroca?: { x: number; y: number };
  /** De onde sai a onda que pulsa sozinha na grade, em fração da área. */
  origemDoPulso?: { x: number; y: number };
  /** Onde fica a crista da primeira onda, em fração da altura (0 = topo).
   *  Ao mudar, as ondas sobem (ou descem) até lá devagar. */
  alturaDasOndas?: number;
  className?: string;
}

type Cor = [number, number, number];
type Toque = { x: number; y: number; t: number; f: number };

const RAMPA = " .,:;-=+*#%@";
const CODIGO = "01{}<>/;=()[]$";
const MARCOS: [string, number, number][] = [
  ["python", 0.62, 0.3],
  ["javascript", 0.18, 0.95],
  ["typescript", -0.38, 1.55],
  ["java", 0.42, 2.6],
  ["c#", -0.2, 3.5],
  ["go", 0.5, 4.6],
];
const QUADRO_MS = 40;
const DURACAO_DA_TROCA = 1.5;

function hash(x: number, y: number, z: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function suave(q: number) {
  return q * q * (3 - 2 * q);
}
function ruido(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = suave(x - xi), yf = suave(y - yi), zf = suave(z - zi);
  const l = (a: number, b: number, q: number) => a + (b - a) * q;
  const c = (a: number, b: number, d: number) => hash(xi + a, yi + b, zi + d);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf), l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
}

const MAPA_L = 128;
const MAPA_A = 64;
let mapaDoPlaneta: Float32Array | null = null;
function mapa() {
  if (mapaDoPlaneta) return mapaDoPlaneta;
  const m = new Float32Array(MAPA_L * MAPA_A);
  for (let j = 0; j < MAPA_A; j++) {
    const lat = (j / (MAPA_A - 1) - 0.5) * Math.PI;
    for (let i = 0; i < MAPA_L; i++) {
      const lon = (i / MAPA_L) * Math.PI * 2;
      const x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      let v = 0, amp = 0.55, fr = 1.6;
      for (let o = 0; o < 4; o++) {
        v += amp * ruido(x * fr + 11, y * fr + 7, z * fr + 3);
        amp *= 0.5;
        fr *= 2.1;
      }
      m[j * MAPA_L + i] = v;
    }
  }
  mapaDoPlaneta = m;
  return m;
}

function lerCor(css: CSSStyleDeclaration, nome: string, padrao: Cor): Cor {
  const valor = css.getPropertyValue(nome).trim();
  const hex = valor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = valor.match(/(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : padrao;
}
const rgba = ([r, g, b]: Cor, a: number) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

export const FundoAscii = forwardRef<FundoAsciiControle, FundoAsciiProps>(function FundoAscii(
  { modo, pagina = 0, arraste = 0, arrastavel = false, origemDaTroca = { x: 0.62, y: 0.92 }, origemDoPulso = { x: 0.16, y: 0.08 }, alturaDasOndas = 0.62, className },
  ref,
) {
  const tela = useRef<HTMLCanvasElement>(null);
  // O laço de desenho lê sempre o valor mais novo destas, sem recomeçar.
  const props = useRef({ modo, pagina, arraste, origemDaTroca, origemDoPulso, alturaDasOndas });
  useEffect(() => {
    props.current = { modo, pagina, arraste, origemDaTroca, origemDoPulso, alturaDasOndas };
  });
  const estado = useRef({
    // As ondas começam abaixo da tela e sobem até a altura pedida.
    alturaDasOndas: 1.1,
    /** O arraste que chega pelo controle (sem re-render). */
    arraste: 0,
    toques: [] as Toque[],
    rolaBase: 0,
    rolaExtra: 0,
    giro: 0.00022,
    desloca: 0,
    proximoPulso: 0,
    troca: { atual: modo as ModoDoFundo, anterior: null as ModoDoFundo | null, inicio: 0 },
    retangulo: { left: 0, top: 0 },
  });

  useImperativeHandle(ref, () => ({
    onda(clientX, clientY, forca = 1) {
      const r = estado.current.retangulo;
      const lista = estado.current.toques;
      lista.push({ x: clientX - r.left, y: clientY - r.top, t: performance.now() / 1000, f: forca });
      if (lista.length > 6) lista.shift();
    },
    girar(velocidade = 0.004) {
      estado.current.giro = velocidade;
    },
    arrastar(dx) {
      estado.current.arraste = dx;
    },
  }));

  useEffect(() => {
    const canvas = tela.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = estado.current;
    let arrastandoAgora = false;
    let ultimoX = 0;

    let largura = 0;
    let altura = 0;
    let L = 8;
    let A = 11;
    let cores = { marca: [24, 146, 255] as Cor, texto: [243, 246, 250] as Cor, apagado: [98, 112, 127] as Cor, fundo: [15, 17, 21] as Cor };
    const lerCores = () => {
      const css = getComputedStyle(canvas);
      cores = {
        marca: lerCor(css, "--primary", [24, 146, 255]),
        texto: lerCor(css, "--foreground", [243, 246, 250]),
        apagado: lerCor(css, "--muted-foreground", [98, 112, 127]),
        fundo: lerCor(css, "--background", [15, 17, 21]),
      };
    };
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Telas grandes usam células maiores: o mesmo desenho, menos caracteres.
      L = largura > 900 ? 11 : largura > 600 ? 9 : 8;
      A = Math.round(L * 1.375);
      const r = canvas.getBoundingClientRect();
      st.retangulo = { left: r.left, top: r.top };
    };
    lerCores();
    medir();

    const fonte = () => `600 ${A - 1}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    // ── Planeta ─────────────────────────────────────────────────────────
    const globo = (t: number, dt: number) => {
      const m = mapa();
      const R = Math.min(Math.max(largura * 0.78, 260), 460);
      const cx = largura / 2;
      const cy = altura + R * 0.2;
      st.rolaBase += dt * st.giro;
      const alvo = props.current.pagina * 0.9 - (props.current.arraste + estado.current.arraste) / R;
      st.rolaExtra += (alvo - st.rolaExtra) * 0.08;
      const rola = st.rolaBase + st.rolaExtra;
      const halo = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.32);
      halo.addColorStop(0, rgba(cores.marca, 0.18));
      halo.addColorStop(1, rgba(cores.marca, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, largura, altura);
      ctx.font = fonte();
      const ci = Math.cos(0.38), si = Math.sin(0.38), ca = Math.cos(0.4), sa = Math.sin(0.4);
      const cr = Math.cos(rola), sr = Math.sin(rola);
      const lento = Math.floor(t * 5);
      const linhas = Math.ceil(altura / A), colunas = Math.ceil(largura / L);
      for (let lin = 0; lin < linhas; lin++) {
        const py = (lin + 0.5) * A;
        const dy = (cy - py) / R;
        if (dy > 1) continue;
        for (let col = 0; col < colunas; col++) {
          const px = (col + 0.5) * L;
          const dx = (px - cx) / R;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          const dz = Math.sqrt(1 - d2);
          const rx = dx * cr + dy * sr, ry = -dx * sr + dy * cr;
          const y1 = ry * ci + dz * si, z1 = -ry * si + dz * ci;
          const wx = rx * ca - z1 * sa, wz = rx * sa + z1 * ca;
          const lat = Math.asin(Math.max(-1, Math.min(1, y1)));
          let u = (Math.atan2(wz, wx) / (Math.PI * 2)) % 1;
          if (u < 0) u += 1;
          const v = Math.min(0.9999, Math.max(0, lat / Math.PI + 0.5));
          const h = m[Math.floor(v * (MAPA_A - 1)) * MAPA_L + Math.floor(u * MAPA_L)];
          const luz = Math.max(0, dx * -0.45 + dy * 0.55 + dz * 0.7);
          const borda = Math.pow(1 - dz, 3);
          let valor: number, alfa: number, cor: Cor;
          if (h > 0.53) {
            valor = 0.45 + 0.4 * luz + Math.min(0.15, (h - 0.53) * 1.2);
            alfa = 0.35 + 0.65 * luz;
            cor = cores.marca;
          } else {
            valor = 0.2 + 0.32 * luz;
            alfa = 0.14 + 0.3 * luz + borda * 0.35;
            cor = cores.texto;
          }
          let letra = RAMPA[Math.min(11, Math.floor(valor * 12))];
          if (hash(col, lin, lento) > 0.985 && luz > 0.15) {
            letra = CODIGO[Math.floor(hash(lin, col, lento + 7) * CODIGO.length)];
            cor = cores.marca;
            alfa = 1;
          }
          if (letra === " ") continue;
          ctx.fillStyle = rgba(cor, alfa);
          ctx.fillText(letra, px, py);
        }
      }
      const pts = MARCOS.map(([nome, la, lo]) => {
        const x = Math.cos(la) * Math.cos(lo), y = Math.sin(la), z = Math.cos(la) * Math.sin(lo);
        const vx = x * ca + z * sa, vz1 = -x * sa + z * ca;
        const vy = y * ci - vz1 * si, vz = y * si + vz1 * ci;
        return { nome, x: cx + (vx * cr - vy * sr) * R, y: cy - (vx * sr + vy * cr) * R, z: vz };
      });
      ctx.lineWidth = 1.4;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        if (a.z < 0.05 || b.z < 0.05) continue;
        const fz = Math.min(1, Math.min(a.z, b.z) / 0.35);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const ol = Math.hypot(mx - cx, my - cy) || 1;
        const qx = mx + ((mx - cx) / ol) * R * 0.12, qy = my + ((my - cy) / ol) * R * 0.12;
        ctx.strokeStyle = rgba(cores.marca, 0.7 * fz);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(qx, qy, b.x, b.y);
        ctx.stroke();
        const g = (t * 0.45 + k * 0.23) % 1;
        ctx.fillStyle = rgba(cores.marca, fz);
        ctx.beginPath();
        ctx.arc((1 - g) * (1 - g) * a.x + 2 * (1 - g) * g * qx + g * g * b.x, (1 - g) * (1 - g) * a.y + 2 * (1 - g) * g * qy + g * g * b.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textAlign = "left";
      for (const p of pts) {
        if (p.z < 0.05 || p.y > altura) continue;
        const fz = Math.min(1, p.z / 0.35);
        const brilho = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
        brilho.addColorStop(0, rgba(cores.marca, 0.85 * fz));
        brilho.addColorStop(1, rgba(cores.marca, 0));
        ctx.fillStyle = brilho;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(cores.fundo, fz);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(cores.marca, fz);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        const lg = ctx.measureText(p.nome).width;
        ctx.fillStyle = rgba(cores.texto, 0.8 * fz);
        ctx.fillText(p.nome, p.x + 10 + lg > largura - 4 ? p.x - 10 - lg : p.x + 10, p.y - 10);
      }
      ctx.textAlign = "center";
    };

    // ── Ondas ───────────────────────────────────────────────────────────
    const ondas = (t: number) => {
      const alvo = props.current.pagina * 70 - (props.current.arraste + estado.current.arraste) * 0.5;
      st.desloca += (alvo - st.desloca) * 0.08;
      ctx.font = fonte();
      st.alturaDasOndas += (props.current.alturaDasOndas - st.alturaDasOndas) * 0.06;
      const topo = st.alturaDasOndas;
      const camadas = [
        { base: topo, amp: 28, f: 0.018, v: 0.5, cor: cores.apagado, a: 0.3, par: 0.3 },
        { base: topo + 0.13, amp: 24, f: 0.026, v: -0.7, cor: cores.marca, a: 0.42, par: 0.6 },
        { base: topo + 0.25, amp: 18, f: 0.034, v: 0.9, cor: cores.marca, a: 0.7, par: 1 },
      ];
      const linhas = Math.ceil(altura / A), colunas = Math.ceil(largura / L);
      const troca = Math.floor(t * 4);
      for (let col = 0; col < colunas; col++) {
        const x = (col + 0.5) * L;
        const sup = camadas.map((k) => {
          const xx = x + st.desloca * k.par;
          return altura * k.base + k.amp * Math.sin(xx * k.f + t * k.v) + k.amp * 0.5 * Math.sin(xx * k.f * 2.3 - t * k.v * 1.4);
        });
        const inicio = Math.max(0, Math.floor((Math.min(...sup) - A) / A));
        for (let lin = inicio; lin < linhas; lin++) {
          const y = (lin + 0.5) * A;
          let i = -1;
          for (let k = 2; k >= 0; k--) {
            if (y >= sup[k]) {
              i = k;
              break;
            }
          }
          if (i < 0) continue;
          const prof = y - sup[i];
          const k = camadas[i];
          let letra: string, alfa: number;
          if (prof < A) {
            letra = hash(col, lin, troca) > 0.5 ? "~" : "-";
            alfa = k.a + 0.25;
          } else {
            const val = Math.max(0.12, 0.62 - prof / 380 + 0.12 * ruido(col * 0.3, lin * 0.3, t * 0.6));
            letra = RAMPA[Math.min(11, Math.floor(val * 12))];
            alfa = k.a * (0.5 + val * 0.6);
          }
          if (letra === " ") continue;
          ctx.fillStyle = rgba(k.cor, alfa);
          ctx.fillText(letra, x, y);
        }
      }
    };

    // ── Grade ───────────────────────────────────────────────────────────
    const grade = (t: number) => {
      if (t > st.proximoPulso) {
        const o = props.current.origemDoPulso;
        st.toques.push({ x: largura * o.x, y: altura * o.y, t, f: 0.6 });
        st.proximoPulso = t + 4.5;
      }
      st.toques = st.toques.filter((q) => t - q.t < 3);
      ctx.font = fonte();
      const linhas = Math.ceil(altura / A), colunas = Math.ceil(largura / L);
      for (let lin = 0; lin < linhas; lin++) {
        const py = (lin + 0.5) * A;
        for (let col = 0; col < colunas; col++) {
          const px = (col + 0.5) * L;
          let v = 0.06 + 0.06 * Math.sin(px * 0.03 + py * 0.02 + t * 0.8);
          for (const q of st.toques) {
            const idade = t - q.t;
            const w = Math.hypot(px - q.x, py - q.y) - idade * 260;
            v += Math.exp(-(w * w) / 900) * (1 - idade / 3) * q.f;
          }
          const letra = RAMPA[Math.max(1, Math.min(11, Math.floor(v * 11)))];
          ctx.fillStyle = v > 0.3 ? rgba(cores.marca, 0.2 + v * 0.7) : rgba(cores.apagado, 0.12 + v);
          ctx.fillText(letra, px, py);
        }
      }
    };

    const desenharModo = (qual: ModoDoFundo, t: number, dt: number) => {
      if (qual === "globo") globo(t, dt);
      else if (qual === "ondas") ondas(t);
      else grade(t);
    };

    let antes = performance.now();
    let quadro = 0;
    let visivel = document.visibilityState === "visible";
    const desenhar = (agora: number) => {
      const t = agora / 1000;
      const dt = Math.min(100, agora - antes);
      antes = agora;
      if (!arrastandoAgora) st.giro += (0.00022 - st.giro) * 0.03;
      ctx.clearRect(0, 0, largura, altura);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const troca = st.troca;
      const alvo = props.current.modo;
      if (alvo !== troca.atual) {
        troca.anterior = troca.atual;
        troca.atual = alvo;
        troca.inicio = t;
        const o = props.current.origemDaTroca;
        st.toques.push({ x: largura * o.x, y: altura * o.y, t, f: 1.3 });
      }
      const k = troca.anterior ? Math.min(1, (t - troca.inicio) / DURACAO_DA_TROCA) : 1;
      if (k >= 1 || parado) {
        troca.anterior = null;
        desenharModo(troca.atual, t, dt);
        return;
      }
      // A troca: o fundo antigo some, e um círculo saindo da origem revela o novo.
      const e = 1 - Math.pow(1 - k, 3);
      const o = props.current.origemDaTroca;
      const ox = largura * o.x, oy = altura * o.y;
      const raio = 8 + e * Math.hypot(largura, altura) * 1.05;
      ctx.save();
      ctx.globalAlpha = 1 - e;
      desenharModo(troca.anterior!, t, dt);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox, oy, raio, 0, Math.PI * 2);
      ctx.clip();
      ctx.clearRect(0, 0, largura, altura);
      ctx.fillStyle = rgba(cores.fundo, 0.6 * (1 - e));
      ctx.fillRect(0, 0, largura, altura);
      desenharModo(troca.atual, t, dt);
      ctx.restore();
      ctx.strokeStyle = rgba(cores.marca, 0.6 * (1 - e));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, raio, 0, Math.PI * 2);
      ctx.stroke();
    };
    const passo = (agora: number) => {
      quadro = requestAnimationFrame(passo);
      if (agora - antes < QUADRO_MS) return;
      desenhar(agora);
    };

    desenhar(performance.now());
    if (!parado && visivel) quadro = requestAnimationFrame(passo);

    const aoMudarVisibilidade = () => {
      const agora = document.visibilityState === "visible";
      if (agora === visivel) return;
      visivel = agora;
      cancelAnimationFrame(quadro);
      if (visivel && !parado) {
        antes = performance.now();
        quadro = requestAnimationFrame(passo);
      }
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    const aoRedimensionar = new ResizeObserver(() => {
      medir();
      desenhar(performance.now());
    });
    aoRedimensionar.observe(canvas);
    const aoRolar = () => {
      const r = canvas.getBoundingClientRect();
      st.retangulo = { left: r.left, top: r.top };
    };
    window.addEventListener("scroll", aoRolar, { passive: true });

    // O tema troca as variáveis de cor no <html>: relê na troca.
    const aoTrocarTema = new MutationObserver(() => lerCores());
    aoTrocarTema.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    // Arrastar em volta gira o planeta, como uma esteira.
    const area = canvas.parentElement;
    const apertar = (e: PointerEvent) => {
      arrastandoAgora = true;
      ultimoX = e.clientX;
    };
    const mover = (e: PointerEvent) => {
      if (!arrastandoAgora) return;
      const dx = e.clientX - ultimoX;
      ultimoX = e.clientX;
      st.rolaBase -= dx / 300;
      st.giro = -dx * 0.0004;
    };
    const soltar = () => {
      arrastandoAgora = false;
    };
    if (arrastavel && area && !parado) {
      area.addEventListener("pointerdown", apertar);
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
      window.addEventListener("pointercancel", soltar);
    }

    return () => {
      cancelAnimationFrame(quadro);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("scroll", aoRolar);
      aoRedimensionar.disconnect();
      aoTrocarTema.disconnect();
      if (area) area.removeEventListener("pointerdown", apertar);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, [arrastavel]);

  return <canvas ref={tela} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} />;
});
