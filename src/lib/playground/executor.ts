export type ExecutionStatus = "idle" | "running" | "ready" | "error" | "stopped";
export type ConsoleTone = "normal" | "warning" | "error" | "success";
export type ConsoleEntry = { id: string; tone: ConsoleTone; text: string };
export type ExecutionRequest = { language: string; files: Record<string, string> };
export type PreviewDescriptor = { id: string; url: string };
export type ExecutionSnapshot = {
  status: ExecutionStatus;
  logs: ConsoleEntry[];
  preview: PreviewDescriptor | null;
};
export interface PlaygroundExecutor {
  readonly capabilities: {
    languages: readonly string[];
    visualPreview: boolean;
    hardCancellation: boolean;
    loopChecks: boolean;
    stdin: boolean;
  };
  getSnapshot(): ExecutionSnapshot;
  subscribe(listener: () => void): () => void;
  run(request: ExecutionRequest): void;
  stop(): void;
  reset(): void;
  clearLogs(): void;
  dispose(): void;
}
