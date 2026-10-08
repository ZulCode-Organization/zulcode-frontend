(() => {
  "use strict";

  const CHANNEL = "zulcode-playground";
  const params = new URLSearchParams(location.hash.slice(1));
  const runId = params.get("runId");
  const parentOrigin = params.get("parentOrigin");
  const MAX_CODE_LENGTH = 100000;
  const MAX_FILES = 30;
  const MAX_LOGS = 200;
  const MAX_OUTPUT_LENGTH = 12000;
  // A mesma lista existe no app. Repetir aqui é de propósito: um projeto
  // compartilhado por outra pessoa não deve conseguir carregar script de
  // qualquer lugar só porque passou pela tela de quem o criou.
  const CDNS = ["https://cdn.jsdelivr.net/", "https://cdnjs.cloudflare.com/"];
  let loopAborted = false;
  let accepted = false;
  let failed = false;
  let count = 0;
  let warned = false;

  if (!runId || !parentOrigin || parent === window) return;
  try {
    const origin = new URL(parentOrigin);
    if (!["https:", "http:"].includes(origin.protocol) ||
        origin.origin !== parentOrigin) return;
  } catch { return; }

  const post = parent.postMessage.bind(parent);
  const send = (type, tone, text = "") => {
    post({ channel: CHANNEL, runId, type, tone,
      text: String(text).slice(0, MAX_OUTPUT_LENGTH) }, parentOrigin);
  };
  const format = (value) => {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === "bigint") return String(value) + "n";
    try { return JSON.stringify(value, null, 2) ?? String(value); }
    catch { return String(value); }
  };

  for (const method of ["log", "info", "debug", "warn", "error"]) {
    console[method] = (...args) => {
      if (loopAborted) return;
      if (count >= MAX_LOGS) {
        if (!warned) {
          warned = true;
          send("console", "warning", "Limite de mensagens atingido. Execute novamente para reiniciar.");
        }
        return;
      }
      count++;
      send("console", method === "error" ? "error" :
        method === "warn" ? "warning" : "normal", args.map(format).join(" "));
    };
  }
  addEventListener("error", (event) => {
    if (loopAborted || !(event instanceof ErrorEvent)) return;
    failed = true;
    send("error", "error", event.message +
      (event.lineno ? " (linha " + event.lineno + ")" : ""));
  });
  addEventListener("unhandledrejection", (event) => {
    if (loopAborted) return;
    failed = true;
    send("error", "error", "Promise rejeitada: " + format(event.reason));
  });

  const ehLista = (valor) => Array.isArray(valor) && valor.length <= MAX_FILES &&
    valor.every((item) => item && typeof item.nome === "string" &&
      typeof item.codigo === "string" && item.codigo.length <= MAX_CODE_LENGTH);

  // Um <script> por vez, em fila: o segundo arquivo costuma depender das
  // variáveis que o primeiro criou, e src é sempre assíncrono.
  const carregarEmFila = (fontes, aoTerminar) => {
    const proxima = (indice) => {
      if (indice >= fontes.length) return aoTerminar();
      const fonte = fontes[indice];
      const script = document.createElement("script");
      script.src = fonte.url;
      script.onload = () => {
        if (fonte.revogar) URL.revokeObjectURL(fonte.url);
        proxima(indice + 1);
      };
      script.onerror = () => {
        if (fonte.revogar) URL.revokeObjectURL(fonte.url);
        failed = true;
        send("error", "error", fonte.erro);
        proxima(indice + 1);
      };
      document.body.append(script);
    };
    proxima(0);
  };

  addEventListener("message", (event) => {
    if (accepted || event.source !== parent || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || typeof data !== "object" || data.channel !== CHANNEL ||
        data.runId !== runId || data.type !== "run") return;
    accepted = true;
    const files = data.files;
    if (!files || typeof files.html !== "string" || files.html.length > MAX_CODE_LENGTH ||
        !ehLista(files.styles) || !ehLista(files.scripts)) {
      send("error", "error", "Arquivos inválidos: no máximo " + MAX_FILES +
        " por tipo, com até 100.000 caracteres cada.");
      return;
    }
    const libs = (Array.isArray(files.libs) ? files.libs : [])
      .filter((url) => typeof url === "string" && CDNS.some((cdn) => url.startsWith(cdn)))
      .slice(0, MAX_FILES);

    try {
      const guardName = "__zulcodeLoop_" + crypto.randomUUID().replaceAll("-", "");
      const schedule = setTimeout.bind(window);
      const guard = createLoopBudget({
        now: performance.now.bind(performance),
        scheduleReset: callback => schedule(callback, 0),
        onLimit: message => {
          loopAborted = true;
          failed = true;
          send("limit", "error", message);
        },
      });
      Object.defineProperty(window, guardName, { value: guard });

      // Instrumentar antes de mexer no documento: se um arquivo tiver erro de
      // sintaxe, a página não fica montada pela metade.
      const programas = files.scripts.map((arquivo) => ({
        nome: arquivo.nome,
        codigo: instrumentLoops(arquivo.codigo, parse, guardName),
      }));

      // O parsing restringe os recursos suportados; o isolamento é feito pelo
      // sandbox e pela CSP, não por esta lista de elementos. Os <script> e os
      // <link> locais saem porque o runtime injeta os arquivos do projeto na
      // ordem da lista; os <link> de CDN permitido ficam.
      const parsed = new DOMParser().parseFromString(files.html, "text/html");
      parsed.querySelectorAll("script, base, meta[http-equiv], iframe, object, embed")
        .forEach((node) => node.remove());
      for (const node of Array.from(parsed.querySelectorAll("link"))) {
        const href = node.getAttribute("href") || "";
        if (!CDNS.some((cdn) => href.startsWith(cdn))) node.remove();
      }
      for (const node of parsed.querySelectorAll("*")) {
        for (const attribute of Array.from(node.attributes)) {
          if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        }
      }
      document.documentElement.lang = parsed.documentElement.lang || "pt-BR";
      for (const node of parsed.head.querySelectorAll("style, title, link")) {
        document.head.append(document.importNode(node, true));
      }
      for (const attribute of Array.from(parsed.body.attributes)) {
        document.body.setAttribute(attribute.name, attribute.value);
      }
      document.body.replaceChildren(...Array.from(parsed.body.childNodes));
      for (const folha of files.styles) {
        const style = document.createElement("style");
        style.dataset.arquivo = folha.nome;
        style.textContent = folha.codigo;
        document.head.append(style);
      }

      // Blob permite JavaScript clássico com DOM sem eval/unsafe-eval. O
      // sourceURL faz o erro apontar o nome do arquivo do aluno.
      const fontes = libs.map((url) => ({
        url,
        revogar: false,
        erro: "Não foi possível carregar a biblioteca " + url + ".",
      })).concat(programas.map((programa) => ({
        url: URL.createObjectURL(new Blob([
          programa.codigo + "\n//# sourceURL=" + programa.nome,
        ], { type: "text/javascript" })),
        revogar: true,
        erro: "Não foi possível carregar " + programa.nome +
          ". Confira a política de segurança do preview.",
      })));

      carregarEmFila(fontes, () => {
        if (!failed) send("ready", "success",
          "Código executado. O preview continua ativo para cliques e tarefas assíncronas.");
      });
    } catch (error) {
      failed = true;
      send("error", "error", format(error));
    }
  });

  send("booted", "normal");
})();
