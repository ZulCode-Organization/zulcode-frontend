"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight, Code2, Copy, Download, ExternalLink, FileArchive, FilePlus2,
  FileText, FolderOpen, Globe, History, Library, Monitor, Palette, Pencil,
  Play, Save, Scissors, Search, Settings, Sparkles, Square, Terminal,
  TextCursorInput, Trash2, Type, Wand2, Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useMontado } from "@/hooks/use-montado";
import { useDivisao } from "@/hooks/use-divisao";
import { useConsultaDeMidia } from "@/hooks/use-consulta-de-midia";
import { usePlaygroundExecutor } from "@/hooks/usePlaygroundExecutor";
import { cn } from "@/lib/utils";
import {
  linguagemDe, MAX_ARQUIVOS, novoId, paraOPreview, projetoVazio,
} from "@/lib/playground/arquivos";
import { lerAjustes, salvarAjustes, FONTE_MAX, FONTE_MIN, type Ajustes } from "@/lib/playground/ajustes";
import { lerRascunho, salvarRascunho } from "@/lib/playground/rascunho";
import { lerEstadoEditor } from "@/lib/playground/estado-editor";
import { paleta, variaveisDaPaleta } from "@/lib/playground/temas";
import { formatar } from "@/lib/playground/formatar";
import { baixarHtml, baixarZip, copiarTudo } from "@/lib/playground/exportar";
import {
  abrirProjeto, criarProjeto, restaurarVersao, salvarProjeto,
} from "@/lib/playground/projetos";
import { CHAVE_PREVIEW_AVULSO } from "@/lib/playground/preview-avulso";
import type { Arquivo, Projeto } from "@/lib/playground/tipos";
import { EditorCodigo, type ApiEditor } from "@/components/playground/editor-codigo";
import { BarraDeTeclas } from "@/components/playground/barra-teclas";
import { BarraSuperior } from "@/components/playground/barra-superior";
import { BarraStatus, type EstadoDoSalvamento } from "@/components/playground/barra-status";
import { AbasArquivos } from "@/components/playground/abas-arquivos";
import { ConsolePlayground } from "@/components/playground/console-playground";
import { MolduraPreview } from "@/components/playground/moldura-preview";
import { Divisor } from "@/components/playground/divisor";
import { PaletaComandos, type Comando } from "@/components/playground/paleta-comandos";
import { DialogoArquivo } from "@/components/playground/dialogo-arquivo";
import { DialogoNome } from "@/components/playground/dialogo-nome";
import { PainelTemas } from "@/components/playground/painel-temas";
import { PainelAjustes } from "@/components/playground/painel-ajustes";
import { PainelBibliotecas } from "@/components/playground/painel-bibliotecas";
import { PainelProjetos } from "@/components/playground/painel-projetos";
import { PainelCompartilhar } from "@/components/playground/painel-compartilhar";
import { PainelSnippets } from "@/components/playground/painel-snippets";

/** O playground.
 *
 *  Layout mínimo: as abas dos arquivos, o código no centro, o resultado ao
 *  lado. Não há lateral nem barra de menus — tudo o que o programa faz passa
 *  pela paleta de comandos (Ctrl+K), e a barra de status embaixo mostra o que
 *  está acontecendo. A cor de toda a moldura vem da paleta do editor, então
 *  escolher Dracula pinta a tela inteira, não só o texto. */

type Painel =
  | null | "comandos" | "temas" | "ajustes" | "bibliotecas" | "projetos"
  | "compartilhar" | "snippets" | "arquivo" | "nome-projeto";

const ESPERA_PARA_RODAR = 700;
const ESPERA_DO_RASCUNHO = 500;
const ESPERA_DA_CONTA = 4000;

function Playground() {
  const executor = usePlaygroundExecutor();
  const { preview, logs, status, stop, clearLogs, bindFrame, onFrameLoad } = executor;

  // Os inicializadores leem localStorage. Só rodam aqui porque este componente
  // monta depois da hidratação — ver `useMontado` lá embaixo.
  const [projeto, setProjeto] = useState<Projeto>(() => lerRascunho());
  const [ajustes, setAjustes] = useState<Ajustes>(() => lerAjustes());
  const [ativoId, setAtivoId] = useState(() => projeto.arquivos[0]?.id ?? "");
  const [painel, setPainel] = useState<Painel>(null);
  const [renomeando, setRenomeando] = useState<Arquivo | null>(null);
  const [api, setApi] = useState<ApiEditor | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [salvamento, setSalvamento] = useState<EstadoDoSalvamento>({ tipo: "local" });
  const [sujo, setSujo] = useState(true);
  const [painelMovel, setPainelMovel] = useState<"codigo" | "preview" | "console">("codigo");

  const temConta = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  const ativo = projeto.arquivos.find((arquivo) => arquivo.id === ativoId) ?? projeto.arquivos[0];
  const linguagem = ativo ? linguagemDe(ativo.nome) : "javascript";
  const cores = paleta(ajustes.tema);
  const modoJs = projeto.modo === "js";

  // Um layout de cada vez, escolhido aqui e não por classe: com "lg:hidden" os
  // dois ramos montam, e dois editores de verdade disputariam o foco, a barra
  // de status e a barra de teclas.
  const noComputador = useConsultaDeMidia("(min-width: 1024px)");
  const colunas = useDivisao({ chave: "colunas", padrao: 0.55, eixo: "horizontal" });
  const linhas = useDivisao({ chave: "linhas", padrao: 0.62, eixo: "vertical", min: 0.2, max: 0.9 });
  // Desmontados aqui porque a caixa que o hook devolve carrega uma ref, e ler
  // propriedade dela no meio do JSX conta como mexer em ref na renderização.
  const {
    recipiente: caixaDasColunas, arrastando: arrastandoColunas,
    aoPegar: pegarColunas, aoTeclar: teclarColunas,
  } = colunas;
  const {
    recipiente: caixaDasLinhas, arrastando: arrastandoLinhas,
    aoPegar: pegarLinhas, aoTeclar: teclarLinhas,
  } = linhas;

  const mostrar = useCallback((texto: string, erro?: boolean) => {
    setAviso({ texto, erro });
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const relogio = window.setTimeout(() => setAviso(null), aviso.erro ? 6000 : 3000);
    return () => window.clearTimeout(relogio);
  }, [aviso]);

  // ---- rodar ----

  const rodar = useCallback(() => {
    executor.run({ files: paraOPreview(projeto) });
    setSujo(false);
    setPainelMovel(projeto.modo === "js" ? "console" : "preview");
  }, [executor, projeto]);

  // O valor inicial já serve; o efeito mantém a caixa em dia sem escrever em
  // ref durante a renderização.
  const projetoRef = useRef(projeto);
  useEffect(() => { projetoRef.current = projeto; });

  // Rodar sozinho. Um erro de escrita no arquivo aberto segura a execução: sem
  // isso, cada tecla no meio de uma linha incompleta encheria o console de
  // erro que a pessoa já está corrigindo.
  useEffect(() => {
    if (!ajustes.rodarSozinho || !sujo) return;
    const relogio = window.setTimeout(() => {
      if (lerEstadoEditor().erros > 0) return;
      executor.run({ files: paraOPreview(projetoRef.current) });
      setSujo(false);
    }, ESPERA_PARA_RODAR);
    return () => window.clearTimeout(relogio);
  }, [ajustes.rodarSozinho, sujo, projeto, executor]);

  // ---- guardar ----

  useEffect(() => {
    const relogio = window.setTimeout(() => {
      if (!salvarRascunho(projeto)) {
        mostrar("Não deu para guardar o rascunho neste aparelho. Copie seu código antes de sair.", true);
      }
    }, ESPERA_DO_RASCUNHO);
    return () => window.clearTimeout(relogio);
  }, [projeto, mostrar]);

  // Projeto que já vive na conta se salva sozinho, com folga maior que o
  // rascunho: cada gravação pode virar uma versão no histórico.
  useEffect(() => {
    const id = projeto.id;
    if (!id || !temConta) return;
    const relogio = window.setTimeout(() => {
      setSalvamento({ tipo: "salvando" });
      salvarProjeto(id, {
        nome: projeto.nome, modo: projeto.modo,
        arquivos: projeto.arquivos, bibliotecas: projeto.bibliotecas,
      })
        .then(() => setSalvamento({ tipo: "salvo", quando: Date.now() }))
        .catch((falha: unknown) => setSalvamento({
          tipo: "erro",
          mensagem: falha instanceof Error ? falha.message : "Não deu para salvar na conta.",
        }));
    }, ESPERA_DA_CONTA);
    return () => window.clearTimeout(relogio);
  }, [projeto, temConta]);

  // ---- mexer no projeto ----

  const mudarConteudo = useCallback((conteudo: string) => {
    setProjeto((atual) => ({
      ...atual,
      arquivos: atual.arquivos.map((arquivo) =>
        arquivo.id === ativoId ? { ...arquivo, conteudo } : arquivo),
    }));
    setSujo(true);
  }, [ativoId]);

  const criarArquivo = (nome: string) => {
    const arquivo: Arquivo = { id: novoId(), nome, conteudo: "" };
    setProjeto((atual) => ({ ...atual, arquivos: [...atual.arquivos, arquivo] }));
    setAtivoId(arquivo.id);
    setPainel(null);
    setSujo(true);
  };

  const renomearArquivo = (nome: string) => {
    const alvo = renomeando;
    if (!alvo) return;
    setProjeto((atual) => ({
      ...atual,
      arquivos: atual.arquivos.map((arquivo) =>
        arquivo.id === alvo.id ? { ...arquivo, nome } : arquivo),
    }));
    setRenomeando(null);
    setPainel(null);
    setSujo(true);
  };

  const apagarArquivo = (id: string) => {
    const alvo = projeto.arquivos.find((arquivo) => arquivo.id === id);
    if (!alvo || projeto.arquivos.length < 2) return;
    if (!window.confirm(`Apagar ${alvo.nome}?`)) return;
    setProjeto((atual) => ({
      ...atual,
      arquivos: atual.arquivos.filter((arquivo) => arquivo.id !== id),
    }));
    if (ativoId === id) {
      const sobrando = projeto.arquivos.filter((arquivo) => arquivo.id !== id);
      setAtivoId(sobrando[0]?.id ?? "");
    }
    setSujo(true);
  };

  /** A ordem das abas é a ordem em que os .css e os .js entram na página, então
   *  mover um arquivo é uma operação de verdade, não enfeite. */
  const moverArquivo = (direcao: -1 | 1) => {
    setProjeto((atual) => {
      const posicao = atual.arquivos.findIndex((arquivo) => arquivo.id === ativoId);
      const destino = posicao + direcao;
      if (posicao === -1 || destino < 0 || destino >= atual.arquivos.length) return atual;
      const arquivos = [...atual.arquivos];
      [arquivos[posicao], arquivos[destino]] = [arquivos[destino], arquivos[posicao]];
      return { ...atual, arquivos };
    });
    setSujo(true);
  };

  const alternarBiblioteca = (id: string) => {
    setProjeto((atual) => ({
      ...atual,
      bibliotecas: atual.bibliotecas.includes(id)
        ? atual.bibliotecas.filter((item) => item !== id)
        : [...atual.bibliotecas, id],
    }));
    setSujo(true);
  };

  const alternarModo = () => {
    setProjeto((atual) => ({ ...atual, modo: atual.modo === "web" ? "js" : "web" }));
    setSujo(true);
  };

  const mudarAjustes = useCallback((partes: Partial<Ajustes>) => {
    setAjustes((atual) => {
      const proximo = { ...atual, ...partes };
      salvarAjustes(proximo);
      return proximo;
    });
  }, []);

  // ---- projeto na conta ----

  const salvarNaConta = async () => {
    if (!temConta) return mostrar("Entre na sua conta para guardar projetos.", true);
    setSalvamento({ tipo: "salvando" });
    try {
      if (projeto.id) {
        await salvarProjeto(projeto.id, {
          nome: projeto.nome, modo: projeto.modo,
          arquivos: projeto.arquivos, bibliotecas: projeto.bibliotecas,
        });
      } else {
        const criado = await criarProjeto(projeto);
        setProjeto((atual) => ({ ...atual, id: criado.id }));
      }
      setSalvamento({ tipo: "salvo", quando: Date.now() });
      mostrar("Projeto guardado na sua conta.");
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : "Não deu para salvar.";
      setSalvamento({ tipo: "erro", mensagem });
      mostrar(mensagem, true);
    }
  };

  const abrir = async (id: string) => {
    try {
      const aberto = await abrirProjeto(id);
      setProjeto(aberto);
      setAtivoId(aberto.arquivos[0]?.id ?? "");
      setSalvamento({ tipo: "salvo", quando: Date.now() });
      setSujo(true);
      mostrar(`"${aberto.nome}" aberto.`);
    } catch (falha) {
      mostrar(falha instanceof Error ? falha.message : "Não deu para abrir.", true);
    }
  };

  const restaurar = async (versaoId: string) => {
    if (!projeto.id) return;
    try {
      const voltado = await restaurarVersao(projeto.id, versaoId);
      setProjeto(voltado);
      setAtivoId(voltado.arquivos[0]?.id ?? "");
      setSujo(true);
      mostrar("Versão restaurada. A anterior virou histórico também.");
    } catch (falha) {
      mostrar(falha instanceof Error ? falha.message : "Não deu para restaurar.", true);
    }
  };

  const novoProjeto = (modo: "web" | "js") => {
    const novo = projetoVazio(modo);
    setProjeto(novo);
    setAtivoId(novo.arquivos[0]?.id ?? "");
    setSalvamento({ tipo: "local" });
    setSujo(true);
  };

  // Quem remixou um projeto público chega por /playground?projeto=<id>. Lido do
  // endereço direto, e não por useSearchParams, para não exigir um limite de
  // Suspense numa página que já é toda do cliente.
  const jaAbriuPelaUrl = useRef(false);
  useEffect(() => {
    if (jaAbriuPelaUrl.current) return;
    jaAbriuPelaUrl.current = true;
    const pedido = new URLSearchParams(window.location.search).get("projeto");
    if (!pedido) return;
    // Tira o parâmetro antes de carregar: recarregar a página depois de salvar
    // não deve reabrir o projeto por cima do que está na tela.
    window.history.replaceState(null, "", "/playground");
    abrirProjeto(pedido)
      .then((aberto) => {
        setProjeto(aberto);
        setAtivoId(aberto.arquivos[0]?.id ?? "");
        setSalvamento({ tipo: "salvo", quando: Date.now() });
        mostrar(`"${aberto.nome}" aberto.`);
      })
      .catch((falha: unknown) => {
        mostrar(falha instanceof Error ? falha.message : "Não deu para abrir o projeto.", true);
      });
  }, [mostrar]);

  // ---- ferramentas do código ----

  const formatarAtivo = useCallback(async () => {
    if (!ativo) return;
    const resultado = await formatar(ativo.conteudo, linguagemDe(ativo.nome));
    if (resultado.tipo === "erro") {
      mostrar(resultado.mensagem, true);
      return;
    }
    if (resultado.codigo === ativo.conteudo) return mostrar("Já estava formatado.");
    setProjeto((atual) => ({
      ...atual,
      arquivos: atual.arquivos.map((arquivo) =>
        arquivo.id === ativo.id ? { ...arquivo, conteudo: resultado.codigo } : arquivo),
    }));
    setSujo(true);
    mostrar(`${ativo.nome} formatado.`);
  }, [ativo, mostrar]);

  /** Abre o resultado em outra aba sem sair do isolamento: a página de lá monta
   *  o mesmo iframe com origem opaca. Um blob na nossa origem rodaria o código
   *  do aluno com acesso ao token da conta. */
  const abrirPreviewFora = () => {
    try {
      sessionStorage.setItem(CHAVE_PREVIEW_AVULSO, JSON.stringify(projeto));
      window.open("/playground/visualizar", "_blank", "noopener");
    } catch {
      mostrar("O navegador não deixou abrir outra aba.", true);
    }
  };

  const exportarZip = () => { baixarZip(projeto); mostrar("Download do .zip começou."); };
  const exportarHtml = () => { baixarHtml(projeto); mostrar("Download do .html começou."); };
  const copiar = async () => {
    mostrar(await copiarTudo(projeto)
      ? "Código copiado."
      : "O navegador não deixou copiar.", false);
  };

  // ---- comandos ----

  const comandos = useMemo<Comando[]>(() => [
    { id: "rodar", secao: "Preview", titulo: "Rodar", atalho: "Ctrl Enter", Icone: Play, busca: "executar testar", executar: rodar },
    { id: "parar", secao: "Preview", titulo: "Encerrar o preview", Icone: Square, busca: "stop", executar: stop },
    {
      id: "sozinho", secao: "Preview", Icone: Zap,
      titulo: ajustes.rodarSozinho ? "Desligar o rodar sozinho" : "Ligar o rodar sozinho",
      busca: "automatico ao vivo live",
      executar: () => mudarAjustes({ rodarSozinho: !ajustes.rodarSozinho }),
    },
    { id: "fora", secao: "Preview", titulo: "Abrir o preview em outra aba", Icone: ExternalLink, executar: abrirPreviewFora },
    { id: "limpar", secao: "Preview", titulo: "Limpar o console", Icone: Terminal, executar: clearLogs },

    { id: "novo-arquivo", secao: "Arquivo", titulo: "Novo arquivo", Icone: FilePlus2, busca: "criar adicionar", executar: () => { setRenomeando(null); setPainel("arquivo"); } },
    { id: "renomear-arquivo", secao: "Arquivo", titulo: `Renomear ${ativo?.nome ?? "arquivo"}`, Icone: Pencil, executar: () => { setRenomeando(ativo ?? null); setPainel("arquivo"); } },
    { id: "apagar-arquivo", secao: "Arquivo", titulo: `Apagar ${ativo?.nome ?? "arquivo"}`, Icone: Trash2, busca: "remover excluir", executar: () => ativo && apagarArquivo(ativo.id) },
    { id: "mover-esquerda", secao: "Arquivo", titulo: "Mover a aba para a esquerda", Icone: ArrowLeftRight, detalhe: "muda a ordem de carregamento", executar: () => moverArquivo(-1) },
    { id: "mover-direita", secao: "Arquivo", titulo: "Mover a aba para a direita", Icone: ArrowLeftRight, detalhe: "muda a ordem de carregamento", executar: () => moverArquivo(1) },

    { id: "formatar", secao: "Código", titulo: "Formatar o arquivo", atalho: "Shift Alt F", Icone: Wand2, busca: "indentar arrumar organizar", executar: () => void formatarAtivo() },
    { id: "buscar", secao: "Código", titulo: "Procurar no arquivo", atalho: "Ctrl F", Icone: Search, busca: "substituir trocar", executar: () => api?.comando("buscar") },
    { id: "erro", secao: "Código", titulo: "Ir para o próximo erro", Icone: TextCursorInput, executar: () => api?.comando("erro") },
    { id: "snippets", secao: "Código", titulo: "Meus snippets", Icone: Scissors, busca: "atalho trecho", executar: () => setPainel("snippets") },
    { id: "bibliotecas", secao: "Código", titulo: "Bibliotecas", Icone: Library, detalhe: `${projeto.bibliotecas.length} ativa(s)`, busca: "cdn pacote confetti chart three", executar: () => setPainel("bibliotecas") },
    {
      id: "modo", secao: "Código", Icone: modoJs ? Monitor : Code2,
      titulo: modoJs ? "Mudar para modo página (HTML e CSS)" : "Mudar para modo só JavaScript",
      busca: "logica exercicio console html",
      executar: alternarModo,
    },

    { id: "salvar", secao: "Projeto", titulo: "Salvar na minha conta", atalho: "Ctrl S", Icone: Save, busca: "guardar", executar: () => void salvarNaConta() },
    { id: "projetos", secao: "Projeto", titulo: "Meus projetos", Icone: FolderOpen, busca: "abrir lista", executar: () => setPainel("projetos") },
    { id: "historico", secao: "Projeto", titulo: "Histórico de versões", Icone: History, busca: "voltar desfazer versao", executar: () => setPainel("projetos") },
    { id: "renomear-projeto", secao: "Projeto", titulo: "Renomear o projeto", Icone: Pencil, executar: () => setPainel("nome-projeto") },
    { id: "compartilhar", secao: "Projeto", titulo: "Compartilhar com um link", Icone: Globe, busca: "publico remix", executar: () => setPainel("compartilhar") },
    { id: "novo-web", secao: "Projeto", titulo: "Novo projeto de página", Icone: Sparkles, executar: () => novoProjeto("web") },
    { id: "novo-js", secao: "Projeto", titulo: "Novo exercício de JavaScript", Icone: Sparkles, executar: () => novoProjeto("js") },

    { id: "temas", secao: "Aparência", titulo: "Tema do código", Icone: Palette, detalhe: cores.nome, busca: "cor dracula monokai nord", executar: () => setPainel("temas") },
    { id: "ajustes", secao: "Aparência", titulo: "Ajustes do editor", Icone: Settings, busca: "fonte tabulacao emmet", executar: () => setPainel("ajustes") },
    { id: "maior", secao: "Aparência", titulo: "Aumentar a letra", Icone: Type, executar: () => mudarAjustes({ fonte: Math.min(FONTE_MAX, ajustes.fonte + 1) }) },
    { id: "menor", secao: "Aparência", titulo: "Diminuir a letra", Icone: Type, executar: () => mudarAjustes({ fonte: Math.max(FONTE_MIN, ajustes.fonte - 1) }) },

    { id: "zip", secao: "Exportar", titulo: "Baixar .zip com os arquivos", Icone: FileArchive, executar: exportarZip },
    { id: "html", secao: "Exportar", titulo: "Baixar um .html que roda sozinho", Icone: FileText, busca: "unico embutido", executar: exportarHtml },
    { id: "copiar", secao: "Exportar", titulo: "Copiar todo o código", Icone: Copy, executar: () => void copiar() },
    { id: "baixar-nada", secao: "Exportar", titulo: "Abrir em outra aba", Icone: Download, busca: "ver resultado", executar: abrirPreviewFora },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ajustes, ativo, api, cores.nome, modoJs, projeto, rodar, stop, clearLogs, formatarAtivo, mudarAjustes]);

  // Ctrl+K em qualquer lugar da tela, não só com o foco no editor.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setPainel((atual) => (atual === "comandos" ? null : "comandos"));
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const editor = ativo ? (
    <div className="zc-pg-fundo flex min-h-0 min-w-0 flex-1 flex-col">
      <EditorCodigo
        arquivoId={ativo.id}
        conteudo={ativo.conteudo}
        linguagem={linguagem}
        ajustes={ajustes}
        aoMudar={mudarConteudo}
        aoRodar={rodar}
        aoFormatar={() => void formatarAtivo()}
        aoAbrirPaleta={() => setPainel("comandos")}
        aoMontar={setApi}
      />
      {ajustes.barraDeTeclas && !noComputador && (
        <BarraDeTeclas api={api} linguagem={linguagem} />
      )}
    </div>
  ) : null;

  const painelDePreview = (
    <MolduraPreview
      preview={preview}
      status={status}
      bindFrame={bindFrame}
      onFrameLoad={onFrameLoad}
      aoAbrirFora={abrirPreviewFora}
      className="min-h-0"
    />
  );

  const painelDeConsole = (
    <ConsolePlayground logs={logs} rodando={status === "running"} aoLimpar={clearLogs} className="min-h-0" />
  );

  return (
    <div className="zc-pg flex h-full min-h-0 flex-col" style={variaveisDaPaleta(cores)}>
      <BarraSuperior
        nome={projeto.nome}
        sujo={sujo}
        rodando={status === "running"}
        rodarSozinho={ajustes.rodarSozinho}
        podeParar={!!preview}
        aoRenomear={() => setPainel("nome-projeto")}
        aoRodar={rodar}
        aoParar={stop}
        aoAlternarSozinho={() => mudarAjustes({ rodarSozinho: !ajustes.rodarSozinho })}
        aoAbrirPaleta={() => setPainel("comandos")}
      />

      <AbasArquivos
        arquivos={projeto.arquivos}
        ativoId={ativo?.id ?? ""}
        aoEscolher={setAtivoId}
        aoFechar={apagarArquivo}
        aoCriar={() => {
          if (projeto.arquivos.length >= MAX_ARQUIVOS) {
            return mostrar(`No máximo ${MAX_ARQUIVOS} arquivos por projeto.`, true);
          }
          setRenomeando(null);
          setPainel("arquivo");
        }}
        aoRenomear={(id) => {
          setRenomeando(projeto.arquivos.find((arquivo) => arquivo.id === id) ?? null);
          setPainel("arquivo");
        }}
      />

      {/* No celular um painel por vez: dividir 360px em três deixaria os três
          inúteis. */}
      {!noComputador && (
      <div className="zc-pg-barra zc-pg-borda flex shrink-0 border-b">
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
      )}

      {/* Os três painéis ficam montados e só um aparece. Desmontar seria mais
          limpo, mas o preview é quem executa o código: fora do DOM, o "rodar
          sozinho" dispararia para um iframe que não existe e o console
          encheria de "o preview não iniciou". Esconder também deixa a troca de
          aba instantânea e preserva o que estava rolado. */}
      {!noComputador && (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={cn("flex min-h-0 flex-col", painelMovel === "codigo" ? "flex-1" : "hidden")}>
          {editor}
        </div>
        <div className={cn(
          "flex min-h-0 flex-col",
          painelMovel === "preview" && !modoJs ? "flex-1" : "hidden",
        )}>
          {painelDePreview}
        </div>
        {painelMovel === "preview" && modoJs && (
          <div className="zc-pg-apagado grid flex-1 place-items-center p-6 text-center text-[0.78rem]">
            No modo só JavaScript o resultado sai no console.
          </div>
        )}
        <div className={cn("flex min-h-0 flex-col", painelMovel === "console" ? "flex-1" : "hidden")}>
          {painelDeConsole}
        </div>
      </div>
      )}

      {/* Monitor: código | resultado, com as divisões arrastáveis. */}
      {noComputador && (
      <div
        ref={caixaDasColunas}
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: "var(--pg-divisao, 55%) 1px minmax(0, 1fr)" }}
      >
        {editor}
        <Divisor
          eixo="horizontal"
          arrastando={arrastandoColunas}
          aoPegar={pegarColunas}
          aoTeclar={teclarColunas}
          rotulo="Largura do editor"
        />
        {modoJs ? (
          <div className="flex min-h-0 min-w-0 flex-col">
            {painelDeConsole}
            {/* Sem HTML na tela, mas o preview é quem roda o código e devolve
                o que aparece no console. */}
            <div className="hidden">{painelDePreview}</div>
          </div>
        ) : (
          <div
            ref={caixaDasLinhas}
            className="grid min-h-0 min-w-0"
            style={{ gridTemplateRows: "var(--pg-divisao, 62%) 1px minmax(0, 1fr)" }}
          >
            {painelDePreview}
            <Divisor
              eixo="vertical"
              arrastando={arrastandoLinhas}
              aoPegar={pegarLinhas}
              aoTeclar={teclarLinhas}
              rotulo="Altura do preview"
            />
            {painelDeConsole}
          </div>
        )}
      </div>
      )}

      <BarraStatus
        linguagem={linguagem}
        modo={projeto.modo}
        ajustes={ajustes}
        salvamento={salvamento}
        temConta={temConta}
        aoAbrirAjustes={() => setPainel("ajustes")}
        aoAbrirTemas={() => setPainel("temas")}
        aoIrParaErro={() => { setPainelMovel("codigo"); api?.comando("erro"); }}
        aoAlternarModo={alternarModo}
      />

      {aviso && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-12 z-40 flex justify-center px-4"
        >
          <p
            className={cn(
              "zc-pg-barra max-w-md rounded-md border px-3 py-2 text-[0.78rem] shadow-lg",
              aviso.erro ? "[border-color:var(--pg-erro)]" : "zc-pg-borda",
            )}
            style={{ color: aviso.erro ? "var(--pg-erro)" : "var(--pg-texto)" }}
          >
            {aviso.texto}
          </p>
        </div>
      )}

      {painel === "comandos" && (
        <PaletaComandos comandos={comandos} aoFechar={() => setPainel(null)} />
      )}
      {painel === "arquivo" && (
        <DialogoArquivo
          arquivos={projeto.arquivos}
          editando={renomeando}
          aoConfirmar={renomeando ? renomearArquivo : criarArquivo}
          aoFechar={() => { setPainel(null); setRenomeando(null); }}
        />
      )}
      {painel === "nome-projeto" && (
        <DialogoNome
          nome={projeto.nome}
          aoConfirmar={(nome) => {
            setProjeto((atual) => ({ ...atual, nome }));
            setPainel(null);
          }}
          aoFechar={() => setPainel(null)}
        />
      )}
      {painel === "temas" && (
        <PainelTemas
          temaAtual={ajustes.tema}
          aoEscolher={(tema) => mudarAjustes({ tema })}
          aoFechar={() => setPainel(null)}
        />
      )}
      {painel === "ajustes" && (
        <PainelAjustes ajustes={ajustes} aoMudar={mudarAjustes} aoFechar={() => setPainel(null)} />
      )}
      {painel === "bibliotecas" && (
        <PainelBibliotecas
          escolhidas={projeto.bibliotecas}
          aoAlternar={alternarBiblioteca}
          aoFechar={() => setPainel(null)}
        />
      )}
      {painel === "projetos" && (
        <PainelProjetos
          projetoAtual={projeto}
          temConta={temConta}
          aoAbrir={(id) => void abrir(id)}
          aoRestaurar={(versaoId) => void restaurar(versaoId)}
          aoFechar={() => setPainel(null)}
          aoAvisar={mostrar}
        />
      )}
      {painel === "compartilhar" && (
        <PainelCompartilhar
          projeto={projeto}
          aoMudarSlug={(slugPublico) => setProjeto((atual) => ({ ...atual, slugPublico }))}
          aoFechar={() => setPainel(null)}
        />
      )}
      {painel === "snippets" && <PainelSnippets aoFechar={() => setPainel(null)} />}
    </div>
  );
}

/** Enquanto o HTML vem do servidor não há como saber o tema nem o rascunho
 *  guardados. Em vez de piscar com o tema errado, a moldura vazia aparece com
 *  as cores do app. */
function Esqueleto() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="h-9 shrink-0 border-b border-border bg-card" />
      <div className="h-9 shrink-0 border-b border-border bg-card" />
      <div className="min-h-0 flex-1 bg-background" />
      <div className="h-7 shrink-0 border-t border-border bg-card" />
    </div>
  );
}

export default function PlaygroundPage() {
  useRequireAuth();
  const montado = useMontado();
  return (
    <AppShell contentClassName="max-w-none" fixedContent>
      {montado ? <Playground /> : <Esqueleto />}
    </AppShell>
  );
}
