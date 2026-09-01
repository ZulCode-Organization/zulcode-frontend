import { cn } from "@/lib/utils";

/**
 * Selo de conta verificada, do lado do nome.
 *
 * A forma e a estrela recortada com o visto dentro, como a do Instagram: e o
 * desenho que as pessoas ja leem como "essa conta e mesmo quem diz ser". As
 * 24 pontas foram calculadas em volta do centro (raios 11.2 e 9.1 num
 * viewBox de 24), e nao desenhadas no olho, pra estrela fechar simetrica em
 * qualquer tamanho.
 *
 * O azul e fixo de proposito. Ele nao usa a cor primaria do app nem a cor de
 * tema da pessoa: um selo que muda de cor conforme o perfil deixa de parecer
 * carimbo da plataforma e vira enfeite do usuario.
 *
 * Quem liga e so a administracao, pelo isVerified. Nao tem relacao com o Pro
 * -- pagar nao verifica ninguem.
 */
export function SeloVerificado({ className, titulo = "Conta verificada" }: { className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={titulo}
      className={cn("inline-block size-[1em] shrink-0 align-[-0.1em] text-sky-500", className)}
    >
      <title>{titulo}</title>
      <path fill="currentColor" d="M12.00 0.80 L14.36 3.21 L17.60 2.30 L18.43 5.57 L21.70 6.40 L20.79 9.64 L23.20 12.00 L20.79 14.36 L21.70 17.60 L18.43 18.43 L17.60 21.70 L14.36 20.79 L12.00 23.20 L9.64 20.79 L6.40 21.70 L5.57 18.43 L2.30 17.60 L3.21 14.36 L0.80 12.00 L3.21 9.64 L2.30 6.40 L5.57 5.57 L6.40 2.30 L9.64 3.21 Z" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.1 12.3 2.7 2.7 5.1-5.6"
      />
    </svg>
  );
}
