import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let available = true;
try { await access(chrome); } catch { available = false; }

test("runtime no navegador: DOM, CSS, console, erros e isolamento", { skip: !available, timeout: 120000 }, async () => {
  const runtime = await readFile(new URL("./dist/index.html", import.meta.url), "utf8");
  let networkRequests = 0;
  const modules = new Map();
  for (const [route, file] of [
    ["/iframe-executor.js", "../src/lib/playground/iframe-executor.ts"],
    ["/playground-preview.js", "../src/lib/playground-preview.ts"],
  ]) {
    let source = await readFile(new URL(file, import.meta.url), "utf8");
    source = source.replace('"../playground-preview"', '"/playground-preview.js"')
      .replace("process.env.NEXT_PUBLIC_PLAYGROUND_PREVIEW_URL", "undefined");
    modules.set(route, ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText);
  }
  const cases = [
    { name: "dom-css", html: '<button id="b">Olá</button>', css: "#b { color: rgb(1, 2, 3); }",
      javascript: 'console.log(document.querySelector("#b").textContent, getComputedStyle(document.querySelector("#b")).color, "</script>");', match: "Olá rgb(1, 2, 3) </script>" },
    { name: "storage", javascript: 'try { parent.localStorage.getItem("accessToken"); console.log("BAD"); } catch { console.log("ISOLATED"); }', match: "ISOLATED" },
    { name: "network", javascript: 'fetch("/network-test").catch(() => console.log("BLOCKED"));', match: "BLOCKED" },
    { name: "while-limit", javascript: "while(true){}", error: true, match: "Loop interrompido na linha 1" },
    { name: "for-limit", javascript: "for(;;);", error: true, match: "Loop interrompido" },
    { name: "do-limit", javascript: "do {} while(true)", error: true, match: "Loop interrompido" },
    { name: "timer-limit", javascript: "setTimeout(() => {while(true){}}, 0)", error: true, match: "Loop interrompido" },
    { name: "catch-limit", javascript: "try {while(true){}} catch {} console.log('ignored')", error: true, match: "Loop interrompido" },
    { name: "finite-loop", javascript: "let x=0;for(let i=0;i<10000;i++){x++} console.log(x)", match: "10000" },
    { name: "syntax", javascript: "const = ;", error: true },
    { name: "throw", javascript: 'throw new Error("sample-error");', error: true, match: "sample-error" },
    { name: "promise", javascript: 'Promise.reject(new Error("sample-promise"));', error: true, match: "sample-promise" },
    { name: "async", javascript: 'setTimeout(() => console.log("ASYNC"), 20);', match: "ASYNC" },
    { name: "html-script", html: '<script>console.log("BAD")</script><button onclick="console.log(\'BAD\')">Click</button>',
      javascript: 'document.querySelector("button").click(); console.log("CLEAN");', match: "CLEAN", forbidden: "BAD" },
    // O que mudou no runtime: varios .js na ordem da lista, varias folhas de
    // estilo, e o <link> para arquivo local saindo porque quem injeta e o
    // runtime.
    { name: "muitos-scripts", scripts: ["var compartilhado = 'A';", "console.log(compartilhado + 'B');"],
      match: "AB" },
    { name: "muitos-estilos", html: '<p id="p">x</p>',
      styles: ["#p { color: rgb(9, 9, 9); }", "#p { font-weight: 700; }"],
      javascript: 'const e = getComputedStyle(document.querySelector("#p")); console.log(e.color, e.fontWeight);',
      match: "rgb(9, 9, 9) 700" },
    { name: "link-local-sai", html: '<link rel="stylesheet" href="style.css"><p id="p">x</p>',
      css: "#p { color: rgb(4, 5, 6); }",
      javascript: 'console.log(getComputedStyle(document.querySelector("#p")).color, document.querySelectorAll("link").length);',
      match: "rgb(4, 5, 6) 0" },
  ];
  const harness = `<!doctype html><pre id="result">WAIT</pre><script type="module">
  import { IframeExecutor } from "/iframe-executor.js";
  const cases = ${JSON.stringify(cases).replaceAll("<", "\\u003c")};

  // Os casos sao descritos com html/css/javascript simples; isto traduz para o
  // formato de varios arquivos que o runtime passou a aceitar.
  const empacotar = (c) => ({
    html: c.html || "",
    styles: c.styles
      ? c.styles.map((codigo, i) => ({ nome: "folha" + (i + 1) + ".css", codigo }))
      : c.css ? [{ nome: "style.css", codigo: c.css }] : [],
    scripts: c.scripts
      ? c.scripts.map((codigo, i) => ({ nome: "script" + (i + 1) + ".js", codigo }))
      : [{ nome: "script.js", codigo: c.javascript || "" }],
    libs: [],
  });
  const results = [];
  async function run(c) {
    return new Promise(resolve => {
      const frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts");
      const runId = crypto.randomUUID();
      const messages = [];
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        removeEventListener("message", receive); frame.remove();
        const text = messages.map(m => m.text).join("\\n");
        results.push({ name:c.name, ok: (!!c.error === messages.some(m => m.type === "error" || m.type === "limit")) &&
          (!c.match || text.includes(c.match)) && (!c.forbidden || !text.includes(c.forbidden)), messages });
        resolve();
      };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data.runId !== runId) return;
        if (event.data.type === "booted") {
          frame.contentWindow.postMessage({ channel:"zulcode-playground", runId:"incorrect", type:"run",
            files:{html:"",styles:[],scripts:[{nome:"x.js",codigo:"console.log('BAD')"}],libs:[]} }, "*");
          frame.contentWindow.postMessage({ channel:"zulcode-playground", runId, type:"run",
            files: empacotar(c) }, "*");
        } else {
          messages.push(event.data);
          if (event.data.type === "error" || event.data.type === "limit" || event.data.type === "ready") setTimeout(finish, 100);
        }
      };
      addEventListener("message", receive);
      const timer = setTimeout(finish, 2500);
      frame.src = "/playground-runtime/index.html#" + new URLSearchParams({parentOrigin:location.origin,runId});
      document.body.append(frame);
    });
  }
  async function testExecutor() {
    const executor = new IframeExecutor();
    const disconnect = executor.connect();
    let frame = null;
    let currentId = "";
    const unsubscribe = executor.subscribe(() => {
      const snapshot = executor.getSnapshot();
      if (snapshot.preview?.id === currentId) return;
      frame?.remove();
      frame = null;
      currentId = snapshot.preview?.id || "";
      if (snapshot.preview) {
        frame = document.createElement("iframe");
        frame.setAttribute("sandbox", "allow-scripts");
        frame.src = snapshot.preview.url;
        frame.onload = executor.onFrameLoad;
        executor.bindFrame(frame);
        document.body.append(frame);
      } else executor.bindFrame(null);
    });
    const wait = async () => {
      for (let i = 0; i < 100 && executor.getSnapshot().status === "running"; i++)
        await new Promise(resolve => setTimeout(resolve, 25));
    };
    try {
      executor.run({files:{html:"",styles:[],scripts:[{nome:"script.js",codigo:"console.log('FIRST')"}],libs:[]}});
      const firstId = executor.getSnapshot().preview.id;
      await wait();
      const first = executor.getSnapshot();
      parent.postMessage({channel:"zulcode-playground",runId:firstId,type:"error",text:"SPOOF"}, "*");
      await new Promise(resolve => setTimeout(resolve, 20));
      if (executor.getSnapshot().status !== "ready") throw new Error("Mensagem falsa aceita");
      executor.run({files:{html:"",styles:[],scripts:[{nome:"script.js",codigo:"console.log('SECOND'); setTimeout(() => console.log('LATE'), 500)"}],libs:[]}});
      const secondId = executor.getSnapshot().preview.id;
      await wait();
      const second = executor.getSnapshot();
      executor.stop();
      await new Promise(resolve => setTimeout(resolve, 550));
      const stopped = executor.getSnapshot();
      const ok = first.status === "ready" && first.logs.some(log => log.text === "FIRST") &&
        second.status === "ready" && secondId !== firstId &&
        second.logs.some(log => log.text === "SECOND") &&
        !second.logs.some(log => log.text === "FIRST") &&
        stopped.status === "stopped" && !stopped.preview &&
        !stopped.logs.some(log => log.text === "LATE");
      executor.run({files:{html:"",styles:[],scripts:[{nome:"script.js",codigo:"while(true){}"}],libs:[]}});
      await wait();
      const limited = executor.getSnapshot();
      const loopStopped = limited.status === "error" && !limited.preview &&
        limited.logs.some(log => log.text.includes("Loop interrompido"));
      // Nao ha mais linguagem nao suportada; o que o executor recusa e arquivo
      // grande demais.
      executor.run({files:{html:"",styles:[],scripts:[{nome:"grande.js",codigo:"x".repeat(100001)}],libs:[]}});
      const unsupported = executor.getSnapshot().status === "error" && !executor.getSnapshot().preview;
      executor.reset();
      results.push({name:"executor-lifecycle",ok:ok && loopStopped && unsupported && executor.getSnapshot().status === "idle"});
    } catch (error) {
      results.push({name:"executor-lifecycle",ok:false,error:String(error)});
    } finally { unsubscribe(); disconnect(); frame?.remove(); }
  }
  (async () => { for (const c of cases) await run(c);
    await testExecutor();
    document.getElementById("result").textContent = JSON.stringify(results);
  })();
  </script>`;
  const server = createServer((req, res) => {
    if (req.url.startsWith("/network-test")) networkRequests++;
    if (modules.has(req.url)) {
      res.setHeader("Content-Type", "text/javascript");
      res.end(modules.get(req.url));
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (req.url.startsWith("/playground-runtime/"))
      res.setHeader("Content-Security-Policy", "sandbox allow-scripts; frame-ancestors 'self'");
    res.end(req.url.startsWith("/playground-runtime/") ? runtime : harness);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const profile = await mkdtemp(join(tmpdir(), "zulcode-chrome-"));
  try {
    const child = spawn(chrome, [
      "--headless=new", "--no-first-run", "--disable-background-networking",
      "--user-data-dir=" + profile, "--remote-debugging-port=0",
      "http://127.0.0.1:" + server.address().port,
    ]);
    let socket;
    let raw;
    try {
      const browserUrl = await new Promise((resolve, reject) => {
        let stderr = "";
        const timer = setTimeout(() => reject(new Error("Chrome não iniciou")), 10000);
        child.stderr.on("data", chunk => {
          stderr += chunk;
          const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
          if (match) { clearTimeout(timer); resolve(match[1]); }
        });
        child.on("error", reject);
      });
      const endpoint = new URL(browserUrl);
      let page;
      for (let attempt = 0; attempt < 100 && !page; attempt++) {
        const targets = await (await fetch("http://" + endpoint.host + "/json/list")).json();
        page = targets.find(target => target.type === "page" && target.url.startsWith("http://127.0.0.1:"));
        if (!page) await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.ok(page, "Página de teste não abriu");
      socket = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
      let nextId = 0;
      const pending = new Map();
      socket.onmessage = event => {
        const message = JSON.parse(event.data);
        if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
      };
      for (let attempt = 0; attempt < 400; attempt++) {
        const id = ++nextId;
        const response = new Promise(resolve => pending.set(id, resolve));
        socket.send(JSON.stringify({ id, method:"Runtime.evaluate", params:{ expression:'document.getElementById("result")?.textContent', returnByValue:true } }));
        raw = (await response).result?.result?.value;
        if (raw && raw !== "WAIT") break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      socket?.close();
      await new Promise(resolve => { child.once("exit", resolve); child.kill(); });
    }
    assert.ok(raw && raw !== "WAIT", "Runtime não completou os testes");
    const results = JSON.parse(raw);
    assert.equal(results.length, cases.length + 1);
    for (const result of results) assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(networkRequests, 0, "fetch escapou da CSP");
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive:true, force:true, maxRetries:5, retryDelay:200 });
  }
});
