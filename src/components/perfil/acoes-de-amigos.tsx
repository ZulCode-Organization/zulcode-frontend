"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, UserPlus, X } from "lucide-react";
import { AdicionarAmigos } from "./painel-social";
import { PerfilUsuario } from "@/lib/types/perfil";

/**
 * Os dois botões logo abaixo do cabeçalho: "Adicionar amigos" abre o painel
 * de busca de amigos ali mesmo, e o QR mostra o link do perfil para outra
 * pessoa ler com a câmera.
 */
export function AcoesDeAmigos({ perfil }: { perfil: PerfilUsuario }) {
  const [adicionando, setAdicionando] = useState(false);
  const [qr, setQr] = useState(false);
  const [imagem, setImagem] = useState<string | null>(null);
  const endereco = typeof window === "undefined" ? "" : `${window.location.origin}/perfil/${perfil.id}`;

  useEffect(() => {
    if (!qr || !endereco) return;
    let vivo = true;
    QRCode.toDataURL(endereco, { margin: 1, width: 240, color: { dark: "#0f1115", light: "#ffffff" } })
      .then((url) => vivo && setImagem(url))
      .catch(() => vivo && setImagem(null));
    return () => {
      vivo = false;
    };
  }, [qr, endereco]);

  return (
    <div className="mt-4">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setAdicionando((v) => !v)}
          aria-expanded={adicionando}
          className="zc-press flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/10 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          <UserPlus className="size-4.5" />
          Adicionar amigos
        </button>
        <button
          type="button"
          onClick={() => setQr(true)}
          aria-label="Mostrar o QR code do perfil"
          className="zc-press grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"
        >
          <QrCode className="size-5" />
        </button>
      </div>

      {adicionando && <div className="mt-3"><AdicionarAmigos /></div>}

      {qr && (
        <div role="dialog" aria-modal aria-label="QR code do perfil" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onClick={() => setQr(false)}>
          <div className="w-full max-w-xs rounded-[24px] bg-card p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-foreground">{perfil.nome}</p>
              <button type="button" onClick={() => setQr(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                <X className="size-4.5" />
              </button>
            </div>
            <div className="mx-auto mt-4 grid aspect-square w-full place-items-center rounded-2xl bg-white p-3">
              {imagem ? <img src={imagem} alt="QR code do seu perfil" className="size-full" /> : <span className="text-sm text-muted-foreground">Gerando…</span>}
            </div>
            <p className="mt-3 break-all text-xs text-muted-foreground">{endereco}</p>
          </div>
        </div>
      )}
    </div>
  );
}
