/**
 * Reduz uma imagem escolhida pela pessoa para caber como logo: quadrada, no
 * máximo `lado` pixels, em WebP (PNG se o navegador não souber gerar WebP).
 *
 * A redução acontece aqui, no navegador, para o upload sair pequeno — uma foto
 * de celular tem vários megas, e a logo aparece em 40px.
 */
export async function reduzirImagem(arquivo: File, lado = 256): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  if (arquivo.size > 8 * 1024 * 1024) throw new Error("A imagem passa de 8 MB.");

  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falha(new Error("Não foi possível ler a imagem."));
      i.src = url;
    });
    // Recorte central quadrado: logo torta ou esticada fica pior que cortada.
    const menor = Math.min(img.naturalWidth, img.naturalHeight);
    const destino = Math.min(lado, menor);
    const canvas = document.createElement("canvas");
    canvas.width = destino;
    canvas.height = destino;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("O navegador não conseguiu processar a imagem.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (img.naturalWidth - menor) / 2, (img.naturalHeight - menor) / 2, menor, menor, 0, 0, destino, destino);
    const webp = canvas.toDataURL("image/webp", 0.9);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** "JavaScript Avançado" → "javascript-avancado". */
export function slugDe(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
