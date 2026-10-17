import type { Metadata } from "next";
import { PaginaDeTexto, type Secao } from "@/components/shared/pagina-de-texto";

export const metadata: Metadata = { title: "Termos de uso · ZulCode" };

const SECOES: Secao[] = [
  {
    titulo: "O que é o ZulCode",
    paragrafos: [
      "O ZulCode é um aplicativo para aprender programação com aulas curtas, exercícios e um playground para rodar código. Ao criar uma conta ou usar o app, você concorda com estes termos.",
    ],
  },
  {
    titulo: "Sua conta",
    paragrafos: [
      "Para usar o ZulCode você precisa ter pelo menos 13 anos. Você é responsável por manter sua senha em segredo e pelo que acontece na sua conta.",
      "Use um nome e um e-mail verdadeiros. Contas usadas para enganar, assediar outras pessoas ou burlar as regras do app podem ser suspensas ou excluídas.",
    ],
  },
  {
    titulo: "Rupees, penas e itens",
    paragrafos: [
      "Rupees, penas, gás de ofensiva e os outros itens da loja existem só dentro do ZulCode. Eles não têm valor em dinheiro, não podem ser trocados por dinheiro e não são devolvidos se a conta for excluída.",
    ],
  },
  {
    titulo: "ZulCode PRO",
    paragrafos: [
      "O PRO é uma assinatura paga, mensal ou anual, ou um pagamento único por um período. O teste grátis, quando oferecido, vira assinatura no fim do período se não for cancelado antes.",
      "Você pode cancelar quando quiser em Configurações, Minha assinatura. O PRO continua valendo até o fim do período já pago. Os pagamentos são processados pelo Stripe ou pela loja do aplicativo; o ZulCode não guarda os dados do seu cartão.",
    ],
  },
  {
    titulo: "O que você cria",
    paragrafos: [
      "O código e os projetos que você cria no playground são seus. Ao compartilhar um projeto por link, você permite que qualquer pessoa com o link o veja e faça uma cópia.",
      "Não use o playground para rodar código que ataque outros sistemas, que tente burlar a segurança do app ou que viole leis.",
    ],
  },
  {
    titulo: "Mudanças e encerramento",
    paragrafos: [
      "O ZulCode pode mudar, ganhar ou perder funções, e estes termos podem ser atualizados. Mudanças importantes são avisadas no app.",
      "Você pode excluir sua conta a qualquer momento em Configurações, Privacidade.",
    ],
  },
  {
    titulo: "Contato",
    paragrafos: ["Dúvidas sobre estes termos podem ser enviadas pelo formulário em Configurações, Fazer comentários."],
  },
];

export default function TermosPage() {
  return <PaginaDeTexto titulo="Termos de uso" atualizadoEm="17 de outubro de 2026" secoes={SECOES} />;
}
