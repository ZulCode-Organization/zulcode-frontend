"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Code2, Copy, GitFork, Loader2, Monitor, Terminal } from "lucide-react";
import { useMontado } from "@/hooks/use-montado";
import { usePlaygroundExecutor } from "@/hooks/usePlaygroundExecutor";
import { cn } from "@/lib/utils";
import { linguagemDe, paraOPreview } from "@/lib/playground/arquivos";
import { lerAjustes } from "@/lib/playground/ajustes";
import { paleta, variaveisDaPaleta } from "@/lib/playground/temas";
import { remixar, verPublico, type ProjetoPublico } from "@/lib/playground/projetos";
import type { Projeto } from "@/lib/playground/tipos";
import { EditorCodigo } from "@/components/playground/editor-codigo";
import { AbasArquivos } from "@/components/playground/abas-arquivos";
import { ConsolePlayground } from "@/components/playground/console-playground";
import { MolduraPreview } from "@/components/playground/moldura-preview";

/** A página de um projeto compartilhado.
 *
 *  Abre sem conta: é o que um link público significa. O código roda no mesmo
 *  iframe isolado do playground, com origem opaca — por isso é seguro executar
 *  código escrito por outra pessoa aqui.
 *
 *  Remixar leva uma cópia para a conta de quem abriu; o original não muda. */
function Publico({ slug }: { slug: string }) {
  const { preview, logs, status, bindFrame, onFrameLoad, run } = usePlaygroundExecutor();
  const [projeto, setProjeto] = useState<ProjetoPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ativoId, setAtivoId] = useState("");
  const [remixando, setRemixando] = useState(false);
  const [painelMovel, setPainelMovel] = useState<"codigo" | "preview" | "console">("preview");
  const [copiado, setCopiado] = useState(false);
  const ajustes = lerAjustes();
  const cores = paleta(ajustes.tema);
  const router = useRouter();

  useEffect(() => {
    let valeu = true;
    verPublico(slug)
      .then((aberto) => {
        if (!valeu) return;
        setProjeto(aberto);
        setAtivoId(aberto.arquivos[0]?.id ?? "");
        run({ files: paraOPreview({ ...aberto, id: null, slugPublico: slug }) });
      })
      .catch((falha: unknown) => {
        if (valeu) setErro(falha instanceof Error ? falha.message : "Não deu para abrir este link.");
      });
    return () => { valeu = false; };
    // Roda uma vez por link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const levarCopia = async () => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/welcome");
      return;
    }
    setRemixando(true);
    try {
      const copia: Projeto = await remixar(slug);
      // A cópia entra no playground pelo mesmo caminho de um projeto salvo.
      router.push(`/playground?projeto=${copia.id}`);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não deu para remixar.");
      setRemixando(false);
    }
  };

  const copiarCodigo = async () => {
    if (!projeto) return;
    try {
      await navigator.clipboard.writeText(projeto.arquivos
        .map((arquivo) => `/* ===== ${arquivo.nome} ===== */\n${arquivo.conteudo}`)
        .join("\n\n"));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setErro("O navegador não deixou copiar.");
    }
  };

  if (erro && !projeto) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold">{erro}</p>
          <Link href="/playground" className="mt-3 inline-block text-sm text-primary underline">
            Abrir o playground
          </Link>
        </div>
      </main>
    );
  }

  if (!projeto) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const ativo = projeto.arquivos.find((arquivo) => arquivo.id === ativoId) ?? projeto.arquivos[0];
  const editor = ativo ? (
    <EditorCodigo
      arquivoId={ativo.id}
      conteudo={ativo.conteudo}
      linguagem={linguagemDe(ativo.nome)}
      ajustes={ajustes}
      somenteLeitura
      aoMudar={() => {}}
      aoRodar={() => {}}
      aoFormatar={() => {}}
      aoAbrirPaleta={() => {}}
    />
  ) : null;

  return (
    <main className="zc-pg flex h-dvh min-h-0 flex-col" style={variaveisDaPaleta(cores)}>
      <header className="zc-pg-barra zc-pg-borda flex h-11 shrink-0 items-center gap-2 border-b px-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[0.85rem] font-bold">{projeto.nome}</h1>
          <p className="zc-pg-apagado truncate text-[0.68rem]">
            por {projeto.autor.nome} · somente leitura
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copiarCodigo()}
          className="zc-pg-botao zc-pg-borda h-7 border px-2 text-[0.72rem]"
        >
          <Copy className="size-3" />
          <span className="hidden sm:inline">{copiado ? "Copiado" : "Copiar"}</span>
        </button>
        <button
          type="button"
          onClick={() => void levarCopia()}
          disabled={remixando}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[0.75rem] font-bold text-white disabled:opacity-60"
          style={{ background: "var(--pg-acento)" }}
          title="Criar uma cópia na sua conta para editar"
        >
          {remixando ? <Loader2 className="size-3.5 animate-spin" /> : <GitFork className="size-3.5" />}
          Remixar
        </button>
      </header>

      {erro && (
        <p role="alert" className="zc-pg-erro zc-pg-borda shrink-0 border-b px-3 py-1.5 text-[0.72rem]">
          {erro}
        </p>
      )}

      <AbasArquivos
        arquivos={projeto.arquivos}
        ativoId={ativo?.id ?? ""}
        aoEscolher={setAtivoId}
        aoFechar={() => {}}
        aoCriar={() => {}}
        aoRenomear={() => {}}
      />

      <div className="zc-pg-barra zc-pg-borda flex shrink-0 border-b lg:hidden">
        {([
          ["codigo", "Código", Code2],
          ["preview", "Resultado", Monitor],
          ["console", "Console", Terminal],
        ] as const).map(([id, rotulo, Icone]) => (
          <button
            key={id}
            type="button"
            aria-pressed={painelMovel === id}
            onClick={() => setPainelMovel(id)}
            className="zc-pg-botao h-8 flex-1 gap-1.5 rounded-none text-[0.72rem]"
            style={painelMovel === id
              ? { borderBottom: "2px solid var(--pg-acento)", color: "var(--pg-acento)" }
              : { borderBottom: "2px solid transparent" }}
          >
            <Icone className="size-3.5" />
            {rotulo}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {painelMovel === "codigo" && editor}
        {painelMovel === "preview" && (
          <MolduraPreview
            preview={preview}
            status={status}
            bindFrame={bindFrame}
            onFrameLoad={onFrameLoad}
            aoAbrirFora={() => {}}
            className="min-h-0"
          />
        )}
        {painelMovel === "console" && (
          <ConsolePlayground logs={logs} rodando={status === "running"} aoLimpar={() => {}} className="min-h-0" />
        )}
      </div>

      <div className={cn("hidden min-h-0 flex-1 lg:grid", "lg:grid-cols-2")}>
        {editor}
        <div className="zc-pg-borda grid min-h-0 min-w-0 border-l" style={{ gridTemplateRows: "1fr 1px 34%" }}>
          <MolduraPreview
            preview={preview}
            status={status}
            bindFrame={bindFrame}
            onFrameLoad={onFrameLoad}
            aoAbrirFora={() => {}}
            className="min-h-0"
          />
          <div className="zc-pg-divisor zc-pg-divisor-h" />
          <ConsolePlayground logs={logs} rodando={status === "running"} aoLimpar={() => {}} className="min-h-0" />
        </div>
      </div>
    </main>
  );
}

export default function ProjetoPublicoPage() {
  const parametros = useParams<{ slug: string }>();
  const montado = useMontado();
  const slug = typeof parametros.slug === "string" ? parametros.slug : "";
  if (!montado) return <main className="min-h-dvh bg-background" />;
  return <Publico slug={slug} />;
}
