"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BotaoRelevo } from "@/components/shared/botao-relevo";
import { entrarComProvedor, type ProvedorSocial } from "@/lib/auth/social";

/**
 * As marcas do GitHub e do Google, desenhadas aqui.
 *
 * O lucide tirou os ícones de marca das versões novas, e desenhar um "parecido"
 * seria pior do que não ter: num botão de entrar, a marca é o que diz pra onde
 * a pessoa vai, e uma aproximação gera desconfiança justo na hora de entregar
 * uma conta. São os traçados oficiais.
 */
function MarcaGitHub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function MarcaGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/**
 * Entrar com GitHub ou Google.
 *
 * Os dois dividem a linha em partes iguais: nenhum dos dois é "o recomendado",
 * e dar mais peso a um empurraria a escolha sem motivo.
 *
 * Quando algo dá errado, quem avisa é a tela de login: o backend devolve a
 * pessoa pra lá com o motivo na URL, porque a falha pode acontecer já fora
 * daqui, do lado do provedor.
 */
export function BotoesSociais() {
  const [enviando, setEnviando] = useState<ProvedorSocial | null>(null);

  // O estado de envio nao se desfaz: daqui o navegador sai do aplicativo e vai
  // pro provedor. Zera-lo deixaria o botao clicavel de novo no instante entre o
  // clique e a troca de pagina, e dois cliques abririam duas autorizacoes.
  const entrar = (provedor: ProvedorSocial) => {
    setEnviando(provedor);
    entrarComProvedor(provedor);
  };

  const face = "gap-2.5 px-4 py-3.5 text-[0.82rem] normal-case tracking-normal";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <BotaoRelevo variante="neutro" faceClassName={face} onClick={() => entrar("github")} disabled={enviando !== null}>
          {enviando === "github" ? <Loader2 className="size-[22px] animate-spin" /> : <MarcaGitHub className="size-[22px]" />}
          GitHub
        </BotaoRelevo>

        <BotaoRelevo variante="neutro" faceClassName={face} onClick={() => entrar("google")} disabled={enviando !== null}>
          {enviando === "google" ? <Loader2 className="size-[22px] animate-spin" /> : <MarcaGoogle className="size-[22px]" />}
          Google
        </BotaoRelevo>
      </div>

    </div>
  );
}
