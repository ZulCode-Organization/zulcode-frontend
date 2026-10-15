"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { siFacebook, siInstagram, siWhatsapp, siX } from "simple-icons";
import { Check, Download, Link2, MoreHorizontal, QrCode, UserPlus, X } from "lucide-react";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { movimentoReduzido } from "@/lib/motion/movimento";
import { cn } from "@/lib/utils";
import { BuscaDeAmigos } from "./painel-social";
import { PerfilUsuario } from "@/lib/types/perfil";

/** O botão com relevo da referência: borda cinza e a de baixo mais grossa, que afunda ao tocar. */
const BOTAO_RELEVO =
  "flex h-12 items-center justify-center rounded-[12px] border-2 border-b-4 border-border bg-transparent transition-[transform,border-width] duration-75 hover:bg-muted/40 active:translate-y-[2px] active:border-b-2";

/** Um modal simples: fundo escuro, cartão no centro, fecha pelo X, pelo Esc ou clicando fora. */
function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);

  // Vai direto para o body: o cabeçalho do perfil tem animação com transform, e
  // dentro dele o "fixed" ficaria preso ao cabeçalho em vez da tela.
  return createPortal(
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
    </div>,
    document.body,
  );
}

/** Uma linha de opção no modal de amigos, como "Link do seu perfil" no Duolingo. */
function OpcaoDeAmigos({ icone, titulo, onClick, children }: { icone: ReactNode; titulo: string; onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(BOTAO_RELEVO, "h-auto justify-start gap-3 px-4 py-3.5 text-left")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icone}</span>
      <span className="min-w-0 flex-1 font-black text-foreground">{titulo}</span>
      {children}
    </button>
  );
}

/**
 * Os botões logo abaixo dos contadores: "Adicionar amigos" abre a busca de
 * amigos, e o QR abre o cartão do perfil para ler com a câmera ou compartilhar.
 */
export function AcoesDeAmigos({ perfil }: { perfil: PerfilUsuario }) {
  const [modal, setModal] = useState<"adicionar" | "qr" | null>(null);
  const [copiado, setCopiado] = useState(false);
  const fechar = useCallback(() => setModal(null), []);
  const endereco = typeof window === "undefined" ? "" : `${window.location.origin}/perfil/${perfil.id}`;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sem permissão de área de transferência, o QR continua sendo o caminho.
    }
  };

  return (
    <div className="mt-4 flex gap-3">
      <button type="button" onClick={() => setModal("adicionar")} className={cn(BOTAO_RELEVO, "flex-1 gap-2.5 text-[0.85rem] font-black uppercase tracking-[0.05em] text-foreground")}>
        <UserPlus className="size-5" strokeWidth={2.8} />
        Adicionar amigos
      </button>
      <button type="button" onClick={() => setModal("qr")} aria-label="Mostrar o QR code do perfil" className={cn(BOTAO_RELEVO, "w-14 text-primary")}>
        <QrCode className="size-6" strokeWidth={2.4} />
      </button>

      {modal === "adicionar" && (
        <Modal titulo="Encontre os seus amigos" onFechar={fechar}>
          <BuscaDeAmigos />
          <div className="mt-5 flex flex-col gap-2.5">
            <OpcaoDeAmigos icone={<Link2 className="size-5" />} titulo="Copiar o link do seu perfil" onClick={() => void copiarLink()}>
              {copiado && (
                <span className="flex items-center gap-1 text-[0.75rem] font-black text-emerald-500">
                  <Check className="size-3.5" />
                  Copiado
                </span>
              )}
            </OpcaoDeAmigos>
            <OpcaoDeAmigos icone={<QrCode className="size-5" />} titulo="Mostrar o seu QR code" onClick={() => setModal("qr")} />
          </div>
        </Modal>
      )}
      {modal === "qr" && <CartaoQr perfil={perfil} endereco={endereco} onFechar={fechar} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* O cartão do QR                                                      */
/* ------------------------------------------------------------------ */

function carregarImagem(origem: string) {
  return new Promise<HTMLImageElement>((pronto, falhou) => {
    const imagem = new Image();
    imagem.onload = () => pronto(imagem);
    imagem.onerror = falhou;
    imagem.src = origem;
  });
}

/** O QR com o ícone do ZulCode no meio. A correção de erro alta deixa o centro coberto e o código ainda lê. */
async function gerarQrComIcone(endereco: string) {
  const tela = document.createElement("canvas");
  await QRCode.toCanvas(tela, endereco, { errorCorrectionLevel: "H", margin: 0, width: 480, color: { dark: "#0f1115", light: "#ffffff" } });
  const c = tela.getContext("2d")!;
  const lado = tela.width * 0.24;
  const inicio = (tela.width - lado) / 2;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.roundRect(inicio - 10, inicio - 10, lado + 20, lado + 20, 22);
  c.fill();
  try {
    c.drawImage(await carregarImagem("/icon-only.svg"), inicio, inicio, lado, lado);
  } catch {
    // Sem o ícone o QR continua valendo.
  }
  return tela.toDataURL("image/png");
}

/** O cartão inteiro em imagem (1080×1350), para salvar ou postar. O avatar é copiado do próprio cartão na tela. */
async function gerarImagemDoCartao(dados: { perfil: PerfilUsuario; qr: string; avatar: HTMLElement | null }) {
  const tela = document.createElement("canvas");
  tela.width = 1080;
  tela.height = 1350;
  const c = tela.getContext("2d")!;
  const fonte = getComputedStyle(document.body).fontFamily || "sans-serif";

  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, tela.width, tela.height);
  c.fillStyle = dados.perfil.bannerColor ?? "#22c55e";
  c.beginPath();
  c.roundRect(60, 60, 960, 820, 56);
  c.fill();

  const desenho = dados.avatar?.querySelector("svg, img");
  try {
    if (desenho instanceof HTMLImageElement) {
      c.drawImage(await carregarImagem(desenho.currentSrc || desenho.src), 330, 260, 420, 420);
    } else if (desenho instanceof SVGElement) {
      const copia = desenho.cloneNode(true) as SVGElement;
      copia.setAttribute("width", "420");
      copia.setAttribute("height", "420");
      copia.setAttribute("color", "#ffffff");
      const svg = new XMLSerializer().serializeToString(copia);
      c.drawImage(await carregarImagem(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`), 330, 260, 420, 420);
    }
  } catch {
    // Sem o avatar o cartão continua valendo.
  }

  c.fillStyle = "#0f1115";
  c.font = `900 76px ${fonte}`;
  c.fillText(dados.perfil.nome.trim().split(/\s+/)[0] ?? "", 70, 1000);
  if (dados.perfil.publicCode) {
    c.fillStyle = "#6b7280";
    c.font = `700 40px ${fonte}`;
    c.fillText(`#${dados.perfil.publicCode}`, 70, 1060);
  }
  c.fillStyle = "#1892ff";
  c.font = `900 70px ${fonte}`;
  c.fillText("ZulCode", 70, 1240);
  c.drawImage(await carregarImagem(dados.qr), 740, 940, 280, 280);

  return new Promise<Blob>((pronto, falhou) => tela.toBlob((blob) => (blob ? pronto(blob) : falhou(new Error("imagem"))), "image/png"));
}

function emBase64(blob: Blob) {
  return new Promise<string>((pronto, falhou) => {
    const leitor = new FileReader();
    leitor.onload = () => pronto(String(leitor.result).split(",")[1] ?? "");
    leitor.onerror = falhou;
    leitor.readAsDataURL(blob);
  });
}

/**
 * Abre o compartilhar do sistema com a imagem do cartão. No app Android vai
 * pelos plugins Share e Filesystem; no navegador, pelo compartilhar dele; sem
 * nenhum dos dois, a imagem é baixada. Devolve false quando só deu para baixar.
 */
async function compartilharCartao(imagem: Blob, texto: string, endereco: string) {
  const nome = "zulcode-perfil.png";
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Share") && Capacitor.isPluginAvailable("Filesystem")) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const arquivo = await Filesystem.writeFile({ path: nome, data: await emBase64(imagem), directory: Directory.Cache });
    await Share.share({ title: "Meu perfil no ZulCode", text: `${texto} ${endereco}`, files: [arquivo.uri] });
    return true;
  }
  const arquivo = new File([imagem], nome, { type: "image/png" });
  if (navigator.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], text: `${texto} ${endereco}` });
    return true;
  }
  baixar(imagem, nome);
  return false;
}

function baixar(imagem: Blob, nome: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(imagem);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

function IconeDaMarca({ caminho }: { caminho: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-7">
      <path d={caminho} fill="#ffffff" />
    </svg>
  );
}

type OpcaoDeCompartilhar = "instagram" | "x" | "whatsapp" | "facebook" | "copiar" | "salvar" | "mais";

/** Os botões da folha de compartilhar, na ordem da referência. */
const OPCOES: { id: OpcaoDeCompartilhar; rotulo: string; fundo: string; icone: ReactNode }[] = [
  {
    id: "instagram",
    rotulo: "Instagram",
    fundo: "bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]",
    icone: <IconeDaMarca caminho={siInstagram.path} />,
  },
  { id: "x", rotulo: "X", fundo: "bg-black", icone: <IconeDaMarca caminho={siX.path} /> },
  { id: "whatsapp", rotulo: "WhatsApp", fundo: "bg-[#25D366]", icone: <IconeDaMarca caminho={siWhatsapp.path} /> },
  { id: "facebook", rotulo: "Facebook", fundo: "bg-[#0866FF]", icone: <IconeDaMarca caminho={siFacebook.path} /> },
  { id: "copiar", rotulo: "Copiar link", fundo: "bg-muted", icone: <Link2 className="size-6 text-foreground" /> },
  { id: "salvar", rotulo: "Salvar", fundo: "bg-muted", icone: <Download className="size-6 text-foreground" /> },
  { id: "mais", rotulo: "Mais", fundo: "bg-muted", icone: <MoreHorizontal className="size-6 text-foreground" /> },
];

/**
 * O cartão do perfil com o QR, como no Duolingo: o avatar grande sobre a cor
 * da capa, o nome, a marca e o QR com o ícone do ZulCode no meio. Entra com
 * uma animação suave (o fundo escurece, o cartão cresce, a folha de
 * compartilhar sobe) e sai do mesmo jeito.
 */
function CartaoQr({ perfil, endereco, onFechar }: { perfil: PerfilUsuario; endereco: string; onFechar: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const fundoRef = useRef<HTMLDivElement>(null);
  const cartaoRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const saindo = useRef(false);
  const texto = "Me siga no ZulCode!";

  useEffect(() => {
    let vivo = true;
    gerarQrComIcone(endereco)
      .then((url) => vivo && setQr(url))
      .catch(() => vivo && setQr(null));
    return () => {
      vivo = false;
    };
  }, [endereco]);

  // A entrada: fundo, cartão e folha, cada um no seu tempo.
  useEffect(() => {
    if (movimentoReduzido()) return;
    fundoRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    cartaoRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(28px) scale(0.86)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.15)" },
    );
    folhaRef.current?.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], {
      duration: 340,
      delay: 70,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "backwards",
    });
  }, []);

  const fechar = useCallback(() => {
    if (saindo.current) return;
    saindo.current = true;
    if (movimentoReduzido()) return onFechar();
    const opcoes = { duration: 180, easing: "ease-in", fill: "forwards" as const };
    fundoRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], opcoes);
    cartaoRef.current?.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "translateY(16px) scale(0.92)" }], opcoes);
    folhaRef.current?.animate([{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], opcoes);
    setTimeout(onFechar, 180);
  }, [onFechar]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [fechar]);

  const avisar = (mensagem: string) => {
    setAviso(mensagem);
    setTimeout(() => setAviso(null), 2000);
  };

  const imagemDoCartao = async () => {
    if (!qr) throw new Error("O QR ainda está sendo gerado.");
    return gerarImagemDoCartao({ perfil, qr, avatar: avatarRef.current });
  };

  const comImagem = async (acao: (imagem: Blob) => Promise<void> | void) => {
    try {
      await acao(await imagemDoCartao());
    } catch {
      // Quem fecha o compartilhar sem escolher nada não precisa de aviso.
    }
  };

  const abrir = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  /** O que cada botão da folha faz. Fica numa função só, chamada no clique. */
  const agir = (id: OpcaoDeCompartilhar) => {
    const t = encodeURIComponent(texto);
    const u = encodeURIComponent(endereco);
    switch (id) {
      case "instagram":
        // O Instagram não aceita link de fora: vai a imagem do cartão pelo compartilhar do sistema.
        return void comImagem(async (imagem) => {
          if (!(await compartilharCartao(imagem, texto, endereco))) avisar("Imagem salva. Poste no Instagram.");
        });
      case "x":
        return abrir(`https://x.com/intent/post?text=${t}&url=${u}`);
      case "whatsapp":
        return abrir(`https://wa.me/?text=${encodeURIComponent(`${texto} ${endereco}`)}`);
      case "facebook":
        return abrir(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
      case "copiar":
        return void navigator.clipboard
          .writeText(endereco)
          .then(() => avisar("Link copiado"))
          .catch(() => avisar(endereco));
      case "salvar":
        return void comImagem(async (imagem) => {
          const { Capacitor } = await import("@capacitor/core");
          // No app não há pasta de downloads pelo navegador: o compartilhar tem o "Salvar".
          if (Capacitor.isNativePlatform()) await compartilharCartao(imagem, texto, endereco);
          else {
            baixar(imagem, "zulcode-perfil.png");
            avisar("Imagem salva");
          }
        });
      case "mais":
        return void comImagem(async (imagem) => {
          if (!(await compartilharCartao(imagem, texto, endereco))) avisar("Imagem salva");
        });
    }
  };

  return createPortal(
    <div role="dialog" aria-modal aria-label="QR code do perfil" className="fixed inset-0 z-50 flex flex-col">
      <div ref={fundoRef} className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={fechar} />

      <div className="relative flex flex-1 items-center justify-center p-6" onClick={fechar}>
        <div ref={cartaoRef} className="w-full max-w-[300px] rounded-[26px] bg-white p-3.5 text-[#0f1115] shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div
            ref={avatarRef}
            className="grid aspect-square w-full place-items-center overflow-hidden rounded-[18px] text-white"
            style={{ background: perfil.bannerColor ?? "#22c55e", fontSize: "88px" }}
          >
            <AvatarIcon id={perfil.avatarId} className="size-[0.95em]" />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3 px-1 pb-0.5">
            <div className="min-w-0">
              <p className="truncate text-[1.35rem] font-black leading-tight">{perfil.nome.trim().split(/\s+/)[0]}</p>
              {perfil.publicCode && <p className="text-[0.82rem] font-bold text-[#6b7280]">#{perfil.publicCode}</p>}
              <p className="mt-1.5 text-[1.3rem] font-black tracking-tight text-[#1892ff]">ZulCode</p>
            </div>
            <div className="grid size-[92px] shrink-0 place-items-center">
              {qr ? <img src={qr} alt="QR code do seu perfil" className="size-full" /> : <span className="size-full animate-pulse rounded-lg bg-[#e5e7eb]" />}
            </div>
          </div>
        </div>
      </div>

      <div ref={folhaRef} className="relative rounded-t-[26px] border-t border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={fechar} aria-label="Fechar" className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-6" />
          </button>
          {aviso && (
            <p role="status" className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[0.78rem] font-black text-foreground">
              <Check className="size-3.5" />
              {aviso}
            </p>
          )}
        </div>
        <div className="mx-auto mt-3 grid max-w-md grid-cols-4 gap-x-2 gap-y-4">
          {OPCOES.map((opcao) => (
            <button key={opcao.id} type="button" onClick={() => agir(opcao.id)} className="group flex flex-col items-center gap-1.5">
              <span className={cn("grid size-14 place-items-center rounded-full transition-transform duration-150 group-hover:scale-105 group-active:scale-95", opcao.fundo)}>
                {opcao.icone}
              </span>
              <span className="text-[0.75rem] font-bold text-foreground">{opcao.rotulo}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
