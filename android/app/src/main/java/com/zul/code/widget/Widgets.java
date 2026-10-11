package com.zul.code.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;

import java.util.Calendar;

/**
 * O que vale para todos os widgets: quais existem, como cada um é pintado, o
 * visual escolhido nas Configurações e o relógio que os redesenha quando o dia
 * vira.
 */
public final class Widgets {

    public static final String OFENSIVA = "ofensiva";
    public static final String SEMANA = "semana";
    public static final String ZUL = "zul";
    static final String[] TIPOS = { OFENSIVA, SEMANA, ZUL };

    /** Segue o tema do celular; os outros fixam um visual. */
    public static final String AUTOMATICO = "auto";
    static final String[] ESTILOS = { AUTOMATICO, "claro", "escuro", "azul" };
    /** Fora do retrato da ofensiva: sair da conta não desfaz a escolha. */
    private static final String ARQUIVO_DO_ESTILO = "zulcode.widget.estilo";

    private Widgets() {}

    static Class<?> classe(String tipo) {
        switch (tipo) {
            case SEMANA: return WidgetDaSemana.class;
            case ZUL: return WidgetDoZul.class;
            default: return WidgetDaOfensiva.class;
        }
    }

    /** Pinta um widget com o retrato atual. Também serve às prévias das Configurações. */
    public static Bitmap pintar(Context c, String tipo, int largura, int altura, Tema tema) {
        DadosDaOfensiva dados = DadosDaOfensiva.ler(c);
        Situacao s = new Situacao(dados);
        Textos textos = new Textos(dados.textos);
        switch (tipo) {
            case SEMANA: return Pintor.semana(c, largura, altura, s, tema, textos, dados.nome);
            case ZUL: return Pintor.zul(c, largura, altura, s, tema, textos, dados.nome);
            default: return Pintor.ofensiva(c, largura, altura, s, tema, textos, dados.nome);
        }
    }

    /** O texto que o leitor de tela fala sobre o widget. */
    static String descricao(Context c) {
        DadosDaOfensiva dados = DadosDaOfensiva.ler(c);
        Situacao s = new Situacao(dados);
        Textos textos = new Textos(dados.textos);
        if (!s.temDados) return textos.entrarTitulo() + ": " + textos.entrarTexto();
        return s.dias + " " + textos.rotulo(s);
    }

    static Tema tema(String estilo) {
        switch (estilo) {
            case "claro": return Tema.CLARO;
            case "azul": return Tema.AZUL;
            default: return Tema.ESCURO;
        }
    }

    public static String estilo(Context c) {
        return c.getSharedPreferences(ARQUIVO_DO_ESTILO, Context.MODE_PRIVATE).getString("estilo", AUTOMATICO);
    }

    public static void definirEstilo(Context c, String estilo) {
        boolean valido = false;
        for (String e : ESTILOS) valido |= e.equals(estilo);
        if (!valido) return;
        c.getSharedPreferences(ARQUIVO_DO_ESTILO, Context.MODE_PRIVATE).edit().putString("estilo", estilo).apply();
        redesenharTodos(c);
    }

    static int[] ids(Context c, String tipo) {
        return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, classe(tipo)));
    }

    /** Manda cada widget na tela se redesenhar, pelo onUpdate de sempre. */
    public static void redesenharTodos(Context c) {
        for (String tipo : TIPOS) {
            int[] ids = ids(c, tipo);
            if (ids.length == 0) continue;
            Intent aviso = new Intent(c, classe(tipo)).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            aviso.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            c.sendBroadcast(aviso);
        }
        agendarVirada(c);
    }

    /**
     * O próximo redesenho sozinho: à meia-noite (a chama apaga, a semana anda)
     * e às 20h (o Zul passa a avisar que a ofensiva está acabando).
     *
     * O alarme não acorda o celular: com a tela apagada ninguém vê o widget, e
     * ele toca assim que a tela acende.
     */
    static void agendarVirada(Context c) {
        AlarmManager alarmes = c.getSystemService(AlarmManager.class);
        PendingIntent virada = PendingIntent.getBroadcast(c, 2001, new Intent(c, ReceptorDaVirada.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean algum = false;
        for (String tipo : TIPOS) algum |= ids(c, tipo).length > 0;
        if (!algum) {
            alarmes.cancel(virada);
            return;
        }
        Calendar quando = Calendar.getInstance();
        int hora = quando.get(Calendar.HOUR_OF_DAY);
        if (hora >= 20) quando.add(Calendar.DAY_OF_YEAR, 1);
        quando.set(Calendar.HOUR_OF_DAY, hora >= 20 ? 0 : 20);
        quando.set(Calendar.MINUTE, 0);
        quando.set(Calendar.SECOND, 5);
        quando.set(Calendar.MILLISECOND, 0);
        alarmes.setAndAllowWhileIdle(AlarmManager.RTC, quando.getTimeInMillis(), virada);
    }

    /** O Android deixa o app pedir para pôr um widget na tela inicial? (8.0+, e depende do lançador.) */
    public static boolean podeFixar(Context c) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && AppWidgetManager.getInstance(c).isRequestPinAppWidgetSupported();
    }

    /** Pede ao lançador para pôr o widget na tela; ele mesmo mostra a confirmação. */
    public static boolean fixar(Context c, String tipo) {
        if (!podeFixar(c)) return false;
        return AppWidgetManager.getInstance(c).requestPinAppWidget(new ComponentName(c, classe(tipo)), null, null);
    }
}
