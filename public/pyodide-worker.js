/**
 * Roda Python no próprio aparelho, com o Pyodide (o CPython compilado para
 * WebAssembly). Fica numa thread separada da página: um laço infinito trava
 * só este worker, e quem chamou o encerra depois do tempo limite.
 *
 * Mensagens que chegam: { tipo: "preparar" } e { tipo: "rodar", id, arquivos, entrada }
 * (os .py do projeto e o nome do que roda; os outros servem para import).
 * Mensagens que saem: "pronto", "saida" e "erro" (texto do print e do stderr),
 * "fim" e "falha" (a exceção, já sem as linhas internas do Pyodide).
 */
const VERSAO = "0.26.4";
const ENDERECO = `https://cdn.jsdelivr.net/pyodide/v${VERSAO}/full/`;

importScripts(`${ENDERECO}pyodide.js`);

let carregando = null;

function carregar() {
  if (!carregando) {
    carregando = loadPyodide({ indexURL: ENDERECO }).then((py) => {
      // O código de quem estuda não alcança o JavaScript desta página pelo
      // Python: os módulos que fazem essa ponte deixam de ser importáveis.
      py.runPython(`
import sys
for _nome in ("js", "pyodide_js", "pyodide.ffi", "pyodide.code", "pyodide.http"):
    sys.modules[_nome] = None
del _nome
`);
      // input() não tem teclado aqui: avisa em vez de travar esperando.
      py.setStdin({
        stdin: () => {
          throw new Error("input() ainda não funciona no playground. Use valores direto no código.");
        },
      });
      return py;
    });
  }
  return carregando;
}

/** Tira do traceback as linhas do próprio Pyodide, deixando só o que é do código. */
function limparErro(texto) {
  const linhas = String(texto).split("\n");
  const inicio = linhas.findIndex((linha) => linha.includes('File "<exec>"'));
  const uteis = inicio >= 0 ? ["Traceback (most recent call last):", ...linhas.slice(inicio)] : linhas;
  return uteis
    .filter((linha) => !linha.includes("/lib/python3") && !linha.includes("_pyodide"))
    .join("\n")
    .replaceAll('File "<exec>"', 'Arquivo "main.py"')
    .trim();
}

self.onmessage = async (evento) => {
  const { tipo, id, arquivos, entrada } = evento.data ?? {};
  if (tipo === "preparar") {
    try {
      await carregar();
      self.postMessage({ tipo: "pronto" });
    } catch (erro) {
      self.postMessage({ tipo: "falha", id, texto: "Não deu para carregar o Python. Confira a internet e tente de novo." });
    }
    return;
  }
  if (tipo !== "rodar") return;

  let py;
  try {
    py = await carregar();
  } catch {
    self.postMessage({ tipo: "falha", id, texto: "Não deu para carregar o Python. Confira a internet e tente de novo." });
    return;
  }

  py.setStdout({ batched: (texto) => self.postMessage({ tipo: "saida", id, texto }) });
  py.setStderr({ batched: (texto) => self.postMessage({ tipo: "erro", id, texto }) });

  // Os .py do projeto viram arquivos de verdade, para um poder importar o outro.
  // Os módulos deles que ficaram da execução anterior saem, senão o import
  // devolveria a versão velha.
  const nomes = [];
  for (const arquivo of arquivos ?? []) {
    py.FS.writeFile(`/home/pyodide/${arquivo.nome}`, arquivo.conteudo);
    nomes.push(arquivo.nome.replace(/\.py$/, ""));
  }
  py.globals.set("_zc_modulos", py.toPy(nomes));
  py.runPython(`
import sys, importlib
if "/home/pyodide" not in sys.path:
    sys.path.insert(0, "/home/pyodide")
for _m in _zc_modulos:
    sys.modules.pop(_m, None)
importlib.invalidate_caches()
del _zc_modulos
`);
  const codigo = (arquivos ?? []).find((arquivo) => arquivo.nome === entrada)?.conteudo ?? "";

  // Cada execução começa do zero: variáveis da anterior não sobram.
  const escopo = py.globals.get("dict")();
  try {
    // Bibliotecas que o Pyodide tem (ex.: numpy) são baixadas na primeira vez que aparecem num import.
    await py.loadPackagesFromImports(codigo);
    await py.runPythonAsync(codigo, { globals: escopo });
    self.postMessage({ tipo: "fim", id });
  } catch (erro) {
    self.postMessage({ tipo: "falha", id, texto: limparErro(erro && erro.message ? erro.message : erro) });
  } finally {
    escopo.destroy();
  }
};
