"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Guarda o que as telas buscam no servidor, para não buscar tudo de novo a
 * cada troca de tela. A tela mostra na hora o que já tinha e atualiza por
 * trás, sem esqueleto; só a primeira vez (ou outra conta) espera a rede.
 *
 * Fica na memória e também no aparelho (localStorage), então o app aberto de
 * novo, ou sem internet, já começa com a última versão que viu. Cada entrada
 * é marcada com a conta dona: trocar de conta nunca mostra dado de outra
 * pessoa, e o logout apaga tudo (limparDadosGuardados).
 *
 * Mesmo espírito dos caches da trilha, dos cursos e do perfil, só que em um
 * lugar só para as outras telas (loja, metas, elementos, ranking...).
 */

type Entrada = { dono: string; em: number; dados: unknown };
type Situacao = { buscando: boolean; erro: boolean };

const PREFIXO = "zc-dados:";
const PARADO: Situacao = { buscando: false, erro: false };

const memoria = new Map<string, Entrada | null>();
const situacoes = new Map<string, Situacao>();
const ouvintes = new Map<string, Set<() => void>>();
const emAndamento = new Map<string, Promise<void>>();

function tokenAtual(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

/** A marca da conta: um pedaço do token, para não guardar o token inteiro de novo. */
function donoDe(token: string) {
  return token.slice(-24);
}

function avisar(chave: string) {
  ouvintes.get(chave)?.forEach((ouvinte) => ouvinte());
}

/** A entrada da conta atual, ou undefined. Devolve sempre o mesmo objeto enquanto nada muda. */
function ler(chave: string): Entrada | undefined {
  const token = tokenAtual();
  if (!token) return undefined;
  if (!memoria.has(chave)) {
    let salva: Entrada | null = null;
    try {
      const cru = localStorage.getItem(PREFIXO + chave);
      salva = cru ? (JSON.parse(cru) as Entrada) : null;
    } catch {
      salva = null;
    }
    memoria.set(chave, salva);
  }
  const entrada = memoria.get(chave);
  return entrada && entrada.dono === donoDe(token) ? entrada : undefined;
}

function gravar(chave: string, dados: unknown) {
  const token = tokenAtual();
  if (!token) return;
  const entrada: Entrada = { dono: donoDe(token), em: Date.now(), dados };
  memoria.set(chave, entrada);
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(entrada));
  } catch {
    // Sem espaço no aparelho: vale só a memória, até fechar o app.
  }
  avisar(chave);
}

function marcar(chave: string, situacao: Situacao) {
  situacoes.set(chave, situacao);
  avisar(chave);
}

/** Busca e guarda. Duas telas pedindo a mesma coisa ao mesmo tempo dividem a mesma busca. */
function buscarEGuardar<T>(chave: string, buscar: (token: string) => Promise<T>): Promise<void> {
  const token = tokenAtual();
  if (!token) return Promise.resolve();
  const andando = emAndamento.get(chave);
  if (andando) return andando;
  marcar(chave, { buscando: true, erro: false });
  const busca = buscar(token)
    .then((dados) => {
      gravar(chave, dados);
      marcar(chave, PARADO);
    })
    // O que já estava na tela continua; só fica marcado que a última busca falhou.
    .catch(() => marcar(chave, { buscando: false, erro: true }))
    .finally(() => emAndamento.delete(chave));
  emAndamento.set(chave, busca);
  return busca;
}

/** Muda o que está guardado sem ir ao servidor (ex.: resgatar uma meta). */
export function mudarGuardado<T>(chave: string, mudar: (atual: T | undefined) => T) {
  gravar(chave, mudar(ler(chave)?.dados as T | undefined));
}

/**
 * Marca como velho, sem apagar: a próxima tela que usar mostra o que tinha e
 * busca de novo por trás. Para depois de uma aula, de uma compra etc.
 */
export function envelhecerGuardado(chave: string) {
  const entrada = ler(chave);
  if (!entrada) return;
  const velha: Entrada = { ...entrada, em: 0 };
  memoria.set(chave, velha);
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(velha));
  } catch {
    // vale só a memória
  }
  avisar(chave);
}

/** Esquece uma tela: a próxima visita busca de novo do zero. */
export function esquecerGuardado(chave: string) {
  memoria.delete(chave);
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    // nada guardado
  }
  avisar(chave);
}

/** Logout: apaga tudo, da memória e do aparelho. */
export function limparDadosGuardados() {
  memoria.clear();
  situacoes.clear();
  emAndamento.clear();
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const chave = localStorage.key(i);
      if (chave?.startsWith(PREFIXO)) localStorage.removeItem(chave);
    }
  } catch {
    // sem armazenamento: só havia a memória
  }
  ouvintes.forEach((lista) => lista.forEach((ouvinte) => ouvinte()));
}

/**
 * Os dados de uma tela. `buscar` precisa ser estável (uma função de fora do
 * componente ou um useCallback). Com `chave` nula, não busca nada.
 *
 * - `carregando`: ainda não há nada para mostrar (primeira vez).
 * - `atualizando`: há dados na tela e uma busca nova está a caminho.
 * - `fresco`: por quanto tempo o que foi guardado vale sem buscar de novo ao abrir a tela.
 */
export function useDadosGuardados<T>(chave: string | null, buscar: (token: string) => Promise<T>, fresco = 30_000) {
  const assinar = useCallback(
    (ouvinte: () => void) => {
      if (!chave) return () => undefined;
      const lista = ouvintes.get(chave) ?? new Set<() => void>();
      ouvintes.set(chave, lista);
      lista.add(ouvinte);
      return () => {
        lista.delete(ouvinte);
      };
    },
    [chave],
  );
  const entrada = useSyncExternalStore(assinar, () => (chave ? ler(chave) : undefined), () => undefined);
  const situacao = useSyncExternalStore(assinar, () => (chave ? situacoes.get(chave) ?? PARADO : PARADO), () => PARADO);

  const recarregar = useCallback(() => (chave ? buscarEGuardar(chave, buscar) : Promise.resolve()), [chave, buscar]);

  // Ao abrir a tela: busca se não há nada guardado ou se o que há já passou do prazo.
  useEffect(() => {
    if (!chave) return;
    const guardada = ler(chave);
    if (!guardada || Date.now() - guardada.em > fresco) void buscarEGuardar(chave, buscar);
  }, [chave, buscar, fresco]);

  // Falhou: tenta de novo quando a internet volta ou o app volta para a frente.
  useEffect(() => {
    if (!chave || !situacao.erro) return;
    const tentar = () => {
      if (document.visibilityState === "visible") void buscarEGuardar(chave, buscar);
    };
    const timer = window.setTimeout(tentar, 8_000);
    window.addEventListener("online", tentar);
    document.addEventListener("visibilitychange", tentar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", tentar);
      document.removeEventListener("visibilitychange", tentar);
    };
  }, [chave, buscar, situacao.erro]);

  return {
    dados: entrada?.dados as T | undefined,
    carregando: !!chave && !entrada && !situacao.erro,
    atualizando: situacao.buscando,
    erro: situacao.erro,
    recarregar,
  };
}
