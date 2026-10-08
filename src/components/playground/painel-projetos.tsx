"use client";

import { useEffect, useState } from "react";
import {
  Copy, FileCode2, History, Loader2, RotateCcw, Share2, Trash2,
} from "lucide-react";
import {
  apagarProjeto, duplicarProjeto, listarProjetos, listarVersoes,
} from "@/lib/playground/projetos";
import type { Projeto, ProjetoResumo, Versao } from "@/lib/playground/tipos";
import { Dialogo, LinhaPainel } from "./dialogo";

/** Os projetos da conta e o histórico do que está aberto.
 *
 *  As duas coisas moram no mesmo painel porque respondem à mesma pergunta —
 *  "onde está aquele código que eu tinha?" — e a resposta pode ser outro
 *  projeto ou outro momento deste. */

function quando(iso: string) {
  const data = new Date(iso);
  const minutos = Math.round((Date.now() - data.getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function tamanho(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}

export function PainelProjetos({
  projetoAtual, temConta, aoAbrir, aoRestaurar, aoFechar, aoAvisar,
}: {
  projetoAtual: Projeto;
  temConta: boolean;
  aoAbrir: (id: string) => void;
  aoRestaurar: (versaoId: string) => void;
  aoFechar: () => void;
  aoAvisar: (mensagem: string, erro?: boolean) => void;
}) {
  const [aba, setAba] = useState<"projetos" | "versoes">("projetos");
  const [projetos, setProjetos] = useState<ProjetoResumo[] | null>(null);
  // Guardado junto do projeto a que pertence: assim trocar de projeto mostra
  // "carregando" sem precisar limpar o estado dentro do efeito.
  const [versoes, setVersoes] = useState<{ para: string; lista: Versao[] } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erroDaRede, setErroDaRede] = useState<string | null>(null);

  const erro = temConta ? erroDaRede : "Entre na sua conta para guardar e abrir projetos.";
  const listaDeVersoes = versoes && versoes.para === projetoAtual.id ? versoes.lista : null;

  useEffect(() => {
    if (!temConta) return;
    let valeu = true;
    listarProjetos()
      .then((lista) => { if (valeu) setProjetos(lista); })
      .catch((falha: unknown) => {
        if (valeu) {
          setErroDaRede(falha instanceof Error ? falha.message : "Não deu para listar seus projetos.");
        }
      });
    return () => { valeu = false; };
  }, [temConta]);

  useEffect(() => {
    const id = projetoAtual.id;
    if (aba !== "versoes" || !id) return;
    let valeu = true;
    listarVersoes(id)
      .then((lista) => { if (valeu) setVersoes({ para: id, lista }); })
      .catch(() => { if (valeu) setVersoes({ para: id, lista: [] }); });
    return () => { valeu = false; };
  }, [aba, projetoAtual.id]);

  const duplicar = async (id: string) => {
    setOcupado(id);
    try {
      const copia = await duplicarProjeto(id);
      setProjetos((atual) => atual && [{
        id: copia.id!, nome: copia.nome, modo: copia.modo,
        slugPublico: copia.slugPublico, atualizadoEm: new Date().toISOString(),
      }, ...atual]);
      aoAvisar(`"${copia.nome}" criado.`);
    } catch (falha) {
      aoAvisar(falha instanceof Error ? falha.message : "Não deu para duplicar.", true);
    } finally {
      setOcupado(null);
    }
  };

  const apagar = async (projeto: ProjetoResumo) => {
    // Apagar projeto é a única ação aqui que não dá para desfazer.
    if (!window.confirm(`Apagar "${projeto.nome}"? O histórico de versões vai com ele.`)) return;
    setOcupado(projeto.id);
    try {
      await apagarProjeto(projeto.id);
      setProjetos((atual) => atual && atual.filter((item) => item.id !== projeto.id));
      aoAvisar(`"${projeto.nome}" apagado.`);
    } catch (falha) {
      aoAvisar(falha instanceof Error ? falha.message : "Não deu para apagar.", true);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Dialogo
      titulo="Meus projetos"
      descricao={projetoAtual.id
        ? `Aberto agora: ${projetoAtual.nome}`
        : "O que está na tela ainda não foi guardado na conta."}
      aoFechar={aoFechar}
    >
      <div className="zc-pg-borda flex shrink-0 border-b">
        {([["projetos", "Projetos"], ["versoes", "Histórico"]] as const).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={aba === valor}
            onClick={() => setAba(valor)}
            className="zc-pg-botao h-8 flex-1 rounded-none text-[0.75rem] font-bold"
            style={aba === valor
              ? { borderBottom: "2px solid var(--pg-acento)", color: "var(--pg-acento)" }
              : { borderBottom: "2px solid transparent" }}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "projetos" ? (
        erro ? (
          <p className="zc-pg-apagado px-3 py-6 text-center text-[0.78rem]">{erro}</p>
        ) : projetos === null ? (
          <p className="zc-pg-apagado flex items-center justify-center gap-2 px-3 py-6 text-[0.78rem]">
            <Loader2 className="size-3.5 animate-spin" /> Carregando…
          </p>
        ) : projetos.length === 0 ? (
          <p className="zc-pg-apagado px-3 py-6 text-center text-[0.78rem]">
            Nenhum projeto guardado ainda. Use Ctrl+K → Salvar projeto.
          </p>
        ) : (
          projetos.map((projeto) => (
            <LinhaPainel key={projeto.id} ativo={projeto.id === projetoAtual.id}>
              <button
                type="button"
                onClick={() => { aoFechar(); aoAbrir(projeto.id); }}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <FileCode2 className="zc-pg-apagado size-3.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{projeto.nome}</span>
                  <span className="zc-pg-apagado block text-[0.68rem]">
                    {projeto.modo === "js" ? "JavaScript" : "página"} · {quando(projeto.atualizadoEm)}
                    {projeto.slugPublico && " · público"}
                  </span>
                </span>
              </button>
              {projeto.slugPublico && <Share2 className="zc-pg-acento size-3 shrink-0" />}
              <button
                type="button"
                onClick={() => void duplicar(projeto.id)}
                disabled={ocupado === projeto.id}
                aria-label={`Duplicar ${projeto.nome}`}
                title="Duplicar"
                className="zc-pg-botao size-6 shrink-0"
              >
                {ocupado === projeto.id ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
              </button>
              <button
                type="button"
                onClick={() => void apagar(projeto)}
                disabled={ocupado === projeto.id}
                aria-label={`Apagar ${projeto.nome}`}
                title="Apagar"
                className="zc-pg-botao size-6 shrink-0"
              >
                <Trash2 className="size-3" />
              </button>
            </LinhaPainel>
          ))
        )
      ) : !projetoAtual.id ? (
        <p className="zc-pg-apagado px-3 py-6 text-center text-[0.78rem]">
          O histórico começa quando o projeto é guardado na conta.
        </p>
      ) : listaDeVersoes === null ? (
        <p className="zc-pg-apagado flex items-center justify-center gap-2 px-3 py-6 text-[0.78rem]">
          <Loader2 className="size-3.5 animate-spin" /> Carregando…
        </p>
      ) : listaDeVersoes.length === 0 ? (
        <p className="zc-pg-apagado px-3 py-6 text-center text-[0.78rem]">
          Ainda não há versões anteriores. Uma foto é guardada a cada poucos
          minutos de trabalho.
        </p>
      ) : (
        <>
          {listaDeVersoes.map((versao) => (
            <LinhaPainel key={versao.id}>
              <History className="zc-pg-apagado size-3.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block">{quando(versao.criadoEm)}</span>
                <span className="zc-pg-apagado block text-[0.68rem]">
                  {new Date(versao.criadoEm).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })} · {tamanho(versao.bytes)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => { aoFechar(); aoRestaurar(versao.id); }}
                className="zc-pg-botao zc-pg-borda h-7 shrink-0 border px-2 text-[0.7rem]"
              >
                <RotateCcw className="size-3" /> Voltar para esta
              </button>
            </LinhaPainel>
          ))}
          <p className="zc-pg-apagado zc-pg-borda border-t px-3 py-2.5 text-[0.68rem] leading-4">
            Voltar para uma versão também guarda a atual, então um restauro
            errado pode ser desfeito.
          </p>
        </>
      )}
    </Dialogo>
  );
}
