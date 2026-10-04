"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { deixarDeSeguir, idsQueSigo, seguir } from "@/lib/social";

/**
 * Quem eu sigo, compartilhado por toda a tela.
 *
 * O estado mora fora do React de propósito. O carrossel de sugestões e as abas
 * Segue/Seguidores vivem na mesma página, em colunas diferentes, e precisam
 * concordar: seguir alguém no carrossel tem que aparecer na aba no mesmo
 * instante. Com estado dentro de cada componente, cada um teria a sua própria
 * verdade e eles se contradiriam até a próxima recarga.
 *
 * Um provider resolveria igual, mas teria que ser montado em toda página que
 * use qualquer um dos dois — e a lista é a mesma para o app inteiro, não por
 * sub-árvore.
 */
let sigo: Set<string> | null = null;
let emVoo = new Set<string>();
let buscando: Promise<void> | null = null;
let versao = 0;

const ouvintes = new Set<() => void>();

function avisar() {
  versao += 1;
  for (const ouvinte of ouvintes) ouvinte();
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

const lerVersao = () => versao;
/** No servidor nada foi carregado ainda, e a versão tem que ser estável entre
 * renderizações ou o React acusa loop. */
const lerVersaoNoServidor = () => 0;

/** Uma busca só, por mais componentes que peçam. */
function carregar() {
  if (sigo || buscando) return;
  buscando = idsQueSigo()
    .then(({ seguindo }) => {
      sigo = new Set(seguindo);
    })
    .catch(() => {
      // Sem sessão ou API fora: a lista fica vazia e os botões continuam
      // clicáveis — a falha real aparece ao tentar seguir.
      sigo = new Set();
    })
    .finally(() => {
      buscando = null;
      avisar();
    });
}

/** Esquece o que foi carregado. Usado na troca de conta, pra lista de uma
 * pessoa não vazar pra sessão da seguinte. */
export function limparSeguidos() {
  sigo = null;
  emVoo = new Set();
  buscando = null;
  avisar();
}

export function useSeguir() {
  useSyncExternalStore(inscrever, lerVersao, lerVersaoNoServidor);

  useEffect(() => {
    carregar();
  }, []);

  const alternar = useCallback(async (id: string) => {
    if (emVoo.has(id)) return;
    const seguiaAntes = sigo?.has(id) ?? false;

    // Otimista: o botão vira na hora. Numa lista de cartões, esperar a volta
    // da rede faz o toque parecer perdido.
    sigo = new Set(sigo ?? []);
    if (seguiaAntes) sigo.delete(id);
    else sigo.add(id);
    emVoo = new Set(emVoo).add(id);
    avisar();

    try {
      const estado = seguiaAntes ? await deixarDeSeguir(id) : await seguir(id);
      // A resposta manda, e não o palpite: se o servidor discordar (já seguia
      // de outro dispositivo, por exemplo), fica valendo o que ele diz.
      sigo = new Set(sigo);
      if (estado.euSigo) sigo.add(id);
      else sigo.delete(id);
    } catch {
      sigo = new Set(sigo);
      if (seguiaAntes) sigo.add(id);
      else sigo.delete(id);
    } finally {
      const restante = new Set(emVoo);
      restante.delete(id);
      emVoo = restante;
      avisar();
    }
  }, []);

  return {
    sigo: useCallback((id: string) => sigo?.has(id) ?? false, []),
    ocupado: useCallback((id: string) => emVoo.has(id), []),
    carregado: sigo !== null,
    alternar,
  };
}
