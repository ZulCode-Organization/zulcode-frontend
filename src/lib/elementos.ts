import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import type { DESENHOS_SOLAR } from "@/components/shared/desenhos-solar";
import type { ElementoGlossario } from "@/lib/types/elemento";

/** O domínio cheio: acertos seguidos na prática. Igual ao do backend. */
export const DOMINIO_CHEIO = 3;

// ---------------------------------------------------------------------------
// O símbolo de cada elemento
// ---------------------------------------------------------------------------

export type Simbolo = { tipo: "codigo"; texto: string } | { tipo: "icone"; nome: keyof typeof DESENHOS_SOLAR };

/**
 * Quando o termo é código, o símbolo é o próprio código (como as letras do
 * Duolingo); quando é um conceito, um ícone da Solar, a mesma família da loja.
 * Os nomes das linguagens viram a sigla.
 */
const SIMBOLOS: Record<string, Simbolo> = {
  "objeto": { tipo: "codigo", texto: "{ }" },
  "propriedade": { tipo: "codigo", texto: ".nome" },
  "comparação": { tipo: "codigo", texto: ">=" },
  "condição": { tipo: "codigo", texto: "if" },
  "laço": { tipo: "codigo", texto: "for" },
  "função": { tipo: "codigo", texto: "f( )" },
  "parâmetro": { tipo: "codigo", texto: "(x)" },
  "retorno": { tipo: "codigo", texto: "return" },
  "array": { tipo: "codigo", texto: "[ ]" },
  "índice": { tipo: "codigo", texto: "[0]" },
  "variável": { tipo: "codigo", texto: "x =" },
  "tipo de dado": { tipo: "codigo", texto: "123" },
  "operador": { tipo: "codigo", texto: "*" },
  "javascript": { tipo: "codigo", texto: "JS" },
  "typescript": { tipo: "codigo", texto: "TS" },
  "python": { tipo: "codigo", texto: "Py" },
  "java": { tipo: "codigo", texto: "Java" },
  "c#": { tipo: "codigo", texto: "C#" },
  "go": { tipo: "codigo", texto: "Go" },
  "validação": { tipo: "icone", nome: "Escudo" },
  "depuração": { tipo: "icone", nome: "Bug" },
  "algoritmo": { tipo: "icone", nome: "Algoritmo" },
  "estado": { tipo: "icone", nome: "Estado" },
  "entrada": { tipo: "icone", nome: "Entrada" },
  "saída": { tipo: "icone", nome: "Saida" },
  "programa": { tipo: "icone", nome: "Programa" },
  "requisito": { tipo: "icone", nome: "Requisito" },
  "regra de negócio": { tipo: "icone", nome: "Regra" },
  "interface": { tipo: "icone", nome: "Interface" },
  "fluxo": { tipo: "icone", nome: "Fluxo" },
  "teste": { tipo: "icone", nome: "Teste" },
  "caso limite": { tipo: "icone", nome: "CasoLimite" },
  "refatoração": { tipo: "icone", nome: "Refatoracao" },
  "responsabilidade": { tipo: "icone", nome: "Responsabilidade" },
};

export function simboloDe(termo: string): Simbolo {
  return SIMBOLOS[termo.trim().toLowerCase()] ?? { tipo: "icone", nome: "Codigo" };
}

// ---------------------------------------------------------------------------
// A cor de cada assunto
// ---------------------------------------------------------------------------

/** As classes são literais para o Tailwind gerar. `cor` é o hexadecimal, para as barrinhas. */
type CorDoAssunto = { texto: string; fundo: string; borda: string; cor: string };
const CORES: Record<string, CorDoAssunto> = {
  "Primeiros passos": { texto: "text-[#1892ff]", fundo: "bg-[#1892ff]/15", borda: "border-[#1892ff]/70", cor: "#1892ff" },
  "Decisões e lógica": { texto: "text-amber-500", fundo: "bg-amber-500/15", borda: "border-amber-500/70", cor: "#f59e0b" },
  "Funções e dados": { texto: "text-violet-500", fundo: "bg-violet-500/15", borda: "border-violet-500/70", cor: "#8b5cf6" },
  "Dados estruturados": { texto: "text-teal-500", fundo: "bg-teal-500/15", borda: "border-teal-500/70", cor: "#14b8a6" },
  "Prática de programação": { texto: "text-pink-500", fundo: "bg-pink-500/15", borda: "border-pink-500/70", cor: "#ec4899" },
  "Qualidade do código": { texto: "text-emerald-500", fundo: "bg-emerald-500/15", borda: "border-emerald-500/70", cor: "#10b981" },
  "Projeto guiado": { texto: "text-orange-500", fundo: "bg-orange-500/15", borda: "border-orange-500/70", cor: "#f97316" },
};
/** "Fundamentos de JavaScript", "Fundamentos de Python"…: o mesmo azul-céu. */
const FUNDAMENTOS: CorDoAssunto = { texto: "text-sky-500", fundo: "bg-sky-500/15", borda: "border-sky-500/70", cor: "#0ea5e9" };
/** Um assunto novo, criado no admin, cai numa cor desta lista (sempre a mesma para o mesmo nome). */
const RESERVA: CorDoAssunto[] = [
  { texto: "text-indigo-500", fundo: "bg-indigo-500/15", borda: "border-indigo-500/70", cor: "#6366f1" },
  { texto: "text-rose-500", fundo: "bg-rose-500/15", borda: "border-rose-500/70", cor: "#f43f5e" },
  { texto: "text-lime-500", fundo: "bg-lime-500/15", borda: "border-lime-500/70", cor: "#84cc16" },
];

export function corDoAssunto(assunto: string): CorDoAssunto {
  if (CORES[assunto]) return CORES[assunto];
  if (assunto.startsWith("Fundamentos")) return FUNDAMENTOS;
  let soma = 0;
  for (const letra of assunto) soma = (soma + letra.charCodeAt(0)) % 997;
  return RESERVA[soma % RESERVA.length];
}

// ---------------------------------------------------------------------------
// O exemplo com cores
// ---------------------------------------------------------------------------

export type Pedaco = { texto: string; tipo: "palavra" | "texto" | "numero" | "comentario" | "simbolo" | "comum" };

const PALAVRAS = new Set([
  "for", "of", "in", "if", "else", "elif", "while", "return", "const", "let", "var", "function", "def", "class", "new",
  "true", "false", "True", "False", "None", "null", "undefined", "print", "func", "fmt", "public", "static", "void", "int", "string",
]);

/** Quebra o exemplo em pedaços com o tipo de cada um. Texto puro, nunca HTML. */
export function realcar(codigo: string): Pedaco[] {
  const pedacos: Pedaco[] = [];
  const padrao = /(\/\/.*$|#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_À-ú][\wÀ-ú]*)|([=+\-*/<>!&|%.:,;()[\]{}→]+)|(\s+)|(.)/gm;
  for (const m of codigo.matchAll(padrao)) {
    const [texto, comentario, aspas, numero, nome, simbolo] = m;
    pedacos.push({
      texto,
      tipo: comentario ? "comentario" : aspas ? "texto" : numero ? "numero" : nome && PALAVRAS.has(nome) ? "palavra" : simbolo ? "simbolo" : "comum",
    });
  }
  return pedacos;
}

/** Se o exemplo parece código (e não uma frase), ele vai num bloco de código. */
export function pareceCodigo(exemplo: string) {
  return /[=()[\]{}"'<>*]|\/\//.test(exemplo) || /\b(for|if|return|def|const|let)\b/.test(exemplo);
}

// ---------------------------------------------------------------------------
// A prática rápida
// ---------------------------------------------------------------------------

export type Pergunta = {
  enunciado: string;
  /** Um trecho mostrado antes das opções (o exemplo ou o significado). */
  destaque?: { texto: string; codigo: boolean };
  opcoes: string[];
  certa: number;
};

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Duas opções erradas, diferentes da certa e entre si. */
function distratores(certa: string, candidatos: string[]) {
  const unicos = [...new Set(candidatos.map((c) => c.trim()))].filter((c) => c && c !== certa.trim());
  return embaralhar(unicos).slice(0, 2);
}

function montar(enunciado: string, certa: string, erradas: string[], destaque?: Pergunta["destaque"]): Pergunta | null {
  if (erradas.length < 2) return null;
  const opcoes = embaralhar([certa, ...erradas]);
  return { enunciado, destaque, opcoes, certa: opcoes.indexOf(certa) };
}

/**
 * As 3 perguntas da prática de um elemento, montadas com os dados do próprio
 * glossário: o que ele significa, qual exemplo é dele e qual elemento é
 * aquele significado. As erradas vêm dos outros elementos do curso. Chame
 * num clique (usa sorteio), nunca durante a renderização.
 */
export function perguntasDe(elemento: ElementoGlossario, todos: ElementoGlossario[]): Pergunta[] {
  const outros = todos.filter((e) => e.id !== elemento.id && e.term !== elemento.term);
  // O próprio termo some do significado, senão a resposta da 3ª pergunta fica escrita na pergunta.
  const semOTermo = elemento.meaning.replace(new RegExp(elemento.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "___");
  const lista = [
    montar(`O que é ${elemento.term}?`, elemento.meaning, distratores(elemento.meaning, outros.map((e) => e.meaning))),
    montar(`Qual destes é um exemplo de ${elemento.term}?`, elemento.example, distratores(elemento.example, outros.map((e) => e.example))),
    montar("Qual elemento é este?", elemento.term, distratores(elemento.term, outros.map((e) => e.term)), { texto: semOTermo, codigo: false }),
  ];
  return lista.filter((p): p is Pergunta => p !== null);
}

/** Guarda uma resposta da prática. Devolve o domínio novo (ou null se não deu). */
export async function registrarResposta(curso: string, elementoId: string, acertou: boolean) {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  const resposta = await fetchComTimeout(`${API_BASE_URL}/languages/${curso}/elements/${encodeURIComponent(elementoId)}/pratica`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ acertou }),
  }).catch(() => null);
  if (!resposta?.ok) return null;
  return (await resposta.json()) as { dominio: number; errosRecentes: number };
}
