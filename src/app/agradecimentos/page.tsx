import type { Metadata } from "next";
import { PaginaDeTexto, type Secao } from "@/components/shared/pagina-de-texto";

export const metadata: Metadata = { title: "Agradecimentos · ZulCode" };

/** Os créditos que as licenças dos ícones pedem (CC BY 4.0 exige crédito visível). */
const SECOES: Secao[] = [
  {
    titulo: "Ícones",
    paragrafos: [
      "Solar Icons, por 480 Design — CC BY 4.0.",
      "Streamline (o desenho da pena) — CC BY 4.0.",
      "Phosphor Icons, Hugeicons, Duo Icons e Lucide — MIT/ISC.",
      "Fluent Emoji, da Microsoft — MIT.",
    ],
  },
  {
    titulo: "Pagamentos e serviços",
    paragrafos: ["Stripe, Firebase, Google AdMob, Vercel e Render."],
  },
  {
    titulo: "O Zul",
    paragrafos: ["O Zul e as artes dele foram feitos pela equipe do ZulCode. Obrigado a quem testou o app desde as primeiras versões."],
  },
];

export default function AgradecimentosPage() {
  return <PaginaDeTexto titulo="Agradecimentos" secoes={SECOES} />;
}
