export function createLoopBudget({ now, scheduleReset, onLimit, maxIterations = 1_000_000, maxDurationMs = 250 }) {
  let iterations = 0;
  let started = 0;
  let scheduled = false;
  let aborted = false;
  const LoopError = Error;
  return (line) => {
    if (aborted) throw new LoopError("Execução encerrada pelo limite de loops.");
    if (!scheduled) {
      started = now();
      scheduled = true;
      // Reinicia somente quando o navegador volta a atender tarefas.
      scheduleReset(() => { iterations = 0; scheduled = false; });
    }
    iterations++;
    if (iterations > maxIterations ||
        (iterations % 256 === 0 && now() - started > maxDurationMs)) {
      aborted = true;
      const message = "Loop interrompido na linha " + line +
        ": limite de 1.000.000 de iterações ou 250 ms por tarefa atingido.";
      onLimit(message);
      throw new LoopError(message);
    }
  };
}
