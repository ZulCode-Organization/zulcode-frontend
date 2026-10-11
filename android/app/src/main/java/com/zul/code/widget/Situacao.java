package com.zul.code.widget;

import com.zul.code.arte.Chama;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * O que o widget mostra agora, tirado do retrato que o app gravou.
 *
 * É calculado na hora de desenhar, e não no app, porque o dia vira com o app
 * fechado: à meia-noite a chama de quem estudou ontem apaga e vira "estude
 * hoje"; quem passou um dia inteiro sem estudar (e sem proteção guardada)
 * perdeu a ofensiva e volta a zero.
 */
final class Situacao {

    final boolean temDados;
    /** O número que aparece. */
    final int dias;
    final boolean feitoHoje;
    /** Tem ofensiva e ainda não estudou hoje. */
    final boolean emRisco;
    final boolean protegida;
    final int minutosHoje;
    final int meta;
    /**
     * Os últimos sete dias, com hoje no fim: acesos, protegidos e o dia da
     * semana de cada um (0 é domingo). Sete dias corridos, e não a semana do
     * calendário, para a ofensiva aparecer inteira até num domingo.
     */
    final boolean[] semanaAcesa = new boolean[7];
    final boolean[] semanaProtegida = new boolean[7];
    final int[] diaDaSemana = new int[7];
    final int hoje = 6;
    /** Depois das 20h a conversa do Zul fica urgente. */
    final boolean noite;
    final String chaveDoDia;

    Situacao(DadosDaOfensiva d) {
        Calendar agora = Calendar.getInstance();
        String hojeTexto = dia(0);
        String ontem = dia(-1);
        chaveDoDia = hojeTexto;
        temDados = d.temDados;
        protegida = d.protecoes > 0;
        meta = Math.max(1, d.metaMinutos);
        noite = agora.get(Calendar.HOUR_OF_DAY) >= 20;

        String ultimo = d.ultimoEstudo;
        if (ultimo.isEmpty()) {
            // App antigo, que não manda o dia: vale o que ele disse, até o dia virar.
            feitoHoje = d.acesa && hojeTexto.equals(d.diaDoRetrato);
            dias = d.dias;
        } else {
            feitoHoje = ultimo.equals(hojeTexto);
            boolean emDia = feitoHoje || ultimo.equals(ontem);
            // Mais de um dia sem estudo apaga a ofensiva, a menos que haja
            // proteção guardada: aí quem decide é o servidor, na próxima lição.
            dias = emDia || protegida ? d.dias : 0;
        }
        emRisco = !feitoHoje && dias > 0;
        // Os minutos de hoje vêm do servidor, que corta o dia no horário de
        // Brasília; o celular pode estar em outro fuso. Quem ainda não
        // estudou no dia do celular não pode aparecer com a meta cumprida.
        minutosHoje = feitoHoje && hojeTexto.equals(d.diaDoRetrato) ? d.minutosHoje : 0;

        // Os dias acesos são os `dias` seguidos que terminam no último estudo.
        Calendar fim = ultimo.isEmpty() ? null : ler(ultimo);
        for (int i = 0; i < 7; i++) {
            Calendar quando = (Calendar) agora.clone();
            quando.add(Calendar.DAY_OF_YEAR, i - hoje);
            diaDaSemana[i] = quando.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY;
            String chave = formatar(quando);
            semanaProtegida[i] = d.diasProtegidos.contains(chave);
            if (dias <= 0) continue;
            if (fim == null) {
                // Sem o dia exato, conta para trás a partir de hoje (ou de ontem).
                int atras = hoje - i - (feitoHoje ? 0 : 1);
                semanaAcesa[i] = atras >= 0 && atras < dias;
            } else {
                long diferenca = Math.round((fim.getTimeInMillis() - meiaNoite(quando)) / 86_400_000.0);
                semanaAcesa[i] = diferenca >= 0 && diferenca < dias;
            }
        }
    }

    int[] coresDaChama(Tema tema) {
        if (!feitoHoje) return tema.chamaApagada;
        return tema.coresDaChama(Chama.cores(dias, true, protegida));
    }

    /** aaaa-mm-dd de hoje mais `deslocamento` dias, no fuso do celular. */
    static String dia(int deslocamento) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, deslocamento);
        return formatar(c);
    }

    private static String formatar(Calendar c) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.getTime());
    }

    private static Calendar ler(String texto) {
        try {
            Calendar c = Calendar.getInstance();
            c.setTime(new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(texto));
            return c;
        } catch (Exception e) {
            return null;
        }
    }

    private static long meiaNoite(Calendar c) {
        Calendar copia = (Calendar) c.clone();
        copia.set(Calendar.HOUR_OF_DAY, 0);
        copia.set(Calendar.MINUTE, 0);
        copia.set(Calendar.SECOND, 0);
        copia.set(Calendar.MILLISECOND, 0);
        return copia.getTimeInMillis();
    }
}
