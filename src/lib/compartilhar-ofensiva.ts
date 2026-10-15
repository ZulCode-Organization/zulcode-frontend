"use client";

/**
 * A imagem da ofensiva para mandar no WhatsApp ou postar: a chama na cor da
 * faixa, o número, o nome e o Zul. 1080×1350 (4:5) cabe inteira no feed e nos
 * stories.
 *
 * No app Android vai pelo compartilhar do sistema (plugins Share e
 * Filesystem); no navegador, pelo compartilhar do navegador quando existe, e
 * senão a imagem é baixada.
 */

const LARGURA = 1080;
const ALTURA = 1350;

/** O desenho da chama (o mesmo Flame do lucide que o app usa), em 24×24. */
const CHAMA =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";

/** As cores de cada faixa, as mesmas da chama do app (azul, ciano, dourada). */
function coresDaFaixa(dias: number, perfeita: boolean) {
  const base =
    dias >= 100 ? { corpo: "#fbbf24", contorno: "#fde68a", brilho: "#f59e0b" }
    : dias >= 30 ? { corpo: "#06b6d4", contorno: "#a5f3fc", brilho: "#06b6d4" }
    : { corpo: "#2563eb", contorno: "#38bdf8", brilho: "#1892ff" };
  return perfeita ? { ...base, contorno: dias >= 100 ? "#fffbeb" : "#fcd34d" } : base;
}

function carregarImagem(origem: string) {
  return new Promise<HTMLImageElement>((pronto, falhou) => {
    const imagem = new Image();
    imagem.onload = () => pronto(imagem);
    imagem.onerror = falhou;
    imagem.src = origem;
  });
}

export async function gerarImagemDaOfensiva(dados: { dias: number; nome: string; perfeita: boolean }): Promise<Blob> {
  const cores = coresDaFaixa(dados.dias, dados.perfeita);
  const tela = document.createElement("canvas");
  tela.width = LARGURA;
  tela.height = ALTURA;
  const c = tela.getContext("2d")!;
  await document.fonts?.ready;

  // Fundo do app, com a luz da chama atrás dela.
  c.fillStyle = "#0f1115";
  c.fillRect(0, 0, LARGURA, ALTURA);
  const luz = c.createRadialGradient(LARGURA / 2, 470, 40, LARGURA / 2, 470, 520);
  luz.addColorStop(0, `${cores.brilho}66`);
  luz.addColorStop(1, `${cores.brilho}00`);
  c.fillStyle = luz;
  c.fillRect(0, 0, LARGURA, ALTURA);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${CHAMA}" fill="${cores.corpo}" stroke="${cores.contorno}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const chama = await carregarImagem(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  c.drawImage(chama, LARGURA / 2 - 230, 170, 460, 460);

  const fonte = getComputedStyle(document.body).fontFamily || "Inter, sans-serif";
  c.textAlign = "center";
  c.fillStyle = "#ffffff";
  c.font = `900 260px ${fonte}`;
  c.fillText(String(dados.dias), LARGURA / 2, 880);
  c.fillStyle = cores.contorno;
  c.font = `900 64px ${fonte}`;
  c.fillText(dados.dias === 1 ? "dia de ofensiva" : "dias de ofensiva", LARGURA / 2, 970);

  c.fillStyle = "#c5ced9";
  c.font = `700 46px ${fonte}`;
  c.fillText(dados.nome.trim().split(/\s+/)[0] ?? "", LARGURA / 2, 1050);
  if (dados.perfeita) {
    c.fillStyle = "#fcd34d";
    c.font = `800 36px ${fonte}`;
    c.fillText("Ofensiva perfeita", LARGURA / 2, 1105);
  }

  // A marca embaixo: o Zul, o nome e o endereço.
  try {
    const zul = await carregarImagem("/mascot.png");
    c.drawImage(zul, 70, ALTURA - 230, 170, 170);
  } catch {
    // Sem o Zul a imagem continua valendo.
  }
  c.textAlign = "left";
  c.fillStyle = "#ffffff";
  c.font = `900 56px ${fonte}`;
  c.fillText("ZulCode", 260, ALTURA - 140);
  c.fillStyle = "#8b96a5";
  c.font = `600 34px ${fonte}`;
  c.fillText("Aprenda a programar 5 minutos por dia", 260, ALTURA - 90);

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

/** Gera e compartilha. Devolve "baixada" quando só deu para salvar o arquivo. */
export async function compartilharOfensiva(dados: { dias: number; nome: string; perfeita: boolean }) {
  const imagem = await gerarImagemDaOfensiva(dados);
  const texto = `Estou com ${dados.dias} ${dados.dias === 1 ? "dia" : "dias"} de ofensiva no ZulCode!`;

  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Share") && Capacitor.isPluginAvailable("Filesystem")) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const arquivo = await Filesystem.writeFile({ path: `ofensiva-${dados.dias}.png`, data: await emBase64(imagem), directory: Directory.Cache });
    await Share.share({ title: "Minha ofensiva", text: texto, files: [arquivo.uri] });
    return "compartilhada";
  }

  const arquivo = new File([imagem], `ofensiva-${dados.dias}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], text: texto });
    return "compartilhada";
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(imagem);
  link.download = arquivo.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  return "baixada";
}
