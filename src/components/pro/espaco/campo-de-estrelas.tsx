"use client";

import { useEffect, useRef } from "react";
import { movimentoReduzido, variacao } from "@/lib/motion/movimento";

/** Velocidade de cruzeiro e da dobra, em profundidades por segundo. */
const DERIVA = 0.035;
const DOBRA = 1.9;
/** O empurrão de cada troca de tela: a câmera anda um pouco e para. */
const IMPULSO = 0.55;

type Estrela = { x: number; y: number; z: number; cor: string; tamanho: number };

const CORES = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#e9d5ff", "#c4b5fd", "#a5f3fc"];

/**
 * O fundo de estrelas do PRO, em canvas.
 *
 * As estrelas vivem em três dimensões e vêm na direção da câmera. Parado, é
 * só uma deriva lenta; na dobra (a entrada no PRO e a volta do pagamento)
 * elas aceleram e viram riscos, porque cada uma é desenhada como a linha
 * entre onde estava no quadro anterior e onde está agora — o rastro sai da
 * própria velocidade, e não de um efeito pintado por cima.
 *
 * `pulso` é um contador: cada valor novo dá um empurrão curto, para que trocar
 * de tela pareça viajar um pouco pela galáxia.
 *
 * Com movimento reduzido, desenha um céu parado uma vez e não anima nada.
 */
export function CampoDeEstrelas({ dobra = false, pulso = 0 }: { dobra?: boolean; pulso?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alvo = useRef({ dobra, impulso: 0 });

  useEffect(() => {
    alvo.current.dobra = dobra;
  }, [dobra]);

  useEffect(() => {
    if (pulso > 0) alvo.current.impulso = IMPULSO;
  }, [pulso]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let largura = 0;
    let altura = 0;
    let estrelas: Estrela[] = [];

    const semear = () => {
      // A densidade acompanha a área: o mesmo céu no celular e num monitor
      // largo, em vez de um vazio no grande ou um borrão no pequeno.
      const total = Math.round(Math.min(420, Math.max(140, (largura * altura) / 4200)));
      estrelas = Array.from({ length: total }, (_, i) => ({
        x: variacao(i, 1) * 2 - 1,
        y: variacao(i, 2) * 2 - 1,
        z: 0.05 + variacao(i, 3) * 0.95,
        cor: CORES[Math.floor(variacao(i, 4) * CORES.length)],
        tamanho: variacao(i, 5) > 0.93 ? 1.9 : variacao(i, 6) > 0.55 ? 1.25 : 0.8,
      }));
    };

    const medir = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      semear();
    };

    const projetar = (e: Estrela, z: number) => {
      const foco = Math.max(largura, altura) * 0.5;
      return { x: largura / 2 + (e.x / z) * foco, y: altura * 0.42 + (e.y / z) * foco };
    };

    let velocidade = alvo.current.dobra ? DOBRA : DERIVA;

    const desenhar = (passo: number) => {
      ctx.clearRect(0, 0, largura, altura);
      const riscando = velocidade > 0.3;
      for (const e of estrelas) {
        const zAntes = e.z;
        e.z -= velocidade * passo;
        if (e.z <= 0.02) {
          // Renasce no fundo, sem risco: senão desenharia uma linha atravessando a tela.
          e.z = 1;
          continue;
        }
        const agora = projetar(e, e.z);
        if (agora.x < -40 || agora.x > largura + 40 || agora.y < -40 || agora.y > altura + 40) {
          e.z = 1;
          continue;
        }
        const brilho = Math.min(1, (1 - e.z) * 1.4 + 0.15);
        ctx.globalAlpha = brilho;
        if (riscando) {
          const antes = projetar(e, zAntes);
          ctx.strokeStyle = e.cor;
          ctx.lineWidth = e.tamanho * (1.2 - e.z * 0.6);
          ctx.beginPath();
          ctx.moveTo(antes.x, antes.y);
          ctx.lineTo(agora.x, agora.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = e.cor;
          const r = e.tamanho * (1.3 - e.z * 0.7);
          ctx.beginPath();
          ctx.arc(agora.x, agora.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    medir();
    const observador = new ResizeObserver(() => {
      medir();
      if (movimentoReduzido()) desenhar(0);
    });
    observador.observe(canvas);

    if (movimentoReduzido()) {
      desenhar(0);
      return () => observador.disconnect();
    }

    let quadro = 0;
    let ultimo = performance.now();
    const laco = (agora: number) => {
      // Aba escondida devolve um salto enorme no primeiro quadro de volta;
      // limitar o passo evita as estrelas pularem de uma vez.
      const passo = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      const meta = (alvo.current.dobra ? DOBRA : DERIVA) + alvo.current.impulso;
      // Acelera depressa e freia devagar: é o que faz parecer inércia.
      const fator = meta > velocidade ? 6 : 1.8;
      velocidade += (meta - velocidade) * Math.min(1, passo * fator);
      alvo.current.impulso *= Math.pow(0.04, passo);
      desenhar(passo);
      quadro = requestAnimationFrame(laco);
    };
    quadro = requestAnimationFrame(laco);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}
