import { MAX_CODE_LENGTH, PLAYGROUND_CHANNEL, previewUrl, type WebFiles } from "../playground-preview";
import type { ConsoleTone, ExecutionRequest, ExecutionSnapshot, PlaygroundExecutor } from "./executor";

const STARTUP_TIMEOUT_MS = 5000;
const initialSnapshot = (): ExecutionSnapshot => ({ status: "idle", logs: [], preview: null });

export class IframeExecutor implements PlaygroundExecutor {
  readonly capabilities = {
    languages: ["javascript"] as const,
    visualPreview: true,
    hardCancellation: false,
    loopChecks: true,
    stdin: false,
  };
  private snapshot = initialSnapshot();
  private listeners = new Set<() => void>();
  private frame: HTMLIFrameElement | null = null;
  private active: { id: string; files: WebFiles } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private loads = 0;
  private booted = false;

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(next: Partial<ExecutionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach(listener => listener());
  }
  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  private invalidate() {
    this.clearTimer();
    this.active = null;
    this.booted = false;
    this.loads = 0;
  }
  private log(tone: ConsoleTone, text: string) {
    this.update({ logs: [...this.snapshot.logs, {
      id: crypto.randomUUID(), tone, text: text.slice(0, 12000),
    }].slice(-200) });
  }
  private fail(text: string) {
    this.invalidate();
    this.update({ status: "error", preview: null });
    this.log("error", text);
  }

  run = (request: ExecutionRequest) => {
    if (this.snapshot.status === "running") return;
    this.invalidate();
    this.update({ status: "running", logs: [], preview: null });
    try {
      if (!this.capabilities.languages.some(language => language === request.language)) {
        throw new Error("Este executor suporta somente HTML, CSS e JavaScript.");
      }
      const files: WebFiles = {
        html: request.files.html, css: request.files.css, javascript: request.files.javascript,
      };
      if (Object.values(files).some(source => typeof source !== "string" || source.length > MAX_CODE_LENGTH)) {
        throw new Error("Cada arquivo deve ser texto com até 100.000 caracteres.");
      }
      const id = crypto.randomUUID();
      const url = previewUrl(window.location.origin, id);
      this.active = { id, files };
      this.update({ preview: { id, url } });
      this.timer = setTimeout(() => {
        if (this.active?.id === id) this.fail(
          "O preview não iniciou em 5 segundos. Recarregue a página; se o problema persistir, confira a publicação de /playground-runtime/index.html.",
        );
      }, STARTUP_TIMEOUT_MS);
    } catch (error) {
      this.fail(error instanceof Error ? error.message : "Falha ao iniciar o preview.");
    }
  };

  // O React associa o elemento renderizado; código do aluno nunca entra no DOM do app.
  bindFrame = (frame: HTMLIFrameElement | null) => { this.frame = frame; };
  onFrameLoad = () => {
    if (!this.active || !this.frame || this.frame.getAttribute("src") !== this.snapshot.preview?.url) return;
    this.loads++;
    if (this.loads > 1) this.fail("O preview foi encerrado após uma navegação. Execute novamente.");
  };
  private receive = (event: MessageEvent) => {
    const active = this.active;
    if (!active || !this.frame?.contentWindow ||
        event.source !== this.frame.contentWindow || event.origin !== "null") return;
    const data: unknown = event.data;
    if (!data || typeof data !== "object") return;
    const message = data as Record<string, unknown>;
    if (message.channel !== PLAYGROUND_CHANNEL || message.runId !== active.id) return;
    if (message.type === "booted") {
      if (this.booted) return;
      this.booted = true;
      // A origem opaca do sandbox exige "*"; o destinatário é o iframe específico.
      this.frame.contentWindow.postMessage({
        channel: PLAYGROUND_CHANNEL, type: "run", runId: active.id, files: active.files,
      }, "*");
      return;
    }
    if (this.booted && message.type === "limit" && typeof message.text === "string") {
      this.fail(message.text);
      return;
    }
    if (!this.booted || typeof message.text !== "string" ||
        !["console", "ready", "error"].includes(String(message.type))) return;
    const tone: ConsoleTone = message.type === "error" ? "error"
      : message.type === "ready" ? "success"
        : message.tone === "error" || message.tone === "warning" ? message.tone : "normal";
    this.log(tone, message.text);
    if (message.type === "ready" || message.type === "error") {
      this.clearTimer();
      this.update({ status: message.type === "error" || this.snapshot.status === "error" ? "error" : "ready" });
    }
  };
  connect = () => {
    window.addEventListener("message", this.receive);
    return this.dispose;
  };
  stop = () => {
    this.invalidate();
    this.update({ preview: null, status: "stopped" });
  };
  reset = () => {
    this.invalidate();
    this.update(initialSnapshot());
  };
  clearLogs = () => { this.update({ logs: [] }); };
  dispose = () => {
    window.removeEventListener("message", this.receive);
    this.invalidate();
    this.frame = null;
    this.snapshot = initialSnapshot();
  };
}
