import type { ConsoleTone, ExecutionSnapshot } from "./executor";

/** Tempo máximo de uma execução. Passou disso, o worker é encerrado (laço infinito). */
const TEMPO_LIMITE_MS = 10_000;
/** O primeiro carregamento baixa o Python inteiro (uns 10 MB): espera mais. */
const TEMPO_LIMITE_PRIMEIRA_MS = 60_000;

const inicial = (): ExecutionSnapshot => ({ status: "idle", logs: [], preview: null });

type Mensagem =
  | { tipo: "pronto" }
  | { tipo: "saida" | "erro" | "falha"; id?: string; texto: string }
  | { tipo: "fim"; id: string };

/**
 * Roda Python no próprio aparelho (Pyodide, em `public/pyodide-worker.js`).
 *
 * Mesmo formato do executor de HTML/JS (estado, console, parar), sem prévia:
 * no modo Python o resultado é só o console. Parar ou estourar o tempo encerra
 * o worker; o próximo "Rodar" cria outro, e o navegador já tem o Python em cache.
 */
export class PythonExecutor {
  private snapshot = inicial();
  private ouvintes = new Set<() => void>();
  private worker: Worker | null = null;
  private pronto = false;
  private atual: string | null = null;
  private relogio: ReturnType<typeof setTimeout> | null = null;

  getSnapshot = () => this.snapshot;
  subscribe = (ouvinte: () => void) => {
    this.ouvintes.add(ouvinte);
    return () => { this.ouvintes.delete(ouvinte); };
  };

  private atualizar(parte: Partial<ExecutionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...parte };
    this.ouvintes.forEach((ouvinte) => ouvinte());
  }

  private registrar(tom: ConsoleTone, texto: string) {
    this.atualizar({ logs: [...this.snapshot.logs, { id: crypto.randomUUID(), tone: tom, text: texto.slice(0, 12000) }].slice(-200) });
  }

  private pararRelogio() {
    if (this.relogio) clearTimeout(this.relogio);
    this.relogio = null;
  }

  private encerrarWorker() {
    this.pararRelogio();
    this.worker?.terminate();
    this.worker = null;
    this.pronto = false;
    this.atual = null;
  }

  private garantirWorker() {
    if (this.worker) return this.worker;
    const worker = new Worker("/pyodide-worker.js");
    worker.onmessage = (evento: MessageEvent<Mensagem>) => this.receber(evento.data);
    worker.onerror = () => {
      this.encerrarWorker();
      this.atualizar({ status: "error" });
      this.registrar("error", "Não deu para carregar o Python. Confira a internet e tente de novo.");
    };
    this.worker = worker;
    return worker;
  }

  private receber(mensagem: Mensagem) {
    if (mensagem.tipo === "pronto") {
      this.pronto = true;
      return;
    }
    if ("id" in mensagem && mensagem.id && mensagem.id !== this.atual) return;
    if (mensagem.tipo === "saida") this.registrar("normal", mensagem.texto);
    else if (mensagem.tipo === "erro") this.registrar("warning", mensagem.texto);
    else if (mensagem.tipo === "falha") {
      this.pararRelogio();
      this.atual = null;
      this.pronto = true;
      this.registrar("error", mensagem.texto);
      this.atualizar({ status: "error" });
    } else if (mensagem.tipo === "fim") {
      this.pararRelogio();
      this.atual = null;
      this.pronto = true;
      this.atualizar({ status: "ready" });
    }
  }

  /** Começa a baixar o Python antes do primeiro "Rodar", para ele sair mais rápido. */
  preparar = () => {
    if (this.worker) return;
    this.garantirWorker().postMessage({ tipo: "preparar" });
  };

  /** Roda o arquivo `entrada`; os outros .py do projeto ficam disponíveis para import. */
  run = (arquivos: { nome: string; conteudo: string }[], entrada: string) => {
    if (this.snapshot.status === "running") return;
    const primeira = !this.pronto;
    const worker = this.garantirWorker();
    const id = crypto.randomUUID();
    this.atual = id;
    this.atualizar({ status: "running", logs: [], preview: null });
    if (primeira) this.registrar("normal", "Preparando o Python… (só na primeira vez)");
    worker.postMessage({ tipo: "rodar", id, arquivos, entrada });
    this.relogio = setTimeout(() => {
      if (this.atual !== id) return;
      this.encerrarWorker();
      this.atualizar({ status: "error" });
      this.registrar("error", primeira
        ? "O Python demorou demais para carregar. Confira a internet e rode de novo."
        : `O código passou de ${TEMPO_LIMITE_MS / 1000} segundos e foi parado (será que tem um laço infinito?).`);
    }, primeira ? TEMPO_LIMITE_PRIMEIRA_MS : TEMPO_LIMITE_MS);
  };

  stop = () => {
    const rodando = this.snapshot.status === "running";
    this.encerrarWorker();
    this.atualizar({ status: "stopped" });
    if (rodando) this.registrar("warning", "Execução interrompida.");
  };

  reset = () => {
    this.encerrarWorker();
    this.snapshot = inicial();
    this.ouvintes.forEach((ouvinte) => ouvinte());
  };

  clearLogs = () => { this.atualizar({ logs: [] }); };

  dispose = () => { this.encerrarWorker(); };
}
