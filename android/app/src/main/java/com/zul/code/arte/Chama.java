package com.zul.code.arte;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

import androidx.appcompat.content.res.AppCompatResources;

import com.zul.code.R;

/**
 * A chama da ofensiva desenhada fora do app (widget e notificação), igual à da
 * barra de cima: corpo e contorno em duas cores, nas mesmas faixas.
 */
public final class Chama {

    private Chama() {}

    /**
     * As cores da chama: corpo e contorno. Azul até 29 dias, ciano a partir
     * de 30, dourada a partir de 100; apagada fica cinza, e o gás guardado
     * (roxo com verde) vale acima da faixa, como no app.
     */
    public static int[] cores(int dias, boolean acesa, boolean protegida) {
        if (!acesa) return new int[] { 0xFF475569, 0xFF64748B };
        if (protegida) return new int[] { 0xFF7C3AED, 0xFF34D399 };
        if (dias >= 100) return new int[] { 0xFFFBBF24, 0xFFFDE68A };
        if (dias >= 30) return new int[] { 0xFF06B6D4, 0xFFA5F3FC };
        return new int[] { 0xFF2563EB, 0xFF38BDF8 };
    }

    /** O corpo e o contorno, um por cima do outro, num quadrado de `tamanho`. */
    public static void desenhar(Context contexto, Canvas tela, float x, float y, float tamanho, int[] cores) {
        Rect area = new Rect((int) x, (int) y, (int) (x + tamanho), (int) (y + tamanho));
        pintar(AppCompatResources.getDrawable(contexto, R.drawable.ic_chama), area, cores[0], tela);
        pintar(AppCompatResources.getDrawable(contexto, R.drawable.ic_chama_contorno), area, cores[1], tela);
    }

    private static void pintar(Drawable desenho, Rect area, int cor, Canvas tela) {
        if (desenho == null) return;
        Drawable copia = desenho.mutate();
        copia.setBounds(area);
        copia.setColorFilter(new PorterDuffColorFilter(cor, PorterDuff.Mode.SRC_IN));
        copia.draw(tela);
    }
}
