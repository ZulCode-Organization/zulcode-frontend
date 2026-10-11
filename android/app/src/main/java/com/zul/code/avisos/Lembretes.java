package com.zul.code.avisos;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Random;

/**
 * Os lembretes de estudo, agendados no próprio celular (não dependem de
 * internet nem do Firebase).
 *
 * São dois por dia: o do horário que a pessoa escolheu e o "último aviso" das
 * 22h, para quem tem ofensiva e ainda não estudou. Os dois conferem, na hora
 * de tocar, se ela já estudou hoje — aí ficam quietos.
 *
 * Os textos chegam prontos do app, na língua da pessoa e com as variações de
 * frase; aqui só se sorteia uma e troca {dias} e {nome}.
 */
public final class Lembretes {

    static final String ARQUIVO = "zulcode.avisos";
    static final int ID_LEMBRETE = 7100;
    static final int ID_RISCO = 7200;
    static final int ID_EXEMPLO = 7300;
    private static final int HORA_DO_RISCO = 22;

    private Lembretes() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE);
    }

    static void configurar(Context c, boolean ativo, int hora, int minuto, String textos) {
        SharedPreferences.Editor e = prefs(c).edit().putBoolean("ativo", ativo).putInt("hora", hora).putInt("minuto", minuto);
        if (textos != null) e.putString("textos", textos);
        e.apply();
        garantirCanais(c);
        reagendar(c);
    }

    /** Os canais com os nomes na língua do app (os de reserva, em português, antes de ela os mandar). */
    static void garantirCanais(Context c) {
        JSONObject canais = textos(c).optJSONObject("canais");
        Avisos.garantirCanais(c,
            canais != null ? canais.optString("lembretes", "Lembretes de estudo") : "Lembretes de estudo",
            canais != null ? canais.optString("novidades", "Novidades e avisos") : "Novidades e avisos");
    }

    /** O que o app sabe da pessoa agora: dias de ofensiva e o último dia de estudo (aaaa-mm-dd, no fuso do celular). */
    static void progresso(Context c, int dias, String ultimoEstudo, String nome) {
        prefs(c).edit().putInt("dias", Math.max(0, dias)).putString("ultimoEstudo", ultimoEstudo).putString("nome", nome).apply();
    }

    /** Some com tudo: a pessoa saiu da conta. */
    static void limpar(Context c) {
        prefs(c).edit().clear().apply();
        reagendar(c);
    }

    static void reagendar(Context c) {
        AlarmManager alarmes = c.getSystemService(AlarmManager.class);
        PendingIntent lembrete = alarme(c, ReceptorDeLembrete.LEMBRETE, 1001);
        PendingIntent risco = alarme(c, ReceptorDeLembrete.RISCO, 1002);
        alarmes.cancel(lembrete);
        alarmes.cancel(risco);

        SharedPreferences p = prefs(c);
        if (!p.getBoolean("ativo", false)) return;
        int hora = p.getInt("hora", 19);
        int minuto = p.getInt("minuto", 0);
        // Inexato de propósito: o Android junta os alarmes para poupar bateria
        // e entrega alguns minutos depois, o que não importa para um lembrete,
        // e não exige a permissão de alarme exato.
        alarmes.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, proxima(hora, minuto), lembrete);
        if (hora < HORA_DO_RISCO) alarmes.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, proxima(HORA_DO_RISCO, 0), risco);
    }

    /** "Mais tarde": o mesmo lembrete daqui a uma hora, uma vez só. */
    static void adiar(Context c) {
        c.getSystemService(AlarmManager.class).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + 60 * 60 * 1000L, alarme(c, ReceptorDeLembrete.ADIADO, 1003));
    }

    static PendingIntent alarme(Context c, String acao, int codigo) {
        Intent intent = new Intent(c, ReceptorDeLembrete.class).setAction(acao);
        return PendingIntent.getBroadcast(c, codigo, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static long proxima(int hora, int minuto) {
        Calendar quando = Calendar.getInstance();
        quando.set(Calendar.HOUR_OF_DAY, hora);
        quando.set(Calendar.MINUTE, minuto);
        quando.set(Calendar.SECOND, 0);
        quando.set(Calendar.MILLISECOND, 0);
        if (quando.getTimeInMillis() <= System.currentTimeMillis()) quando.add(Calendar.DAY_OF_YEAR, 1);
        return quando.getTimeInMillis();
    }

    static boolean estudouHoje(Context c) {
        String hoje = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        return hoje.equals(prefs(c).getString("ultimoEstudo", ""));
    }

    /** Toca um lembrete: `tipo` é "lembrete" ou "risco". `forcar` ignora o "já estudou" (para o exemplo). */
    static void disparar(Context c, String tipo, boolean forcar) {
        if (!forcar && estudouHoje(c)) return;
        SharedPreferences p = prefs(c);
        int dias = p.getInt("dias", 0);
        // Sem ofensiva não há o que perder: o último aviso fica quieto, e o
        // lembrete vira um convite para começar.
        if ("risco".equals(tipo) && dias <= 0 && !forcar) return;
        String lista = "risco".equals(tipo) ? "risco" : dias > 0 ? "lembrete" : "comecar";

        JSONObject t = textos(c);
        JSONObject frase = sortear(t.optJSONArray(lista));
        String nome = p.getString("nome", "");
        JSONObject unidade = t.optJSONObject("unidade");
        String diasTexto = (dias + " " + (unidade == null ? "" : dias == 1 ? unidade.optString("um") : unidade.optString("varios"))).trim();
        String titulo = preencher(frase != null ? frase.optString("titulo") : "ZulCode", dias, diasTexto, nome);
        String texto = preencher(frase != null ? frase.optString("texto") : "", dias, diasTexto, nome);
        JSONObject acoes = t.optJSONObject("acoes");
        String rotulo = dias == 1 ? t.optString("rotuloDia", "dia de ofensiva") : t.optString("rotuloDias", "dias de ofensiva");
        int id = forcar ? ID_EXEMPLO : "risco".equals(tipo) ? ID_RISCO : ID_LEMBRETE;

        Avisos.mostrar(c, id, Avisos.CANAL_LEMBRETES, titulo, texto, "/home", dias, rotulo,
            acoes != null ? acoes.optString("estudar", null) : null,
            acoes != null ? acoes.optString("depois", null) : null);
    }

    private static JSONObject textos(Context c) {
        try {
            return new JSONObject(prefs(c).getString("textos", "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private static JSONObject sortear(JSONArray lista) {
        if (lista == null || lista.length() == 0) return null;
        return lista.optJSONObject(new Random().nextInt(lista.length()));
    }

    private static String preencher(String modelo, int dias, String diasTexto, String nome) {
        String primeiro = nome == null ? "" : nome.trim().split("\\s+")[0];
        // {diasTexto} antes de {dias}: o nome de um contém o do outro.
        return modelo.replace("{diasTexto}", diasTexto).replace("{dias}", String.valueOf(dias)).replace("{nome}", primeiro);
    }
}
