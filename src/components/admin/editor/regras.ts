import type { Problema, QuestaoDoRascunho, RascunhoDaAula, TipoDeQuestao } from "@/lib/admin/tipos";

/**
 * As regras do editor no navegador.
 *
 * A conferência aqui é um espelho da do servidor (backend/src/admin/editor/
 * aula.ts): serve para mostrar os problemas enquanto a pessoa digita, sem
 * esperar o salvamento. Quem decide de verdade se pode publicar é o servidor,
 * que confere de novo.
 */

export const MAX_ETAPAS = 10;

export const TIPOS: { tipo: TipoDeQuestao; nome: string; descricao: string }[] = [
  { tipo: "MULTIPLE_CHOICE", nome: "Alternativa", descricao: "De 2 a 6 opções, uma certa" },
  { tipo: "TRUE_FALSE", nome: "Verdadeiro ou falso", descricao: "Uma afirmação para julgar" },
  { tipo: "FILL_BLANK", nome: "Completar o código", descricao: "Um espaço no código e blocos para encaixar" },
  { tipo: "CODE_ORDER", nome: "Escrever código", descricao: "A pessoa escreve e roda; acerta quando o console.log imprime o esperado" },
];

export const nomeDoTipo = (t: TipoDeQuestao) => TIPOS.find((x) => x.tipo === t)?.nome ?? t;

/** O nome de cada etapa como o aluno vê: aulas de duas etapas têm Teoria e Revisão. */
export function nomeDaEtapa(etapa: number, total: number) {
  if (total === 2) return etapa === 1 ? "Teoria" : "Revisão";
  return `Etapa ${etapa}`;
}

export const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function novaQuestao(tipo: TipoDeQuestao, etapa: number): QuestaoDoRascunho {
  const base = { id: novoId(), tipo, etapa, enunciado: "" };
  if (tipo === "TRUE_FALSE") return { ...base, verdadeiro: true };
  if (tipo === "FILL_BLANK") return { ...base, codigoAntes: "", codigoDepois: "", blocos: ["", ""], correta: 0 };
  if (tipo === "CODE_ORDER") return { ...base, codigoInicial: "", resultadoEsperado: "", dica: "" };
  return { ...base, alternativas: ["", "", "", ""], correta: 0 };
}

/**
 * Troca o tipo de uma questão aproveitando o que der: o enunciado sempre fica,
 * as alternativas viram blocos (e vice-versa), e a certa continua certa.
 */
export function converterTipo(q: QuestaoDoRascunho, tipo: TipoDeQuestao): QuestaoDoRascunho {
  if (q.tipo === tipo) return q;
  const nova = { ...novaQuestao(tipo, q.etapa), id: q.id, enunciado: q.enunciado };
  if (tipo === "FILL_BLANK" && q.alternativas?.length) return { ...nova, blocos: q.alternativas.slice(0, 8), correta: q.correta ?? 0 };
  if (tipo === "MULTIPLE_CHOICE" && q.blocos?.length) return { ...nova, alternativas: q.blocos.slice(0, 6), correta: q.correta ?? 0 };
  if (tipo === "MULTIPLE_CHOICE" && q.tipo === "TRUE_FALSE") return { ...nova, alternativas: ["Verdadeiro", "Falso"], correta: q.verdadeiro === false ? 1 : 0 };
  return nova;
}

/** Repetição só entre o que foi preenchido: as vazias já têm a própria mensagem. */
const temRepetidas = (lista: string[]) => {
  const cheias = lista.filter(Boolean);
  return new Set(cheias).size !== cheias.length;
};

export function conferir(r: RascunhoDaAula): Problema[] {
  const p: Problema[] = [];
  if (!r.titulo?.trim()) p.push({ nivel: "erro", texto: "A aula está sem título." });
  if (!(r.etapas >= 1 && r.etapas <= MAX_ETAPAS)) p.push({ nivel: "erro", texto: `A aula precisa ter de 1 a ${MAX_ETAPAS} etapas.` });
  if (!(r.xp >= 0 && r.xp <= 1000)) p.push({ nivel: "erro", texto: "O XP da aula vai de 0 a 1000." });
  for (let etapa = 1; etapa <= r.etapas; etapa++) {
    if (!r.questoes.some((q) => q.etapa === etapa)) p.push({ nivel: "erro", texto: `${nomeDaEtapa(etapa, r.etapas)} não tem nenhuma questão.`, etapa });
  }
  if (!r.introducao.length || !r.introducao.some((s) => s.texto?.trim())) {
    p.push({ nivel: "aviso", texto: "A aula não tem explicação inicial: o aluno vai direto para as questões." });
  }
  r.introducao.forEach((s, i) => {
    if (!s.titulo?.trim() && !s.texto?.trim()) p.push({ nivel: "aviso", texto: `O slide ${i + 1} da introdução está vazio.` });
  });

  ordenadas(r).forEach((q, i) => {
    const onde = { questaoId: q.id, etapa: q.etapa };
    const n = `Questão ${i + 1}`;
    if (!(q.etapa >= 1 && q.etapa <= r.etapas)) p.push({ nivel: "erro", texto: `${n}: está numa etapa que não existe.`, ...onde });
    if (!q.enunciado?.trim()) p.push({ nivel: "erro", texto: `${n}: sem enunciado.`, ...onde });
    if (q.tipo === "MULTIPLE_CHOICE") {
      const alts = (q.alternativas ?? []).map((a) => a.trim());
      if (alts.length < 2) p.push({ nivel: "erro", texto: `${n}: precisa de pelo menos 2 alternativas.`, ...onde });
      if (alts.some((a) => !a)) p.push({ nivel: "erro", texto: `${n}: tem alternativa vazia.`, ...onde });
      if (temRepetidas(alts.map((a) => a.toLowerCase()))) p.push({ nivel: "erro", texto: `${n}: tem alternativas repetidas.`, ...onde });
      if (!(typeof q.correta === "number" && q.correta >= 0 && q.correta < alts.length)) p.push({ nivel: "erro", texto: `${n}: sem a alternativa certa marcada.`, ...onde });
    }
    if (q.tipo === "TRUE_FALSE" && typeof q.verdadeiro !== "boolean") p.push({ nivel: "erro", texto: `${n}: sem a resposta marcada.`, ...onde });
    if (q.tipo === "FILL_BLANK") {
      const blocos = (q.blocos ?? []).map((b) => b.trim());
      if (!q.codigoAntes?.trim() && !q.codigoDepois?.trim()) p.push({ nivel: "erro", texto: `${n}: sem o código em volta do espaço.`, ...onde });
      if (blocos.length < 2) p.push({ nivel: "erro", texto: `${n}: precisa de pelo menos 2 blocos.`, ...onde });
      if (blocos.some((b) => !b)) p.push({ nivel: "erro", texto: `${n}: tem bloco vazio.`, ...onde });
      if (temRepetidas(blocos)) p.push({ nivel: "erro", texto: `${n}: tem blocos repetidos.`, ...onde });
      if (!(typeof q.correta === "number" && q.correta >= 0 && q.correta < blocos.length)) p.push({ nivel: "erro", texto: `${n}: sem o bloco certo marcado.`, ...onde });
    }
    if (q.tipo === "CODE_ORDER") {
      if (!q.resultadoEsperado?.trim()) p.push({ nivel: "erro", texto: `${n}: sem o resultado que o código precisa imprimir.`, ...onde });
      if (!q.dica?.trim()) p.push({ nivel: "aviso", texto: `${n}: sem dica.`, ...onde });
    }
  });
  return p;
}

/** As questões na ordem em que o aluno vê: por etapa, e dentro dela, na ordem do editor. */
export function ordenadas(r: RascunhoDaAula) {
  return [...r.questoes].map((q, i) => ({ q, i })).sort((a, b) => a.q.etapa - b.q.etapa || a.i - b.i).map((x) => x.q);
}

/**
 * Lê perguntas coladas como texto.
 *
 *   Quanto é 2 + 2?
 *   - 3
 *   * 4
 *
 * Uma linha em branco separa as perguntas; a primeira linha é o enunciado;
 * "*" marca a certa e "-" as erradas. Duas opções "Verdadeiro" e "Falso"
 * viram uma questão de verdadeiro ou falso. Pergunta sem opção nenhuma é
 * devolvida como problema, e não descartada em silêncio.
 */
export function lerPerguntasColadas(texto: string, etapa: number) {
  const blocos = texto.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const questoes: QuestaoDoRascunho[] = [];
  const problemas: string[] = [];
  blocos.forEach((bloco, i) => {
    const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);
    const enunciado: string[] = [];
    const opcoes: { texto: string; certa: boolean }[] = [];
    for (const l of linhas) {
      const m = l.match(/^([*\-+]|\d+[.)]|[a-fA-F][.)])\s+(.*)$/);
      if (m && (opcoes.length || enunciado.length)) {
        const certa = m[1] === "*" || m[1] === "+";
        opcoes.push({ texto: m[2].replace(/\s*\(certa\)\s*$/i, ""), certa: certa || /\(certa\)\s*$/i.test(m[2]) });
      } else if (!opcoes.length) enunciado.push(l);
    }
    const n = `Pergunta ${i + 1}`;
    if (!enunciado.length) return problemas.push(`${n}: sem enunciado.`);
    if (opcoes.length < 2) return problemas.push(`${n}: precisa de pelo menos 2 opções.`);
    const certas = opcoes.filter((o) => o.certa).length;
    if (certas !== 1) return problemas.push(`${n}: marque exatamente uma opção certa com "*".`);
    const nomes = opcoes.map((o) => o.texto.toLowerCase());
    if (opcoes.length === 2 && nomes.includes("verdadeiro") && nomes.includes("falso")) {
      questoes.push({ id: novoId(), tipo: "TRUE_FALSE", etapa, enunciado: enunciado.join("\n"), verdadeiro: opcoes.find((o) => o.certa)!.texto.toLowerCase() === "verdadeiro" });
      return;
    }
    questoes.push({
      id: novoId(),
      tipo: "MULTIPLE_CHOICE",
      etapa,
      enunciado: enunciado.join("\n"),
      alternativas: opcoes.slice(0, 6).map((o) => o.texto),
      correta: Math.max(0, opcoes.slice(0, 6).findIndex((o) => o.certa)),
    });
  });
  return { questoes, problemas };
}

/** O arquivo de exportação de uma aula. O formato tem nome e versão para a importação reconhecer. */
export function arquivoDaAula(r: RascunhoDaAula) {
  return JSON.stringify({ formato: "zulcode-aula", versao: 1, aula: r }, null, 2);
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const textos = (v: unknown, quantos: number, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, quantos).map((x) => x.slice(0, max)) : undefined;

/**
 * Lê uma aula exportada. O arquivo pode ter sido mexido à mão, então cada campo
 * é conferido (com os mesmos limites do servidor) e o que faltar ganha o padrão
 * de uma questão nova do mesmo tipo: o editor nunca recebe um formato que não
 * sabe desenhar.
 */
export function lerArquivoDaAula(conteudo: string): RascunhoDaAula {
  let dados: unknown;
  try {
    dados = JSON.parse(conteudo);
  } catch {
    throw new Error("O arquivo não é um JSON válido.");
  }
  const d = dados as { formato?: string; aula?: Record<string, unknown> };
  if (d?.formato !== "zulcode-aula" || !d.aula || !Array.isArray(d.aula.questoes)) throw new Error("Este arquivo não é uma aula exportada do ZulCode.");
  const a = d.aula;
  const etapas = Math.max(1, Math.min(MAX_ETAPAS, Math.trunc(Number(a.etapas)) || 2));

  return {
    titulo: texto(a.titulo, 200),
    xp: Math.max(0, Math.min(1000, Math.trunc(Number(a.xp)) || 0)),
    etapas,
    introducao: (Array.isArray(a.introducao) ? a.introducao.slice(0, 30) : []).map((bruto) => {
      const s = (bruto ?? {}) as Record<string, unknown>;
      const codigo = texto(s.codigo, 5000);
      return { titulo: texto(s.titulo, 200), texto: texto(s.texto, 5000), ...(codigo && { codigo }) };
    }),
    // Ids sempre novos (novaQuestao): importar a mesma aula duas vezes não pode
    // criar duas questões com o mesmo id.
    questoes: (a.questoes as unknown[]).slice(0, 200).map((bruta) => {
      const q = (bruta ?? {}) as Record<string, unknown>;
      const tipo = TIPOS.some((t) => t.tipo === q.tipo) ? (q.tipo as TipoDeQuestao) : "MULTIPLE_CHOICE";
      const base = novaQuestao(tipo, Math.max(1, Math.min(etapas, Math.trunc(Number(q.etapa)) || 1)));
      const nova: QuestaoDoRascunho = { ...base, enunciado: texto(q.enunciado, 2000) };
      if (base.alternativas) nova.alternativas = textos(q.alternativas, 6, 500) ?? base.alternativas;
      if (base.blocos) nova.blocos = textos(q.blocos, 8, 300) ?? base.blocos;
      if (base.correta !== undefined && typeof q.correta === "number") nova.correta = Math.trunc(q.correta);
      if (base.verdadeiro !== undefined && typeof q.verdadeiro === "boolean") nova.verdadeiro = q.verdadeiro;
      if (base.codigoAntes !== undefined) nova.codigoAntes = texto(q.codigoAntes, 5000);
      if (base.codigoDepois !== undefined) nova.codigoDepois = texto(q.codigoDepois, 5000);
      if (base.codigoInicial !== undefined) nova.codigoInicial = texto(q.codigoInicial, 10000);
      if (base.resultadoEsperado !== undefined) nova.resultadoEsperado = texto(q.resultadoEsperado, 2000);
      if (base.dica !== undefined || typeof q.dica === "string") nova.dica = texto(q.dica, 1000);
      const codigo = texto(q.codigo, 5000);
      if (codigo) nova.codigo = codigo;
      return nova;
    }),
  };
}
