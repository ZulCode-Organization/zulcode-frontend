/**
 * A frase da tela de detalhe de uma conquista, no passado e com o nome da
 * pessoa ("Vitor concluiu 10 aulas!"). A descrição do banco é uma instrução
 * ("Conclua 10 aulas.") e serve para quem ainda não tem; aqui é o feito.
 *
 * As famílias saem do id (lesson-10, streak-30...). O que não tem frase própria
 * cai no título da conquista.
 */
const NUMERO = /-(\d+)$/;

function milhar(n: number) {
  return n.toLocaleString("pt-BR");
}

const PROPRIAS: Record<string, (nome: string) => string> = {
  "first-step": (nome) => `${nome} concluiu a primeira aula!`,
  "perfect-1": (nome) => `${nome} concluiu uma aula perfeita, sem nenhum erro!`,
  "unit-1": (nome) => `${nome} finalizou a primeira unidade!`,
  "rank-10": (nome) => `${nome} alcançou o último rank!`,
  "course-completionist": (nome) => `${nome} finalizou 10 unidades!`,
  "richard-tribute": (nome) => `${nome} alcançou o rank 5 e desbloqueou a homenagem a Richard!`,
  "secret-coin-rain": (nome) => `${nome} ativou uma Chuva de Rupees!`,
  "secret-collector": (nome) => `${nome} juntou 10 cosméticos!`,
  "secret-fashionista": (nome) => `${nome} juntou 20 cosméticos!`,
  "secret-early-bird": (nome) => `${nome} concluiu uma aula antes das 6h!`,
  "secret-night-owl": (nome) => `${nome} estudou depois da meia-noite!`,
  "secret-first-legend": (nome) => `${nome} foi a primeira pessoa a chegar ao último rank!`,
  "secret-phoenix": (nome) => `${nome} voltou depois de perder a ofensiva!`,
  "secret-shield-bearer": (nome) => `${nome} comprou o primeiro Escudo de Pena!`,
  "secret-speedrunner": (nome) => `${nome} concluiu 10 aulas no primeiro dia!`,
  "secret-zul-master": (nome) => `${nome} acumulou 10.000 XP!`,
  "limited-top-10": (nome) => `${nome} ficou entre as 10 primeiras pessoas no rank máximo!`,
  "limited-pioneers": (nome) => `${nome} esteve entre os 25 primeiros a completar 50 aulas!`,
  "limited-perfectionists": (nome) => `${nome} esteve entre os 50 primeiros com 25 aulas perfeitas!`,
  "limited-streak-keepers": (nome) => `${nome} esteve entre os 100 primeiros a chegar a 30 dias de ofensiva!`,
  developer: (nome) => `${nome} constrói e mantém o ZulCode!`,
  "early-tester": (nome) => `${nome} ajudou a testar o ZulCode na fase inicial!`,
};

const FAMILIAS: [string, (nome: string, n: number) => string][] = [
  ["lesson", (nome, n) => `${nome} concluiu ${milhar(n)} aulas!`],
  ["perfect", (nome, n) => `${nome} concluiu ${milhar(n)} aulas perfeitas!`],
  ["coins", (nome, n) => `${nome} juntou ${milhar(n)} rupees!`],
  ["xp", (nome, n) => `${nome} acumulou ${milhar(n)} XP!`],
  ["streak", (nome, n) => `${nome} chegou a ${milhar(n)} dias de ofensiva!`],
  ["study", (nome, n) => `${nome} estudou em ${milhar(n)} dias diferentes!`],
  ["unit", (nome, n) => `${nome} finalizou ${milhar(n)} unidades!`],
  ["rank", (nome, n) => `${nome} alcançou o rank ${n}!`],
  ["consistency", (nome, n) => `${nome} estudou ${n} minutos por dia durante 7 dias!`],
];

export function fraseDaConquista(id: string, titulo: string, nome: string) {
  const primeiroNome = nome.trim() || "Você";
  const propria = PROPRIAS[id];
  if (propria) return propria(primeiroNome);
  const numero = NUMERO.exec(id);
  if (numero) {
    const familia = FAMILIAS.find(([prefixo]) => id.startsWith(`${prefixo}-`));
    if (familia) return familia[1](primeiroNome, Number(numero[1]));
  }
  return `${primeiroNome} desbloqueou a conquista "${titulo}"!`;
}
