import test from "node:test";
import assert from "node:assert/strict";
import { isRunMessage, parseRuntimeMessage, PLAYGROUND_CHANNEL } from "./protocol.mjs";

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
