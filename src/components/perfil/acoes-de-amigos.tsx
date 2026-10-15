"use client";

import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, QrCode, Share2, UserPlus, X } from "lucide-react";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { AdicionarAmigos } from "./painel-social";
import { PerfilUsuario } from "@/lib/types/perfil";

/** Um modal simples: fundo escuro, cartão no centro, fecha pelo X ou clicando fora. */
function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);

  return (
    <div role="dialog" aria-modal aria-label={titulo} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onFechar}>
      <div className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[24px] border border-border bg-card p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-foreground">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-4.5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Copia o link do perfil e mostra "Copiado" por um instante. */
function CopiarLink({ endereco }: { endereco: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sem permissão de área de transferência, o endereço continua visível para copiar à mão.
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{endereco}</span>
      <button type="button" onClick={() => void copiar()} className="flex shrink-0 items-center gap-1.5 text-[0.78rem] font-black uppercase tracking-[0.04em] text-primary">
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
}

/**
 * Os botões logo abaixo dos contadores: "Adicionar amigos" abre a busca de
 * amigos e o convite com o link; o QR abre o cartão do perfil para ler com a
 * câmera ou compartilhar.
 */
export function AcoesDeAmigos({ perfil }: { perfil: PerfilUsuario }) {
  const [modal, setModal] = useState<"adicionar" | "qr" | null>(null);
  const endereco = typeof window === "undefined" ? "" : `${window.location.origin}/perfil/${perfil.id}`;

  return (
    <div className="mt-4 flex gap-2.5">
      <button
        type="button"
        onClick={() => setModal("adicionar")}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-border text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary transition-colors hover:bg-muted"
      >
        <UserPlus className="size-4.5" />
        Adicionar amigos
      </button>
      <button
        type="button"
        onClick={() => setModal("qr")}
        aria-label="Mostrar o QR code do perfil"
        className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-border text-primary transition-colors hover:bg-muted"
      >
        <QrCode className="size-5" />
      </button>

      {modal === "adicionar" && (
        <Modal titulo="Adicionar amigos" onFechar={() => setModal(null)}>
          <AdicionarAmigos />
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-sm font-bold text-muted-foreground">Ou mande o seu link</p>
            <CopiarLink endereco={endereco} />
          </div>
        </Modal>
      )}

      {modal === "qr" && <CartaoQr perfil={perfil} endereco={endereco} onFechar={() => setModal(null)} />}
    </div>
  );
}

/** O cartão do perfil com o QR: avatar, nome, o QR e a marca. Dá para compartilhar ou salvar. */
function CartaoQr({ perfil, endereco, onFechar }: { perfil: PerfilUsuario; endereco: string; onFechar: () => void }) {
  const [imagem, setImagem] = useState<string | null>(null);

  useEffect(() => {
    if (!endereco) return;
    let vivo = true;
    QRCode.toDataURL(endereco, { margin: 0, width: 360, color: { dark: "#0f1115", light: "#ffffff" } })
      .then((url) => vivo && setImagem(url))
      .catch(() => vivo && setImagem(null));
    return () => {
      vivo = false;
    };
  }, [endereco]);

  const compartilhar = async () => {
    try {
      if (navigator.share) await navigator.share({ title: perfil.nome, text: "Me siga no ZulCode", url: endereco });
      else await navigator.clipboard.writeText(endereco);
    } catch {
      // Quem fecha o compartilhar sem escolher nada não precisa de aviso.
    }
  };

  const salvar = () => {
    if (!imagem) return;
    const link = document.createElement("a");
    link.href = imagem;
    link.download = `zulcode-${perfil.publicCode ?? "perfil"}.png`;
    link.click();
  };

  return (
    <Modal titulo="Seu QR code" onFechar={onFechar}>
      <div className="mx-auto flex max-w-sm flex-col rounded-[22px] bg-white p-5 text-[#0f1115] shadow-lg">
        <div className="flex gap-4">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: perfil.bannerColor ?? "#22c55e" }}>
            <AvatarIcon id={perfil.avatarId} className="size-16" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate text-lg font-black">{perfil.nome}</p>
            {perfil.publicCode && <p className="text-sm font-bold text-[#5b6575]">#{perfil.publicCode}</p>}
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/mascot.png" alt="" className="size-9" />
            <span className="text-lg font-black tracking-tight">ZulCode</span>
          </div>
          <div className="grid size-36 place-items-center rounded-xl">
            {imagem ? <img src={imagem} alt="QR code do seu perfil" className="size-full" /> : <span className="text-sm text-[#5b6575]">Gerando…</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => void compartilhar()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground">
          <Share2 className="size-4.5" />
          Compartilhar
        </button>
        <button type="button" onClick={salvar} disabled={!imagem} className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary disabled:opacity-50">
          <Download className="size-4.5" />
          Salvar
        </button>
      </div>
    </Modal>
  );
}
