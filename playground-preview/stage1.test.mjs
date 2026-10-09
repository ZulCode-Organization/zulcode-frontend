import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { isRunMessage, parseRuntimeMessage, PLAYGROUND_CHANNEL } from "./protocol.mjs";

const source = await readFile(new URL("../src/lib/playground/draft-safety.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { decodeDraft, preserveInvalidDraft, createDraftSaver, confirmDraftReset, DRAFT_KEY } =
  await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const defaults = { html: "<p>Example</p>", css: "", javascript: "", tab: "html" };
const id = "00000000-0000-4000-8000-000000000001";
const ready = { channel: PLAYGROUND_CHANNEL, runId: id, type: "ready", tone: "success", text: "OK" };

test("protocolo rejeita formatos e tons inválidos sem coerção", () => {
  assert.deepEqual(parseRuntimeMessage(ready), ready);
  for (const value of [null, [], "ready", { ...ready, type: ["ready"] },
    { ...ready, tone: "normal" }, { ...ready, runId: "invalid" },
    { ...ready, extra: true }, { ...ready, text: "x".repeat(12001) }])
    assert.equal(parseRuntimeMessage(value), null);
  assert.equal(parseRuntimeMessage({ ...ready, type:"booted",tone:"normal",text:"" })?.type, "booted");
});
test("pedido de execução exige somente os três arquivos e limites válidos", () => {
  const run = { channel:PLAYGROUND_CHANNEL,type:"run",runId:id,files:{html:"",css:"",javascript:""} };
  assert.equal(isRunMessage(run), true);
  for (const value of [{...run,extra:true}, {...run,files:[]},
    {...run,files:{...run.files,javascript:1}}, {...run,files:{...run.files,html:"x".repeat(100001)}},
    {...run,files:{...run.files,token:"secret"}}]) assert.equal(isRunMessage(value), false);
});
test("recupera rascunho atual e legado sem aceitar arquivos inválidos", () => {
  assert.deepEqual(decodeDraft(JSON.stringify(defaults), defaults), defaults);
  assert.equal(decodeDraft(JSON.stringify({html:"saved",css:"",language:"javascript",source:"log()"}), defaults, true).javascript, "log()");
  for(const value of ["{", "null", "[]", JSON.stringify({...defaults,tab:["html"]}), '{"html":"saved","css":42,"javascript":""}'])
    assert.throws(() => decodeDraft(value, defaults));
});
test("preserva o conteúdo inválido exato e nunca substitui backups anteriores", () => {
  const items = new Map([[DRAFT_KEY, "{broken"]]);
  const storage = {setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)??null};
  const first = preserveInvalidDraft(storage,DRAFT_KEY,"{broken");
  const second = preserveInvalidDraft(storage,DRAFT_KEY,"other");
  assert.notEqual(first,second);
  assert.equal(items.get(first),"{broken");
  assert.equal(items.get(DRAFT_KEY),"{broken");
});
test("falha de backup não autoriza sobrescrever o rascunho", () => {
  const storage={setItem:()=>{throw new Error("quota")},getItem:()=>"{original"};
  assert.throws(()=>preserveInvalidDraft(storage,DRAFT_KEY,"{original"),/quota/);
  const save=createDraftSaver(storage,()=>defaults,()=>false);
  assert.equal(save(),false);
});
test("salvamento final usa a edição mais recente mesmo antes do debounce", () => {
  let current = {...defaults};
  const items = new Map();
  const save=createDraftSaver({setItem:(key,value)=>items.set(key,value)},()=>current,()=>true);
  current={...current,javascript:"latest"};
  save();
  assert.equal(JSON.parse(items.get(DRAFT_KEY)).javascript,"latest");
});
test("cancelar restauração preserva o código; confirmação só é exigida para código diferente", () => {
  let asked=0;
  const confirm=()=>{asked++;return false};
  assert.equal(confirmDraftReset(defaults,defaults,confirm),true);
  assert.equal(asked,0);
  assert.equal(confirmDraftReset({...defaults,css:"changed"},defaults,confirm),false);
  assert.equal(asked,1);
  assert.equal(confirmDraftReset({...defaults,html:"changed"},defaults,()=>true),true);
});

