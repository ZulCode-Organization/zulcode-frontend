/**
 * "Não sei qual escolher": o gosto da pessoa (a pergunta `interest` do
 * onboarding) vira uma linguagem sugerida.
 *
 * Cada gosto tem uma lista em ordem de preferência. Vale a primeira que existe
 * no catálogo agora; assim, quando HTML ou SQL entrarem, quem gosta de design
 * ou de dados passa a receber a sugestão certa sem mexer aqui.
 */
type Sugestao = { preferidas: string[]; porque: Record<string, string> };

const SUGESTOES: Record<string, Sugestao> = {
  design: {
    preferidas: ["html", "css", "javascript"],
    porque: {
      html: "Com HTML você monta a estrutura de uma página e já vê o resultado na tela.",
      css: "Com CSS você escolhe cores, fontes e o jeito de cada coisa na página.",
      javascript: "JavaScript é o que dá vida aos sites: botões, animações e tudo que se mexe na tela.",
    },
  },
  logic: {
    preferidas: ["python", "javascript"],
    porque: {
      python: "Python tem uma escrita enxuta: você foca no raciocínio, não em sinais estranhos.",
      javascript: "JavaScript roda em qualquer navegador e é ótimo para treinar a lógica.",
    },
  },
  web: {
    preferidas: ["javascript", "typescript"],
    porque: {
      javascript: "JavaScript é a linguagem dos sites e também roda em apps e servidores.",
      typescript: "TypeScript é JavaScript com tipos, muito usado em sites e apps grandes.",
    },
  },
  data: {
    preferidas: ["python", "sql"],
    porque: {
      python: "Python é a linguagem mais usada para dados, planilhas e automação de tarefas.",
      sql: "SQL é como se conversa com bancos de dados para buscar e organizar informação.",
    },
  },
  games: {
    preferidas: ["csharp", "javascript"],
    porque: {
      csharp: "C# é a linguagem da Unity, onde são feitos muitos jogos de celular e computador.",
      javascript: "Com JavaScript dá para fazer jogos que rodam direto no navegador.",
    },
  },
  systems: {
    preferidas: ["java", "csharp"],
    porque: {
      java: "Java está em sistemas de bancos e grandes empresas e é muito pedido em vagas.",
      csharp: "C# é muito usado em sistemas de empresas, com a plataforma .NET.",
    },
  },
  cloud: {
    preferidas: ["go", "python"],
    porque: {
      go: "Go foi feita no Google para servidores rápidos; Docker e Kubernetes são escritos nela.",
      python: "Python é muito usado para automatizar servidores e a nuvem.",
    },
  },
};

export function sugerirLinguagem(interesse: string, disponiveis: string[]) {
  const sugestao = SUGESTOES[interesse];
  const escolhida = sugestao?.preferidas.find((slug) => disponiveis.includes(slug)) ?? disponiveis[0];
  if (!escolhida) return null;
  return { slug: escolhida, porque: sugestao?.porque[escolhida] ?? "" };
}
