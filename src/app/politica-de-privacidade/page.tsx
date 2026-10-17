import type { Metadata } from "next";
import { PaginaDeTexto, type Secao } from "@/components/shared/pagina-de-texto";

export const metadata: Metadata = { title: "Política de privacidade · ZulCode" };

const SECOES: Secao[] = [
  {
    titulo: "O que guardamos",
    paragrafos: [
      "Conta: nome, e-mail, a senha (guardada de forma cifrada, nunca em texto), avatar, código público e as escolhas do início (curso e nível).",
      "Estudo: lições feitas, respostas, XP, ofensiva, metas, conquistas, rupees, penas e os projetos do playground.",
      "Aparelho: o identificador usado para enviar notificações, quando você as ativa.",
      "Assinatura: o estado do seu PRO e o histórico de cobranças. Os dados do cartão ficam com o Stripe ou com a loja do aplicativo, não com o ZulCode.",
    ],
  },
  {
    titulo: "Para que usamos",
    paragrafos: [
      "Para o app funcionar (guardar seu progresso, mostrar a tabela da liga, enviar os lembretes que você ligou), para cobrar o PRO e para melhorar as aulas — por exemplo, descobrir quais questões confundem mais gente.",
      "Não vendemos seus dados.",
    ],
  },
  {
    titulo: "Quem mais vê",
    paragrafos: [
      "Outras pessoas veem o que é público: seu nome, avatar, código, XP, ofensiva e conquistas no perfil e na tabela da liga.",
      "Serviços que ajudam o app a funcionar: Stripe (pagamentos), Google e GitHub (se você entrar por eles), Firebase (notificações) e Google AdMob (anúncios para quem não tem PRO, que pode usar o identificador de publicidade do aparelho).",
    ],
  },
  {
    titulo: "Seus direitos (LGPD)",
    paragrafos: [
      "Você pode ver e corrigir seus dados no Perfil, baixar uma cópia de tudo em Configurações, Privacidade, Baixar meus dados, e excluir a conta em Configurações, Privacidade, Excluir minha conta. A exclusão apaga a conta e o progresso de forma definitiva; uma assinatura ativa é cancelada antes.",
    ],
  },
  {
    titulo: "Idade",
    paragrafos: ["O ZulCode não é feito para menores de 13 anos e não coleta dados deles de propósito."],
  },
  {
    titulo: "Contato",
    paragrafos: ["Pedidos sobre seus dados podem ser enviados pelo formulário em Configurações, Fazer comentários."],
  },
];

export default function PoliticaDePrivacidadePage() {
  return <PaginaDeTexto titulo="Política de privacidade" atualizadoEm="17 de outubro de 2026" secoes={SECOES} />;
}
