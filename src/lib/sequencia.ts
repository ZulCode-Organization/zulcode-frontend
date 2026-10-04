/**
 * A sequência está acesa hoje?
 *
 * Duas coisas apagam o fogo, e elas são diferentes:
 *
 *   - a sequência é zero (nunca começou, ou se perdeu);
 *   - a sequência existe, mas hoje ainda não foi feita.
 *
 * O número sozinho não distingue "5 dias, inclusive hoje" de "5 dias, e hoje
 * ainda não" — nos dois casos ele mostra 5. Quem separa é a data da última
 * atividade.
 *
 * A comparação é por dia no fuso de quem usa, não por diferença de horas: às
 * 00h10 a pessoa não estudou "há 20 minutos atrás no mesmo dia", ela está num
 * dia novo e o fogo precisa apagar.
 */
export function sequenciaAtivaHoje(streakAtual?: number | null, ultimaAtividade?: string | null): boolean {
  if (!streakAtual || streakAtual <= 0) return false;
  if (!ultimaAtividade) return false;

  const quando = new Date(ultimaAtividade);
  if (Number.isNaN(quando.getTime())) return false;

  const hoje = new Date();
  return (
    quando.getFullYear() === hoje.getFullYear() &&
    quando.getMonth() === hoje.getMonth() &&
    quando.getDate() === hoje.getDate()
  );
}
