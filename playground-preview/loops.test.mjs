import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { parse } from "acorn";
import { instrumentLoops } from "./instrument-loops.mjs";
import { createLoopBudget } from "./loop-budget.mjs";

function execute(source) {
  let resets = [];
  const guard = createLoopBudget({ now: () => 0, scheduleReset: callback => resets.push(callback),
    onLimit: () => {}, maxIterations: 1000 });
  const context = { guard };
  vm.runInNewContext(instrumentLoops(source, parse, "guard"), context, { timeout: 1000 });
  return { context, resets };
}

test("preserva loops válidos, labels, continue, corpos vazios e strings", () => {
  const { context } = execute(`
    var sum = 0;
    outer: for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) { if (j === 1) continue outer; sum++; }
    var i = 0; while (i < 3) i++;
    do { i--; } while (i > 0);
    for (const x of [1,2]) sum += x;
    for (const key in {x:1,y:2}) sum++;
    for (let j = 0; j < 3; j++);
    var text = "while(true){}"; // for(;;);
  `);
  assert.equal(context.sum, 8);
  assert.equal(context.i, 0);
  assert.equal(context.text, "while(true){}");
});

test("interrompe while, for, do e iterador infinito", () => {
  for (const source of [
    "while(true){}", "for(;;);", "do {} while(true);",
    "for (const value of { [Symbol.iterator]: function*(){while(true)yield 1;} }) {}",
    "while(true){try { while(true){} }catch{}}",
  ]) assert.throws(() => execute(source), /limite|encerrada/);
});

test("limite por tempo, reset entre tarefas e aborto persistente", () => {
  let clock = 0, reset, reported = 0;
  const guard = createLoopBudget({ now: () => clock, scheduleReset: fn => { reset = fn; },
    onLimit: () => reported++, maxIterations: 1000, maxDurationMs: 250 });
  guard(4);
  clock = 1000;
  reset();
  guard(4); // Novo turno começa com novo orçamento, mesmo após espera longa.
  for (let i = 0; i < 254; i++) guard(4);
  clock += 251;
  assert.throws(() => guard(4), /linha 4/);
  reset();
  assert.throws(() => guard(4), /encerrada/);
  assert.equal(reported, 1);
});

test("código inválido e with são rejeitados antes da execução", () => {
  assert.throws(() => instrumentLoops("for(;;", parse, "guard"), SyntaxError);
  assert.throws(() => instrumentLoops("with({}){}", parse, "guard"), /with/);
});
