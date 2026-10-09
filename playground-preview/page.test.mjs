import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const appUrl = process.env.PLAYGROUND_TEST_URL;
const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

test("tela do playground: recuperação, confirmação e salvamento ao navegar", {
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
    // Credencial fictícia somente no perfil temporário; nenhuma conta é usada.
    // Bloqueia chamadas ao backend para que o teste não dependa do serviço.
    await command("Network.enable");
    await command("Network.setBlockedURLs", { urls: ["*/user*", "*/courses*", "*/languages*"] });
    await command("Page.enable");
    await command("Page.addScriptToEvaluateOnNewDocument", { source: `
      localStorage.setItem("accessToken", "playground-test");
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("zulcode:playground-web-draft:v1", "{rascunho quebrado");
        sessionStorage.setItem("seeded", "1");
      }
    ` });
    await command("Page.navigate", { url: new URL("/playground", appUrl).href });
    await waitFor('document.querySelector("textarea") && !document.querySelector("textarea").disabled');
    assert.equal(await evaluate(`Object.keys(localStorage).some(key => key.includes(":recovery:") &&
      localStorage.getItem(key) === "{rascunho quebrado")`), true);
    assert.equal(await evaluate('document.body.textContent.includes("Baixar rascunho original")'), true);
    const original = await evaluate('document.querySelector("textarea").value');
    const edit = value => `(() => {
      const field = document.querySelector("textarea");
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(field, ${JSON.stringify(value)});
      field.dispatchEvent(new Event("input", {bubbles:true}));
    })()`;
    await evaluate(edit("<h1>Edição preservada</h1>"));
    await evaluate(`window.confirm = () => false; document.querySelector('[aria-label="Restaurar exemplo"]').click()`);
    assert.equal(await evaluate('document.querySelector("textarea").value'), "<h1>Edição preservada</h1>");
    await evaluate(`window.confirm = () => true; document.querySelector('[aria-label="Restaurar exemplo"]').click()`);
    await waitFor(`document.querySelector("textarea").value === ${JSON.stringify(original)}`);
    // Editar e clicar no mesmo comando evita depender do debounce de 300 ms.
    await evaluate(edit("<h1>Última edição antes de sair</h1>") + `; document.querySelector('a[href="/home"]').click()`);
    await waitFor('location.pathname === "/home" && !document.querySelector("textarea")');
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("zulcode:playground-web-draft:v1")).html'),
      "<h1>Última edição antes de sair</h1>");
    assert.equal(await evaluate(`Object.keys(localStorage).some(key => key.includes(":recovery:") &&
      localStorage.getItem(key) === "{rascunho quebrado")`), true);
  } finally {
    socket?.close();
    if (child.exitCode === null) await new Promise(resolve => { child.once("exit", resolve); child.kill(); });
    await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:200});
  }
});
