import { htmlUnico } from "./arquivos";
import type { Projeto } from "./tipos";

/** Exportar o projeto: .zip com os arquivos, um .html que roda sozinho, ou
 *  tudo copiado para a área de transferência.
 *
 *  O .zip é escrito aqui, à mão, em vez de trazer uma biblioteca de 100 KB para
 *  três arquivos de texto. Sem compressão (método "store"): o ganho em código
 *  fonte não paga o custo de embutir um deflate. */

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let valor = i;
    for (let bit = 0; bit < 8; bit++) {
      valor = valor & 1 ? 0xedb88320 ^ (valor >>> 1) : valor >>> 1;
    }
    tabela[i] = valor >>> 0;
  }
  return tabela;
})();

function crc32(dados: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of dados) crc = TABELA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Data e hora no formato MS-DOS, que é o que o cabeçalho do zip guarda. */
function dataDos(quando: Date) {
  const hora = (quando.getHours() << 11) | (quando.getMinutes() << 5) |
    Math.floor(quando.getSeconds() / 2);
  const data = ((quando.getFullYear() - 1980) << 9) | ((quando.getMonth() + 1) << 5) |
    quando.getDate();
  return { hora, data };
}

type EntradaZip = { nome: string; dados: Uint8Array<ArrayBuffer> };

/** O TextEncoder devolve uma view que pode estar sobre SharedArrayBuffer, e o
 *  Blob so aceita ArrayBuffer. Copiar aqui resolve o tipo e o conteudo. */
function bytes(texto: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new TextEncoder().encode(texto));
}

function montarZip(entradas: EntradaZip[]) {
  const { hora, data } = dataDos(new Date());
  const locais: Uint8Array<ArrayBuffer>[] = [];
  const centrais: Uint8Array<ArrayBuffer>[] = [];
  let deslocamento = 0;

  for (const entrada of entradas) {
    const nome = bytes(entrada.nome);
    const crc = crc32(entrada.dados);
    const tamanho = entrada.dados.length;

    const cabecalho = new Uint8Array(30 + nome.length);
    const visao = new DataView(cabecalho.buffer);
    visao.setUint32(0, 0x04034b50, true);
    visao.setUint16(4, 20, true);
    // 0x0800 avisa que o nome do arquivo está em UTF-8.
    visao.setUint16(6, 0x0800, true);
    visao.setUint16(8, 0, true);
    visao.setUint16(10, hora, true);
    visao.setUint16(12, data, true);
    visao.setUint32(14, crc, true);
    visao.setUint32(18, tamanho, true);
    visao.setUint32(22, tamanho, true);
    visao.setUint16(26, nome.length, true);
    visao.setUint16(28, 0, true);
    cabecalho.set(nome, 30);
    locais.push(cabecalho, entrada.dados);

    const central = new Uint8Array(46 + nome.length);
    const visaoCentral = new DataView(central.buffer);
    visaoCentral.setUint32(0, 0x02014b50, true);
    visaoCentral.setUint16(4, 20, true);
    visaoCentral.setUint16(6, 20, true);
    visaoCentral.setUint16(8, 0x0800, true);
    visaoCentral.setUint16(10, 0, true);
    visaoCentral.setUint16(12, hora, true);
    visaoCentral.setUint16(14, data, true);
    visaoCentral.setUint32(16, crc, true);
    visaoCentral.setUint32(20, tamanho, true);
    visaoCentral.setUint32(24, tamanho, true);
    visaoCentral.setUint16(28, nome.length, true);
    visaoCentral.setUint32(42, deslocamento, true);
    central.set(nome, 46);
    centrais.push(central);

    deslocamento += cabecalho.length + tamanho;
  }

  const tamanhoCentral = centrais.reduce((soma, parte) => soma + parte.length, 0);
  const fim = new Uint8Array(22);
  const visaoFim = new DataView(fim.buffer);
  visaoFim.setUint32(0, 0x06054b50, true);
  visaoFim.setUint16(8, entradas.length, true);
  visaoFim.setUint16(10, entradas.length, true);
  visaoFim.setUint32(12, tamanhoCentral, true);
  visaoFim.setUint32(16, deslocamento, true);

  return new Blob([...locais, ...centrais, fim], { type: "application/zip" });
}

function nomeDeArquivo(nome: string, extensao: string) {
  const limpo = nome.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${limpo || "projeto"}.${extensao}`;
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  // Revogar na hora cancelaria o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function baixarZip(projeto: Projeto) {
  const entradas: EntradaZip[] = projeto.arquivos.map((arquivo) => ({
    nome: arquivo.nome,
    dados: bytes(arquivo.conteudo),
  }));
  // Um index.html que junta tudo: quem descompactar e clicar duas vezes vê o
  // projeto rodando, mesmo que os arquivos estejam separados.
  if (!projeto.arquivos.some((arquivo) => arquivo.nome.toLowerCase() === "index.html")) {
    entradas.unshift({ nome: "index.html", dados: bytes(htmlUnico(projeto)) });
  }
  baixar(montarZip(entradas), nomeDeArquivo(projeto.nome, "zip"));
}

export function baixarHtml(projeto: Projeto) {
  baixar(
    new Blob([htmlUnico(projeto)], { type: "text/html;charset=utf-8" }),
    nomeDeArquivo(projeto.nome, "html"),
  );
}

export async function copiarTudo(projeto: Projeto) {
  const texto = projeto.arquivos
    .map((arquivo) => `/* ===== ${arquivo.nome} ===== */\n${arquivo.conteudo}`)
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
