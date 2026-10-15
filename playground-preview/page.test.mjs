import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const appUrl = process.env.PLAYGROUND_TEST_URL;
const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Chave do rascunho local da versão atual (rascunho.ts).
const DRAFT_KEY = "zulcode:playground-rascunho:v2";

test("tela do playground: rascunho v2, salvamento ao navegar e editor CodeMirror", {
  skip: !appUrl, timeout: 45000,
}, async () => {
  const profile = await mkdtemp(join(tmpdir(), "zulcode-page-"));
  const child = spawn(chrome, ["--headless=new", "--no-first-run", "--disable-background-networking",
    "--user-data-dir=" + profile, "--remote-debugging-port=0", "about:blank"]);
  let socket;
  try {
    const browserUrl = await new Promise((resolve, reject) => {
      let stderr = "";
      const timer = setTimeout(() => reject(new Error("Chrome não iniciou")), 10000);
      child.stderr.on("data", chunk => {
        stderr += chunk;
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      child.on("error", error => { clearTimeout(timer); reject(error); });
    });
    const endpoint = new URL(browserUrl);
    const targets = await (await fetch("http://" + endpoint.host + "/json/list")).json();
    const page = targets.find(target => target.type === "page");
    assert.ok(page);
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let nextId = 0;
    const pending = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      const callback = pending.get(message.id);
      if (callback) { pending.delete(message.id); callback(message); }
    };
    const command = async (method, params = {}) => {
      const id = ++nextId;
      const response = new Promise(resolve => pending.set(id, resolve));
      socket.send(JSON.stringify({ id, method, params }));
      const message = await response;
      assert.ok(!message.error, JSON.stringify(message.error));
      return message.result;
    };
    const evaluate = async expression => {
      const result = await command("Runtime.evaluate", { expression, returnByValue: true });
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.fail("Condição não atendida: " + expression);
    };

    // Credencial fictícia somente no perfil temporário; nenhuma conta real é usada.
    // Bloqueia chamadas ao backend para que o teste não dependa do serviço.
    await command("Network.enable");
    await command("Network.setBlockedURLs", { urls: ["*/playground/projects*", "*/user*", "*/courses*"] });
    await command("Page.enable");

    // ── Cenário 1: rascunho v2 salvo é restaurado ao recarregar ──────────────
    // Semeia um projeto salvo na chave v2 antes da primeira navegação.
    const rascunhoSemeado = JSON.stringify({
      projeto: {
        id: null,
        nome: "Rascunho teste",
        modo: "web",
        bibliotecas: [],
        slugPublico: null,
        arquivos: [
          { id: "aaa", nome: "index.html", conteudo: "<h1>Restaurado</h1>" },
          { id: "bbb", nome: "style.css",  conteudo: "" },
          { id: "ccc", nome: "script.js",  conteudo: "" },
        ],
      },
      emQue: Date.now(),
    });
    await command("Page.addScriptToEvaluateOnNewDocument", { source: `
      localStorage.setItem("accessToken", "playground-test");
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(${JSON.stringify(DRAFT_KEY)}, ${JSON.stringify(rascunhoSemeado)});
        sessionStorage.setItem("seeded", "1");
      }
    ` });
    await command("Page.navigate", { url: new URL("/playground", appUrl).href });

    // O editor CodeMirror monta dentro de .cm-editor; espera o elemento aparecer.
    await waitFor('!!document.querySelector(".cm-editor")');

    // O conteúdo do arquivo ativo aparece no .cm-content como texto plano.
    const conteudoInicial = await evaluate(
      'document.querySelector(".cm-content")?.textContent ?? ""',
    );
    assert.ok(
      conteudoInicial.includes("Restaurado"),
      `Esperava "Restaurado" no editor, obteve: ${conteudoInicial}`,
    );

    // ── Cenário 2: editar via API interna do CodeMirror e navegar imediatamente ─
    // Edita o arquivo ativo usando a instância do CodeMirror exposta no DOM;
    // em seguida navega sem esperar o debounce de 500 ms — o cleanup do efeito
    // deve disparar o salvamento síncrono antes de desmontar.
    const novoConteudo = "<h1>Última edição antes de sair</h1>";
    await evaluate(`
      (() => {
        // O CodeMirror armazena a instância EditorView no elemento .cm-editor.
        // Usamos a API pública de dispatch para não depender de seletores frágeis.
        const el = document.querySelector(".cm-editor");
        const view = el?.["__cm"];
        if (!view) {
          // Fallback: simula Input Event no cm-content (funciona para textos curtos).
          const content = document.querySelector(".cm-content");
          content.focus();
          document.execCommand("selectAll");
          document.execCommand("insertText", false, ${JSON.stringify(novoConteudo)});
        } else {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: ${JSON.stringify(novoConteudo)} },
          });
        }
        // Navega imediatamente — antes do debounce de 500 ms.
        document.querySelector('a[href="/home"]')?.click();
      })()
    `);

    await waitFor('location.pathname === "/home"');

    // O rascunho deve ter sido gravado pelo cleanup do efeito antes de desmontar.
    const rascunhoSalvo = await evaluate(
      `JSON.parse(localStorage.getItem(${JSON.stringify(DRAFT_KEY)}) ?? "null")`,
    );
    assert.ok(rascunhoSalvo, "Rascunho não foi salvo ao navegar");
    // O projeto salvo deve conter o arquivo editado com o novo conteúdo.
    const conteudoSalvo = rascunhoSalvo?.projeto?.arquivos?.find?.(
      a => a.nome === "index.html",
    )?.conteudo;
    assert.equal(
      conteudoSalvo,
      novoConteudo,
      `Esperava "${novoConteudo}", obteve: ${conteudoSalvo}`,
    );
  } finally {
    socket?.close();
    if (child.exitCode === null) await new Promise(resolve => { child.once("exit", resolve); child.kill(); });
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
