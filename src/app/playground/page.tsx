"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Braces, Check, ChevronDown, ChevronRight, Code2, Eye, FileCode2, FileText, FolderOpen, Loader2, Monitor, Play, RotateCcw, ShieldCheck, Terminal } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type Language = { id: string; name: string };
type Tab = "html" | "css" | "javascript" | "source";
type MobilePanel = "files" | "editor" | "preview";
type Log = { id: string; tone: "normal" | "error" | "success"; text: string };
const WEB_LANGUAGE = "javascript";
const EXECUTABLE = new Set(["javascript", "typescript", "python", "java", "csharp", "go"]);
const DEFAULTS: Record<string, string> = {
  javascript: `const button = document.querySelector("#action");
button.addEventListener("click", () => console.log("Olá do JavaScript!"));
console.log("Preview carregado.");`,
  typescript: `type User = { name: string };
const user: User = { name: "ZulCode" };
console.log("Olá, " + user.name + "!");`,
  python: `name = "ZulCode"
print(f"Olá, {name}!")`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Olá, ZulCode!");
  }
}`,
  csharp: `using System;
public class MainClass {
  public static void Main() {
    Console.WriteLine("Olá, ZulCode!");
  }
}`,
  go: `package main
import "fmt"
func main() { fmt.Println("Olá, ZulCode!") }`,
};
const DEFAULT_HTML = `<main class="card"><span>PLAYGROUND</span><h1>Olá, ZulCode!</h1><p>Edite os arquivos e clique em Rodar.</p><button id="action">Testar console</button></main>`;
const DEFAULT_CSS = `* { box-sizing: border-box; } body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #0f172a; color: #f8fafc; font-family: Arial, sans-serif; } .card { width: min(390px, calc(100% - 32px)); padding: 28px; border: 1px solid #334155; border-radius: 20px; background: #172033; } span { color: #38bdf8; font-size: 12px; font-weight: 800; } p { color: #a5b4cf; } button { border: 0; border-radius: 10px; padding: 10px 14px; background: #2493ff; color: white; font-weight: 800; cursor: pointer; }`;

function createDocument(html: string, css: string, js: string, nonce: string) {
  const safeHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const code = JSON.stringify(js).replace(/</g, "\\u003c");
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><style>${safeCss}</style>${safeHtml}<script>(()=>{const n=${JSON.stringify(nonce)};const f=v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};const o=(tone,args)=>parent.postMessage({channel:'zulcode-playground',nonce:n,tone,text:args.map(f).join(' ')},'*');['log','info','warn','error'].forEach(k=>console[k]=(...a)=>o(k==='error'?'error':'normal',a));try{new Function(${code})();o('success',['Execução concluída.'])}catch(e){o('error',[e?.message||String(e)])}})();<\/script>`;
}

function Playground() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonce = useRef("");
  const languagePicker = useRef<HTMLDivElement>(null);
  const restoredDraft = useRef(false);
  const [languages, setLanguages] = useState<Language[]>([{ id: "javascript", name: "JavaScript" }, { id: "typescript", name: "TypeScript" }, { id: "python", name: "Python" }, { id: "java", name: "Java" }, { id: "csharp", name: "C#" }, { id: "go", name: "Go" }]);
  const [language, setLanguage] = useState("javascript");
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [source, setSource] = useState(DEFAULTS.javascript);
  const [preview, setPreview] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("editor");

  useEffect(() => { fetchComTimeout(`${API_BASE_URL}/languages`).then(r => r.ok ? r.json() : []).then(data => { if (Array.isArray(data)) setLanguages(data.filter(item => EXECUTABLE.has(item.id)).map(({ id, name }) => ({ id, name }))); }).catch(() => undefined); }, []);
  // Drafts are device-local, so they survive a closed app and airplane mode.
  useEffect(() => {
    try {
      const draft = localStorage.getItem("zulcode:playground-draft");
      if (!draft) return;
      const saved = JSON.parse(draft) as Partial<{ language: string; html: string; css: string; source: string }>;
      if (saved.language && EXECUTABLE.has(saved.language)) setLanguage(saved.language);
      if (typeof saved.html === "string") setHtml(saved.html);
      if (typeof saved.css === "string") setCss(saved.css);
      if (typeof saved.source === "string") setSource(saved.source);
      restoredDraft.current = true;
    } catch { /* invalid old draft: keep the safe defaults */ }
  }, []);
  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem("zulcode:playground-draft", JSON.stringify({ language, html, css, source })), 300);
    return () => clearTimeout(id);
  }, [language, html, css, source]);
  useEffect(() => { if (restoredDraft.current) { restoredDraft.current = false; return; } setSource(DEFAULTS[language] ?? ""); setTab(language === WEB_LANGUAGE ? "html" : "source"); setPreview(""); setLogs([]); }, [language]);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!languagePicker.current?.contains(event.target as Node)) setLanguageOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setLanguageOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.channel !== "zulcode-playground" || event.data?.nonce !== nonce.current) return;
      const tone: Log["tone"] = event.data.tone === "error" ? "error" : event.data.tone === "success" ? "success" : "normal";
      setLogs(current => [...current, { id: crypto.randomUUID(), tone, text: String(event.data.text ?? "") }].slice(-200));
      if (event.data.tone === "success" || event.data.tone === "error") { if (timeout.current) clearTimeout(timeout.current); setRunning(false); }
    };
    window.addEventListener("message", receive); return () => window.removeEventListener("message", receive);
  }, []);
  const run = useCallback(async () => {
    if (timeout.current) clearTimeout(timeout.current);
    setLogs([]); setRunning(true);
    if (language === WEB_LANGUAGE) {
      const id = crypto.randomUUID(); nonce.current = id; setPreview(createDocument(html, css, source, id));
      timeout.current = setTimeout(() => { if (nonce.current === id) { setPreview(""); setLogs([{ id: crypto.randomUUID(), tone: "error", text: "Execução interrompida após 3 segundos." }]); setRunning(false); } }, 3000);
      return;
    }
    if (!navigator.onLine) {
      setLogs([{ id: crypto.randomUUID(), tone: "error", text: "Este executor precisa de internet. Seu código foi salvo neste aparelho; JavaScript continua funcionando offline." }]);
      setRunning(false);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetchComTimeout(`${API_BASE_URL}/playground/execute`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ language, code: source }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Não foi possível executar esse código.");
      const output = [data.compile?.output, data.run?.output].filter(Boolean).join("\n");
      setLogs([{ id: crypto.randomUUID(), tone: data.run?.code && data.run.code !== 0 ? "error" : "success", text: output || "Execução concluída sem saída." }]);
    } catch (error) { setLogs([{ id: crypto.randomUUID(), tone: "error", text: error instanceof Error ? error.message : "Falha na execução." }]); }
    finally { setRunning(false); }
  }, [css, html, language, source]);
  const reset = () => { setHtml(DEFAULT_HTML); setCss(DEFAULT_CSS); setSource(DEFAULTS[language] ?? ""); setPreview(""); setLogs([]); setRunning(false); };
  const web = language === WEB_LANGUAGE;
  const extension = language === "python" ? "py" : language === "java" ? "java" : language === "go" ? "go" : language === "csharp" ? "cs" : language === "typescript" ? "ts" : "js";
  const files: { id: Tab; label: string; Icon: typeof FileCode2 }[] = web ? [{ id: "html", label: "index.html", Icon: FileCode2 }, { id: "css", label: "style.css", Icon: FileText }, { id: "javascript", label: "script.js", Icon: Braces }] : [{ id: "source", label: `main.${extension}`, Icon: FileCode2 }];
  const value = tab === "html" ? html : tab === "css" ? css : source;
  const change = (v: string) => tab === "html" ? setHtml(v) : tab === "css" ? setCss(v) : setSource(v);
  const selectedLanguage = languages.find(item => item.id === language)?.name ?? language;
  const selectFile = (file: Tab) => { setTab(file); setMobilePanel("editor"); };

  return <div className="flex h-full min-h-0 flex-col py-2 lg:py-3">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-border bg-card px-3 py-3 sm:px-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><Code2 className="size-4" /></span><div><h1 className="text-sm font-black text-foreground">Playground</h1><p className="hidden text-xs text-muted-foreground sm:block">Ambiente isolado para testar código</p></div></div><div className="flex items-center gap-2"><div ref={languagePicker} className="relative"><button type="button" onClick={() => setLanguageOpen(open => !open)} aria-haspopup="listbox" aria-expanded={languageOpen} className="zc-press flex min-w-28 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-black text-foreground shadow-sm transition-colors hover:border-primary/50"><span className="truncate">{selectedLanguage}</span><ChevronDown className={`size-3.5 shrink-0 text-primary transition-transform ${languageOpen ? "rotate-180" : ""}`} /></button>{languageOpen && <div role="listbox" aria-label="Escolher linguagem" className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl"><p className="px-2.5 pb-1.5 pt-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-muted-foreground">Linguagem</p>{languages.map(item => <button key={item.id} type="button" role="option" aria-selected={item.id === language} onClick={() => { setLanguage(item.id); setLanguageOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${item.id === language ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}><span>{item.name}</span>{item.id === language && <Check className="size-3.5" />}</button>)}</div>}</div><button onClick={reset} className="zc-press hidden rounded-lg border border-border p-2 text-muted-foreground sm:block" title="Restaurar"><RotateCcw className="size-4" /></button><button onClick={run} disabled={running} className="zc-press inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50">{running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />} Rodar</button></div></div>
    <div className="flex shrink-0 items-center gap-1 border-x border-border bg-card p-1.5 lg:hidden">
      {([{ id: "files", label: "Arquivos", Icon: FolderOpen }, { id: "editor", label: "Editor", Icon: Code2 }, { id: "preview", label: "Saída", Icon: Monitor }] as const).map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setMobilePanel(id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.68rem] font-black uppercase tracking-wide transition-colors ${mobilePanel === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><Icon className="size-3.5" />{label}</button>)}
    </div>
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-x border-b border-border bg-[#11141b] lg:grid-cols-[190px_minmax(0,1fr)_minmax(330px,.85fr)]">
      <aside className={`${mobilePanel === "files" ? "flex" : "hidden"} min-h-0 flex-col border-r border-white/10 bg-[#171a22] lg:flex`}><div className="flex items-center gap-2 border-b border-white/10 px-3 py-3 text-xs font-black text-slate-100"><FolderOpen className="size-4 text-sky-400" /> Arquivos</div><div className="p-2">{files.map(({ id, label, Icon }) => <button key={id} onClick={() => selectFile(id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-3 text-left text-xs font-bold ${tab === id ? "bg-primary/20 text-white" : "text-slate-400 hover:bg-white/5"}`}><Icon className="size-3.5 text-sky-400" />{label}</button>)}</div><div className="mt-auto border-t border-white/10 p-3 text-[10px] leading-relaxed text-slate-500"><ShieldCheck className="mb-1 size-4 text-emerald-400" />Execução limitada, sem acesso à rede ou aos dados do ZulCode.</div></aside>
      <section className={`${mobilePanel === "editor" ? "grid" : "hidden"} min-h-0 grid-rows-[42px_minmax(0,1fr)_minmax(130px,30%)] border-b border-white/10 lg:grid lg:grid-rows-[42px_minmax(0,1fr)_190px] lg:border-b-0 lg:border-r`}><div className="zc-scroll-hidden flex items-end gap-1 overflow-x-auto border-b border-white/10 bg-[#171a22] px-2">{files.map(({ id, label, Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex h-10 shrink-0 items-center gap-2 border-t-2 px-3 text-xs font-bold ${tab === id ? "border-primary bg-[#11141b] text-white" : "border-transparent text-slate-500"}`}><Icon className="size-3.5" />{label}</button>)}</div><textarea value={value} onChange={e => change(e.target.value)} spellCheck={false} className="zc-scroll-hidden min-h-0 w-full resize-none bg-[#11141b] p-3 font-mono text-[13px] leading-6 text-slate-100 outline-none sm:p-4" /><div className="flex min-h-0 flex-col border-t border-white/10 bg-[#0a0d13]"><div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-black text-slate-200"><Terminal className="size-3.5 text-emerald-400" /> Terminal</div><div className="zc-scroll-hidden min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-5">{logs.length ? logs.map(log => <p key={log.id} className={log.tone === "error" ? "text-red-400" : log.tone === "success" ? "text-emerald-400" : "text-slate-200"}><span className="mr-2 text-slate-600">›</span>{log.text}</p>) : <p className="text-slate-600">$ pronto para executar</p>}</div></div></section>
      <section className={`${mobilePanel === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col ${web && preview ? "bg-white" : "bg-card"} lg:flex`}><div className={`flex items-center gap-2 border-b px-3 py-2 text-xs font-bold ${web && preview ? "border-slate-200 bg-slate-100 text-slate-700" : "border-border bg-muted/40 text-foreground"}`}><ChevronRight className="size-3.5" /><span className={`rounded px-2 py-1 ${web && preview ? "bg-white" : "bg-background"}`}>Preview:/</span><span className="ml-auto flex items-center gap-1 text-emerald-500"><Monitor className="size-3.5" /> Web output</span></div>{web ? preview ? <iframe ref={iframe} title="Preview protegido" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview} className="min-h-0 flex-1" /> : <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground"><div><Eye className="mx-auto mb-2 size-7" />Clique em Rodar para ver o preview.</div></div> : <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted-foreground"><div><Terminal className="mx-auto mb-2 size-7" />{selectedLanguage} usa saída pelo terminal.</div></div>}</section>
    </div>
  </div>;
}

export default function PlaygroundPage() { useRequireAuth(); return <AppShell contentClassName="max-w-none" fixedContent><Playground /></AppShell>; }
