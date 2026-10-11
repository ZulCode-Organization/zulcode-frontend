package com.zul.code.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.widget.RemoteViews;

import com.zul.code.MainActivity;
import com.zul.code.R;

/**
 * A base dos widgets: pinta a imagem no tamanho que ele ocupa e entrega ao
 * lançador. Cada widget só diz qual desenho é o dele.
 *
 * No visual automático vão duas imagens, a clara e a escura, e o layout
 * mostra a do tema do celular (layout-night): assim o widget acompanha a troca
 * de tema na hora, sem precisar ser redesenhado.
 */
abstract class WidgetDoZulCode extends AppWidgetProvider {

    /** O maior lado da imagem, em pixels: o lançador recusa imagens pesadas demais. */
    private static final int LIMITE = 900;

    abstract String tipo();

    @Override
    public void onUpdate(Context contexto, AppWidgetManager gerente, int[] ids) {
        for (int id : ids) desenhar(contexto, gerente, id);
        Widgets.agendarVirada(contexto);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context contexto, AppWidgetManager gerente, int id, Bundle novasOpcoes) {
        // Redimensionar muda o tamanho do desenho, então ele é refeito.
        desenhar(contexto, gerente, id);
    }

    @Override
    public void onDisabled(Context contexto) {
        // O último deste tipo saiu da tela: se não sobrou nenhum, o relógio para.
        Widgets.agendarVirada(contexto);
    }

    private void desenhar(Context contexto, AppWidgetManager gerente, int id) {
        float densidade = contexto.getResources().getDisplayMetrics().density;
        Bundle opcoes = gerente.getAppWidgetOptions(id);
        // Em pé, o widget tem a largura mínima e a altura máxima informadas.
        int larguraDp = opcoes.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int alturaDp = opcoes.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (larguraDp <= 0) larguraDp = Widgets.SEMANA.equals(tipo()) || Widgets.ZUL.equals(tipo()) ? 300 : 150;
        if (alturaDp <= 0) alturaDp = 150;
        float escala = Math.min(densidade, LIMITE / (float) Math.max(larguraDp, alturaDp));
        int largura = Math.max(80, Math.round(larguraDp * escala));
        int altura = Math.max(80, Math.round(alturaDp * escala));

        String estilo = Widgets.estilo(contexto);
        RemoteViews telinha = new RemoteViews(contexto.getPackageName(), R.layout.widget_zulcode);
        if (Widgets.AUTOMATICO.equals(estilo)) {
            telinha.setImageViewBitmap(R.id.widget_claro, Widgets.pintar(contexto, tipo(), largura, altura, Tema.CLARO));
            telinha.setImageViewBitmap(R.id.widget_escuro, Widgets.pintar(contexto, tipo(), largura, altura, Tema.ESCURO));
        } else {
            // A mesma imagem nos dois lugares: o Android a envia uma vez só.
            Bitmap imagem = Widgets.pintar(contexto, tipo(), largura, altura, Widgets.tema(estilo));
            telinha.setImageViewBitmap(R.id.widget_claro, imagem);
            telinha.setImageViewBitmap(R.id.widget_escuro, imagem);
        }
        String descricao = Widgets.descricao(contexto);
        telinha.setContentDescription(R.id.widget_claro, descricao);
        telinha.setContentDescription(R.id.widget_escuro, descricao);

        // Tocar abre o app onde ele estava (sem trocar de tela: pode haver uma
        // lição pela metade).
        Intent abrir = new Intent(contexto, MainActivity.class);
        abrir.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        telinha.setOnClickPendingIntent(R.id.widget_raiz, PendingIntent.getActivity(contexto, 0,
            abrir, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        gerente.updateAppWidget(id, telinha);
    }
}
