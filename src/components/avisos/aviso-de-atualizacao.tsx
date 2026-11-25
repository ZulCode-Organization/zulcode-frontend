"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type VersaoAvisada = { versionCode: number; versionName: string; mensagem: string; obrigatoria: boolean; ligado: boolean };

const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.zul.code";
const ADIADO = "zc-atualizacao-adiada";
/** "Depois" esconde a barra por um dia; no dia seguinte ela volta, até a pessoa atualizar. */
const UM_DIA = 86_400_000;
const DURACAO_MS = 320;

/** O texto da barra: o do admin, ou o padrão. A prévia do admin usa o mesmo. */
export function textoDaAtualizacao(v: Pick<VersaoAvisada, "mensagem" | "versionName">) {
  if (v.mensagem.trim()) return v.mensagem.trim();
  return `A versão ${v.versionName.trim() || "nova"} do ZulCode já está na Play Store, com novidades e correções.`;
}

/** Uma vez por abertura do app: trocar de tela remonta o AppShell, e a barra não pode voltar a cada tela. */
let jaConferiu = false;

function adiadaAte(versionCode: number) {
  try {
    const salvo = JSON.parse(localStorage.getItem(ADIADO) ?? "null") as { versionCode: number; ate: number } | null;
    return salvo && salvo.versionCode === versionCode ? salvo.ate : 0;
  } catch {
    return 0;
  }
}

const CONTADA = "zc-versao-contada";

/**
 * Conta para o servidor qual versão do app está instalada: é o que alimenta o
 * "Quem está em cada versão" do administrativo. Uma vez por dia por conta (e
 * logo que a versão muda), sem esperar e sem tratar falha.
 */
function contarVersao(versionCode: number, versionName: string) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token || !versionCode) return;
    const dono = token.slice(-24);
    const salvo = JSON.parse(localStorage.getItem(CONTADA) ?? "null") as { dono: string; versionCode: number; em: number } | null;
    if (salvo && salvo.dono === dono && salvo.versionCode === versionCode && Date.now() - salvo.em < UM_DIA) return;
    void fetchComTimeout(`${API_BASE_URL}/user/app-versao`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ versionCode, versionName: versionName.slice(0, 20) }),
    })
      .then((res) => {
        if (res.ok) localStorage.setItem(CONTADA, JSON.stringify({ dono, versionCode, em: Date.now() }));
      })
      .catch(() => undefined);
  } catch {
    // Sem armazenamento: conta de novo na próxima abertura.
  }
}

/**
 * A barra de "atualização disponível". Desce do topo, no mesmo estilo da
 * folha do "…" (que sobe de baixo), quando o admin avisou uma versão nova na
 * Play Store e a instalada é mais antiga. Só no app Android: no navegador o
 * site já é sempre o mais novo.
 */
export function AvisoDeAtualizacao() {
  const [versao, setVersao] = useState<VersaoAvisada | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (jaConferiu) return;
    jaConferiu = true;
    let vivo = true;
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "android") return;
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        const instalada = Number(info.build) || 0;
        contarVersao(instalada, info.version);
        const resposta = await fetchComTimeout(`${API_BASE_URL}/app/versao`);
        if (!resposta.ok) return;
        const v = (await resposta.json()) as VersaoAvisada;
        if (!v.ligado || !(v.versionCode > instalada)) return;
        if (!v.obrigatoria && adiadaAte(v.versionCode) > Date.now()) return;
        if (!vivo) return;
        setVersao(v);
        // Monta fora da tela e desliza no quadro seguinte, para a transição acontecer.
        requestAnimationFrame(() => requestAnimationFrame(() => vivo && setVisivel(true)));
      } catch {
        // Sem rede ou plugin antigo: sem barra, o app segue normal.
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (!versao || typeof document === "undefined") return null;

  const fechar = () => {
    setVisivel(false);
    window.setTimeout(() => setVersao(null), DURACAO_MS);
  };
  const depois = () => {
    try {
      localStorage.setItem(ADIADO, JSON.stringify({ versionCode: versao.versionCode, ate: Date.now() + UM_DIA }));
    } catch {
      // Sem armazenamento: a barra volta na próxima abertura.
    }
    fechar();
  };
  const atualizar = () => {
    // Fora do domínio do app, o Android abre o link no app da Play Store.
    window.location.href = PLAY_STORE;
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity"
        style={{ transitionDuration: `${DURACAO_MS}ms`, opacity: visivel ? 1 : 0 }}
        onClick={versao.obrigatoria ? undefined : depois}
        role="presentation"
      />
      <div
        className="fixed inset-x-0 top-0 z-[61] rounded-b-[24px] border-b border-border bg-card px-5 pb-3 shadow-xl transition-transform ease-out"
        style={{
          paddingTop: "max(1.25rem, env(safe-area-inset-top))",
          transitionDuration: `${DURACAO_MS}ms`,
          transform: visivel ? "translateY(0)" : "translateY(-100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-da-atualizacao"
      >
        <div className="mx-auto flex max-w-xl items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/12 text-primary">
            <Download className="size-5.5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p id="titulo-da-atualizacao" className="text-base font-black">Atualização disponível</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{textoDaAtualizacao(versao)}</p>
          </div>
        </div>
        <div className="mx-auto mt-4 flex max-w-xl gap-2">
          <button
            type="button"
            onClick={atualizar}
            className="zc-press flex-1 rounded-2xl bg-primary py-3 text-sm font-black uppercase tracking-[0.04em] text-primary-foreground"
          >
            Atualizar agora
          </button>
          {!versao.obrigatoria && (
            <button type="button" onClick={depois} className="rounded-2xl px-4 py-3 text-sm font-extrabold text-muted-foreground hover:bg-muted">
              Depois
            </button>
          )}
        </div>
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
      </div>
    </>,
    document.body,
  );
}
