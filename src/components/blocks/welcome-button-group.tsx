import { BotaoRelevo } from "@/components/shared/botao-relevo";

interface ButtonGroupProps {
  data: {
    labelPrimary: string;
    linkPrimary: string;
    labelSecond: string;
    linkSecond: string;
  };
}

/**
 * Os dois botões da porta de entrada.
 *
 * Usam o mesmo corpo em relevo da Jornada — duas camadas sólidas, a de trás
 * mais escura, e a face descendo no clique. É a primeira tela que a pessoa vê,
 * e é dela que sai a expectativa de como o resto do aplicativo responde ao
 * toque: um botão chapado aqui e botões com corpo lá dentro dariam a impressão
 * de dois aplicativos diferentes.
 */
export default function ButtonGroup({ data }: ButtonGroupProps) {
  return (
    <div className="flex w-full animate-fade-in-up flex-col gap-4" style={{ animationDelay: "160ms" }}>
      <BotaoRelevo href={data.linkPrimary}>{data.labelPrimary}</BotaoRelevo>
      <BotaoRelevo href={data.linkSecond} variante="neutro">
        {data.labelSecond}
      </BotaoRelevo>
    </div>
  );
}
