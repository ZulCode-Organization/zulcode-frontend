(() => {
  "use strict";

  const CHANNEL = "zulcode-playground";
  const params = new URLSearchParams(location.hash.slice(1));
  const runId = params.get("runId");
  const parentOrigin = params.get("parentOrigin");
  const MAX_CODE_LENGTH = 100000;
  const MAX_LOGS = 200;
  const MAX_OUTPUT_LENGTH = 12000;
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

  addEventListener("message", (event) => {
    if (accepted || event.source !== parent || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || typeof data !== "object" || data.channel !== CHANNEL ||
        data.runId !== runId || data.type !== "run") return;
    accepted = true;
    const files = data.files;
    if (!files || !["html", "css", "javascript"].every((key) =>
      typeof files[key] === "string" && files[key].length <= MAX_CODE_LENGTH)) {
      send("error", "error", "Arquivos inválidos ou maiores que 100.000 caracteres.");
      return;
    }

    try {
      const guardName = "__zulcodeLoop_" + crypto.randomUUID().replaceAll("-", "");
      const code = instrumentLoops(files.javascript, parse, guardName);
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
      // O parsing restringe os recursos suportados; o isolamento é feito pelo
      // sandbox e pela CSP, não por esta lista de elementos.
      const parsed = new DOMParser().parseFromString(files.html, "text/html");
      parsed.querySelectorAll("script, base, meta[http-equiv], iframe, object, embed")
        .forEach((node) => node.remove());
      for (const node of parsed.querySelectorAll("*")) {
        for (const attribute of Array.from(node.attributes)) {
          if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        }
      }
      document.documentElement.lang = parsed.documentElement.lang || "pt-BR";
      for (const node of parsed.head.querySelectorAll("style, title")) {
        document.head.append(document.importNode(node, true));
      }
      for (const attribute of Array.from(parsed.body.attributes)) {
        document.body.setAttribute(attribute.name, attribute.value);
      }
      document.body.replaceChildren(...Array.from(parsed.body.childNodes));
      const style = document.createElement("style");
      style.textContent = files.css;
      document.head.append(style);

      // Blob permite JavaScript clássico com DOM sem eval/unsafe-eval.
      const url = URL.createObjectURL(new Blob([
        code + "\n//# sourceURL=zulcode-playground.js",
      ], { type: "text/javascript" }));
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => {
        URL.revokeObjectURL(url);
        if (!failed) send("ready", "success",
          "Script inicial executado. O preview continua ativo para cliques e tarefas assíncronas.");
      };
      script.onerror = () => {
        URL.revokeObjectURL(url);
        failed = true;
        send("error", "error", "Não foi possível carregar o JavaScript. Confira a política de segurança do preview.");
      };
      document.body.append(script);
    } catch (error) {
      failed = true;
      send("error", "error", format(error));
    }
  });

  send("booted", "normal");
})();
