"use client";

import { useCallback, useRef, useState } from "react";

export type EstadoAcao = "parada" | "enviando" | "concluida" | "erro";

/**
 * Uma ação do admin e o estado dela.
 *
 * O admin fala com um banco de verdade e várias rotas demoram um tempo bem
 * visível. Antes cada botão disparava o fetch e a tela não mudava nada até a
 * resposta chegar: dava a impressão de que o clique não pegou, e a pessoa
 * clicava de novo. Aqui o estado acompanha a requisição do início ao fim, e é
 * dele que sai a animação — então ela dura exatamente o que a ação durar, em
 * vez de ser um tempo fixo chutado.
 *
 * O "concluída" se apaga sozinho depois de um instante, pra confirmação não
 * virar um selo permanente na tela. O timer é limpo a cada nova execução, se
 * não duas ações seguidas apagariam a marca uma da outra na hora errada.
 */
export function useAcao<T extends unknown[]>(executar: (...args: T) => Promise<void>, msVisivel = 1600) {
  const [estado, setEstado] = useState<EstadoAcao>("parada");
  const [erro, setErro] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rodar = useCallback(
    async (...args: T) => {
      // Trava contra clique repetido: sem isso, dois cliques rápidos mandam a
      // mesma concessão de moedas duas vezes.
      if (estado === "enviando") return;
      if (timer.current) clearTimeout(timer.current);
      setEstado("enviando");
      setErro("");
      try {
        await executar(...args);
        setEstado("concluida");
        timer.current = setTimeout(() => setEstado("parada"), msVisivel);
      } catch (e) {
        setEstado("erro");
        setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
      }
    },
    [executar, estado, msVisivel]
  );

  return { estado, erro, rodar, enviando: estado === "enviando", limpar: () => { setEstado("parada"); setErro(""); } };
}

/** Lê o erro que a API mandou, incluindo a lista de validação do Nest. */
export async function erroDaResposta(res: Response, padrao: string) {
  const corpo = await res.json().catch(() => null);
  const mensagem = (corpo as { message?: unknown } | null)?.message;
  if (Array.isArray(mensagem)) return mensagem.join(". ");
  if (typeof mensagem === "string") return mensagem;
  return padrao;
}

/** Chamada autenticada do admin, já com o erro traduzido. */
export async function chamarAdmin(url: string, init: RequestInit = {}, padraoErro = "Não foi possível concluir.") {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Sua sessão expirou. Entre de novo.");
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await erroDaResposta(res, padraoErro));
  return res.status === 204 ? null : res.json().catch(() => null);
}
