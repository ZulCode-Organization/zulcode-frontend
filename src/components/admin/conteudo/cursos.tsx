"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, BookOpen, FilePenLine, Layers, Plus } from "lucide-react";
import { Pagina } from "../shell";
import { Botao, Cabecalho, Entrada, Erro, Rotulo, Selo, Vazio } from "../ui";
import { Dialogo } from "../dialogo";
import { avisar } from "../avisos";
import { EscolhaDeLogo, LogoDoCurso } from "./logo";
import { usePerfil } from "@/hooks/use-perfil";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { slugDe } from "@/lib/admin/imagem";
import type { CursoDoAdmin } from "@/lib/admin/tipos";

/**
 * Os cursos, cada um com o tamanho e a saúde do conteúdo: quantas aulas têm
 * algum problema e quantas têm rascunho esperando publicação. Professores
 * veem só os cursos atribuídos a eles.
 */
export function ListaDeCursos() {
  const { perfil } = usePerfil();
  const ehAdmin = perfil?.role === "ADMIN";
  const { dados, erro, recarregar } = useDados<CursoDoAdmin[]>("/admin/conteudo/cursos");
  const [novo, setNovo] = useState(false);

  return (
    <Pagina>
      <Cabecalho
        titulo="Conteúdo"
        descricao="Cursos, seções, unidades e aulas. Abra um curso para ver a árvore inteira e editar as aulas."
        acoes={ehAdmin && <Botao variante="primario" icone={<Plus className="size-4" />} onClick={() => setNovo(true)}>Novo curso</Botao>}
      />
      {erro && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}
      {!dados ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : dados.length === 0 ? (
        <Vazio titulo={ehAdmin ? "Nenhum curso ainda" : "Nenhum curso atribuído a você"} icone={<BookOpen className="size-5" />}>
          {ehAdmin ? "Crie o primeiro curso para começar a montar as aulas." : "Peça a um administrador para te atribuir a um curso."}
        </Vazio>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dados.map((c) => (
            <Link key={c.id} href={`/admin/conteudo/${c.id}`} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3">
                <LogoDoCurso curso={c} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black group-hover:text-primary">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                  <div className="mt-1.5">{c.active ? <Selo tom="verde">No ar</Selo> : <Selo>Fora do ar</Selo>}</div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["Aulas", c.aulas], ["Questões", c.questoes], ["Alunos", c._count.userLanguages]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-muted/50 py-1.5">
                    <dd className="text-base font-black tabular-nums">{numero(v as number)}</dd>
                    <dt className="text-[0.68rem] font-bold text-muted-foreground">{k}</dt>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.comProblema > 0 && <Selo tom="ambar" icone={<AlertTriangle className="size-3" />}>{c.comProblema} {c.comProblema === 1 ? "aula com problema" : "aulas com problema"}</Selo>}
                {c.rascunhos > 0 && <Selo tom="roxo" icone={<FilePenLine className="size-3" />}>{c.rascunhos} {c.rascunhos === 1 ? "rascunho" : "rascunhos"}</Selo>}
                {c.comProblema === 0 && c.rascunhos === 0 && c.aulas > 0 && <Selo tom="verde">Tudo certo</Selo>}
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Layers className="size-3" />{numero(c._count.sections)} {c._count.sections === 1 ? "seção" : "seções"} · {numero(c._count.units)} {c._count.units === 1 ? "unidade" : "unidades"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {novo && <NovoCurso aoFechar={() => setNovo(false)} />}
    </Pagina>
  );
}

function NovoCurso({ aoFechar }: { aoFechar: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugMexido, setSlugMexido] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const slugFinal = slugMexido ? slug : slugDe(nome);

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Novo curso"
      descricao="O curso nasce fora do ar: só aparece para os alunos quando você ligar, depois de ter aulas."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!nome.trim() || !slugFinal}
            carregando={enviando}
            onClick={async () => {
              setEnviando(true);
              setErro("");
              try {
                const c = await pedir<{ id: string }>("/admin/conteudo/cursos", { method: "POST", json: { nome, slug: slugFinal, descricao, logoUrl: logo } });
                invalidar("/admin/conteudo/cursos");
                avisar("Curso criado.");
                router.push(`/admin/conteudo/${c.id}`);
              } catch (e) {
                setErro(e instanceof Error ? e.message : "Não foi possível criar.");
                setEnviando(false);
              }
            }}
          >
            Criar curso
          </Botao>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <EscolhaDeLogo valor={logo} nome={nome} aoMudar={setLogo} />
          <p className="text-xs text-muted-foreground">Logo quadrada. A imagem é recortada no centro e reduzida antes de enviar.</p>
        </div>
        <Rotulo texto="Nome"><Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Python" autoFocus maxLength={80} /></Rotulo>
        <Rotulo texto="Identificador" dica="Aparece no endereço do curso. Só letras minúsculas, números e hífens.">
          <Entrada value={slugFinal} onChange={(e) => { setSlugMexido(true); setSlug(slugDe(e.target.value)); }} className="font-mono" />
        </Rotulo>
        <Rotulo texto="Descrição"><Entrada value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que a pessoa vai aprender" maxLength={500} /></Rotulo>
        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}

