import { TransicaoDaPagina } from "@/components/shared/transicao-de-tela";

/** Remonta a cada troca de seção: é o que dispara o deslizar das telas sem casca. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <TransicaoDaPagina>{children}</TransicaoDaPagina>;
}
