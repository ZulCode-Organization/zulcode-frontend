/**
 * Roda o JS do playground numa thread separada da página — se o código tiver
 * um loop infinito, quem trava é só esse worker (a página principal do app
 * continua respondendo normalmente). O lado que chamou (js-terminal.tsx) é
 * quem decide matar esse worker se demorar demais.
 */
function formatarValor(valor) {
  if (typeof valor === "string") return valor;
  if (valor === undefined) return "undefined";
  try {
    const json = JSON.stringify(valor, null, 2);
    return json === undefined ? String(valor) : json;
  } catch {
    return String(valor);
  }
}

self.onmessage = function (evento) {
  const codigo = evento.data;
  const logs = [];

  // Corpo com chaves (não uma seta de expressão única): sem isso, o valor
  // de retorno de Array.push (a nova quantidade de itens) vazava como se
  // fosse o "resultado" de um console.log(...) — igual o console de
  // verdade, essas funções não devem retornar nada.
  const consoleFalso = {
    log: (...args) => {
      logs.push({ tipo: "log", texto: args.map(formatarValor).join(" ") });
    },
    error: (...args) => {
      logs.push({ tipo: "erro", texto: args.map(formatarValor).join(" ") });
    },
    warn: (...args) => {
      logs.push({ tipo: "aviso", texto: args.map(formatarValor).join(" ") });
    },
  };

  try {
    // Tenta rodar como uma expressão única primeiro — assim um valor tipo
    // `1 + 1` ou `"oi".toUpperCase()` aparece na saída, igual um REPL de
    // verdade. Se não for uma expressão simples, cai pro modo "bloco de
    // código" (várias linhas, sem valor de retorno automático).
    let resultado;
    try {
      const comoExpressao = new Function("console", `return (\n${codigo}\n);`);
      resultado = comoExpressao(consoleFalso);
    } catch {
      const comoBloco = new Function("console", codigo);
      resultado = comoBloco(consoleFalso);
    }

    self.postMessage({
      logs,
      resultado: resultado !== undefined ? formatarValor(resultado) : null,
      erro: null,
    });
  } catch (erro) {
    self.postMessage({ logs, resultado: null, erro: erro.message });
  }
};
