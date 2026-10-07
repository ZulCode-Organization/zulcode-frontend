"use client";

import { useEffect, useState } from "react";
import { Braces, Code2, Eye, FileCode2, FileText, FolderOpen, Loader2, Monitor, Play, RotateCcw, Square, Terminal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePlaygroundExecutor } from "@/hooks/usePlaygroundExecutor";
import type { ExecutionStatus as Status } from "@/lib/playground/executor";

type Tab = "html" | "css" | "javascript";
type MobilePanel = "files" | "editor" | "preview";
type Draft = { html: string; css: string; javascript: string; tab: Tab };
const DRAFT_KEY = "zulcode:playground-web-draft:v1";
const LEGACY_DRAFT_KEY = "zulcode:playground-draft";

const DEFAULT_DRAFT: Draft = {
  tab: "html",
  html: `<main class="card">
  <span>PLAYGROUND</span>
  <h1>Olá, ZulCode!</h1>
  <p>Edite os arquivos e clique em Rodar.</p>
  <button id="action">Testar console</button>
</main>`,
  css: `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: #0f172a;
  color: #f8fafc;
  font-family: Arial, sans-serif;
}
.card {
  width: min(390px, calc(100% - 32px));
  padding: 28px;
  border: 1px solid #334155;
  border-radius: 20px;
  background: #172033;
}
span { color: #38bdf8; font-size: 12px; font-weight: 800; }
p { color: #a5b4cf; }
button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: #2493ff;
  color: white;
  font-weight: 800;
  cursor: pointer;
}`,
  javascript: `const button = document.querySelector("#action");

button.addEventListener("click", () => {
  console.log("Olá do JavaScript!");
});

console.log("Preview carregado.");`,
};

const FILES = [
  { id: "html", label: "index.html", Icon: FileCode2 },
  { id: "css", label: "style.css", Icon: FileText },
  { id: "javascript", label: "script.js", Icon: Braces },
] as const;

const STATUS_LABELS: Record<Status, string> = {
  idle: "Pronto",
  running: "Executando…",
  ready: "Script executado",
  error: "Erro no preview",
  stopped: "Preview encerrado",
};

function Playground() {
  const { preview, logs, status, run: execute, stop, reset: resetExecution, clearLogs, bindFrame, onFrameLoad } = usePlaygroundExecutor();
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("editor");
  const running = status === "running";

  useEffect(() => {
    let disposed = false;

    queueMicrotask(() => {
      if (disposed) return;

      try {
        const raw = localStorage.getItem(DRAFT_KEY) ?? localStorage.getItem(LEGACY_DRAFT_KEY);
        if (raw) {
          const saved: unknown = JSON.parse(raw);
          if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
            throw new Error("Invalid draft");
          }
          const item = saved as Record<string, unknown>;
          const sources = item.sources && typeof item.sources === "object"
            ? item.sources as Record<string, unknown>
            : {};
          const javascript = typeof item.javascript === "string"
            ? item.javascript
            : item.language === "javascript" && typeof item.source === "string"
              ? item.source
              : sources.javascript;
          const tab: Tab = item.tab === "css" || item.tab === "javascript" ? item.tab : "html";

          setDraft({
            html: typeof item.html === "string" ? item.html : DEFAULT_DRAFT.html,
            css: typeof item.css === "string" ? item.css : DEFAULT_DRAFT.css,
            javascript: typeof javascript === "string" ? javascript : DEFAULT_DRAFT.javascript,
            tab,
          });
        }
      } catch {
        setStorageError("Não foi possível recuperar o rascunho. O exemplo padrão foi carregado.");
      } finally {
        setLoaded(true);
      }
    });

    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const save = () => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setStorageError(null);
      } catch {
        setStorageError("Não foi possível salvar neste aparelho. Copie seu código antes de sair.");
      }
    };

    const timer = setTimeout(save, 300);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [draft, loaded]);

  const run = () => {
    if (!loaded || running) return;
    execute({ language: "javascript", files: {
      html: draft.html, css: draft.css, javascript: draft.javascript,
    } });
    setMobilePanel("preview");
  };

  const reset = () => {
    resetExecution();
    setDraft(DEFAULT_DRAFT);
    setMobilePanel("editor");
  };

  const selectFile = (tab: Tab) => {
    setDraft(current => ({ ...current, tab }));
    setMobilePanel("editor");
  };

  const consoleOutput = (
    <div role="log" aria-live="polite" className="zc-selecionavel min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-5">
      {logs.length ? logs.map(log => (
        <pre key={log.id} className={`mb-2 whitespace-pre-wrap break-words ${
          log.tone === "error" ? "text-destructive"
            : log.tone === "warning" ? "text-amber-700 dark:text-amber-400"
              : log.tone === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
        }`}>{log.text}</pre>
      )) : <p className="text-muted-foreground">{running ? "Executando…" : "Pronto para executar."}</p>}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col py-2 lg:py-3">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-t-xl border border-border bg-card px-3 py-2">
        <h1 className="flex items-center gap-2 text-sm font-bold"><Code2 className="size-4 text-primary" />Playground</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">HTML / CSS / JavaScript</span>
          <button type="button" onClick={reset} disabled={!loaded} aria-label="Restaurar exemplo" title="Restaurar exemplo" className="rounded border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><RotateCcw className="size-4" /></button>
          <button type="button" onClick={stop} disabled={!preview} aria-label="Encerrar preview" title="Encerrar preview" className="rounded border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><Square className="size-4" /></button>
          <button type="button" onClick={run} disabled={running || !loaded} className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}{running ? "Executando" : "Rodar"}</button>
        </div>
      </header>

      {storageError && <p role="alert" className="shrink-0 px-3 py-2 text-xs text-destructive">{storageError}</p>}

      <nav aria-label="Painéis do playground" className="flex shrink-0 gap-1 border-x border-border bg-card p-1 lg:hidden">
        {([{ id: "files", label: "Arquivos", Icon: FolderOpen }, { id: "editor", label: "Editor", Icon: Code2 }, { id: "preview", label: "Saída", Icon: Monitor }] as const).map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-pressed={mobilePanel === id} onClick={() => setMobilePanel(id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-2 text-xs ${mobilePanel === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><Icon className="size-3.5" />{label}</button>
        ))}
      </nav>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-x border-b border-border bg-background lg:grid-cols-[150px_minmax(0,1fr)_minmax(280px,.85fr)]">
        <aside className={`${mobilePanel === "files" ? "flex" : "hidden"} min-h-0 flex-col border-r border-border bg-card lg:flex`}>
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3 text-xs font-bold"><FolderOpen className="size-4 text-primary" />Arquivos</div>
          <div className="p-2">{FILES.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => selectFile(id)} className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs ${draft.tab === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}><Icon className="size-3.5 shrink-0" />{label}</button>
          ))}</div>
          <p className="mt-auto border-t border-border p-3 text-[10px] leading-4 text-muted-foreground">Preview executado no navegador. Edite o JavaScript em script.js.</p>
        </aside>

        <section aria-label="Editor e console" className={`${mobilePanel === "editor" ? "grid" : "hidden"} min-h-0 min-w-0 grid-rows-[40px_minmax(0,1fr)_minmax(100px,28%)] border-r border-border lg:grid`}>
          <div className="flex items-end overflow-x-auto border-b border-border bg-card">{FILES.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={draft.tab === id} onClick={() => selectFile(id)} className={`h-10 shrink-0 border-t-2 px-3 text-xs ${draft.tab === id ? "border-primary bg-background text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>
          ))}</div>
          <textarea
            aria-label={`Código de ${FILES.find(file => file.id === draft.tab)?.label}`}
            value={draft[draft.tab]}
            onChange={event => {
              const value = event.target.value;
              setDraft(current => ({ ...current, [current.tab]: value }));
            }}
            onKeyDown={event => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                run();
              }
            }}
            disabled={!loaded}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="min-h-0 w-full resize-none bg-background p-3 font-mono text-[13px] leading-6 text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          />
          <div className="flex min-h-0 flex-col border-t border-border bg-muted/35">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 text-xs font-bold"><Terminal className="size-3.5 text-primary" />Console<button type="button" onClick={clearLogs} aria-label="Limpar console" title="Limpar console" className="ml-auto rounded p-1 hover:bg-muted"><Trash2 className="size-3.5" /></button></div>
            {consoleOutput}
          </div>
        </section>

        <section aria-label="Preview web" className={`${mobilePanel === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-card lg:flex`}>
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3 text-xs"><Eye className="size-3.5" /><span className="font-bold">Preview</span><span role="status" className={`ml-auto ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>{STATUS_LABELS[status]}</span></div>
          {preview ? (
            <iframe key={preview.id} ref={bindFrame} title="Preview de HTML, CSS e JavaScript" sandbox="allow-scripts" referrerPolicy="no-referrer" src={preview.url} onLoad={onFrameLoad} className="min-h-0 w-full flex-1 border-0" />
          ) : (
            <div className="grid min-h-0 flex-1 place-items-center p-4 text-center text-sm text-muted-foreground">Clique em Rodar para carregar o preview.</div>
          )}
          <div className="flex h-36 shrink-0 flex-col border-t border-border lg:hidden"><div className="shrink-0 px-3 py-1 text-xs font-bold">Console</div>{consoleOutput}</div>
        </section>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-none" fixedContent><Playground /></AppShell>;
}