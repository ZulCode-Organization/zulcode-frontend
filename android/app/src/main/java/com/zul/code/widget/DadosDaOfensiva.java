package com.zul.code.widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * O retrato da ofensiva que o widget desenha.
 *
 * O widget roda fora do navegador do app e não enxerga nem a sessão nem o
 * localStorage. Então o app, toda vez que carrega o perfil, grava estes três
 * números aqui — e o widget só lê. Nada de token nem de rede no lado nativo:
 * o que o widget mostra é exatamente o que a pessoa viu na barra de cima.
 */
public final class DadosDaOfensiva {
    private static final String ARQUIVO = "zulcode.widget";
    private static final String DIAS = "dias";
    private static final String ACESA = "acesa";
    private static final String PROTEGIDA = "protegida";
    private static final String TEM_DADOS = "temDados";

    public final int dias;
    public final boolean acesa;
    public final boolean protegida;
    /** Falso antes do primeiro login: aí o widget convida a abrir o app. */
    public final boolean temDados;

    private DadosDaOfensiva(int dias, boolean acesa, boolean protegida, boolean temDados) {
        this.dias = dias;
        this.acesa = acesa;
        this.protegida = protegida;
        this.temDados = temDados;
    }

    private static SharedPreferences prefs(Context contexto) {
        return contexto.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE);
    }

    public static DadosDaOfensiva ler(Context contexto) {
        SharedPreferences p = prefs(contexto);
        return new DadosDaOfensiva(
            p.getInt(DIAS, 0),
            p.getBoolean(ACESA, false),
            p.getBoolean(PROTEGIDA, false),
            p.getBoolean(TEM_DADOS, false)
        );
    }

    /** Grava o retrato e manda o Android redesenhar os widgets na tela. */
    public static void gravar(Context contexto, int dias, boolean acesa, boolean protegida) {
        prefs(contexto).edit()
            .putInt(DIAS, Math.max(0, dias))
            .putBoolean(ACESA, acesa)
            .putBoolean(PROTEGIDA, protegida)
            .putBoolean(TEM_DADOS, true)
            .apply();
        redesenhar(contexto);
    }

    /** Volta ao estado de quem nunca entrou. Usado quando a pessoa sai da conta. */
    public static void limpar(Context contexto) {
        prefs(contexto).edit().clear().apply();
        redesenhar(contexto);
    }

    static void redesenhar(Context contexto) {
        AppWidgetManager gerente = AppWidgetManager.getInstance(contexto);
        ComponentName quem = new ComponentName(contexto, WidgetDaOfensiva.class);
        int[] ids = gerente.getAppWidgetIds(quem);
        if (ids.length == 0) return;

        // O aviso vai pelo próprio widget: assim ele passa pelo onUpdate de
        // sempre, e o desenho mora num lugar só.
        Intent aviso = new Intent(contexto, WidgetDaOfensiva.class);
        aviso.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        aviso.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        contexto.sendBroadcast(aviso);
    }
}
