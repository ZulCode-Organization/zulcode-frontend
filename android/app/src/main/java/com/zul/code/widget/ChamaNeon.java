package com.zul.code.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

import com.zul.code.R;

/**
 * A chama neon do app, nos widgets: a mesma arte da barra de cima. A cor conta
 * tempo — quente até 29 dias, violeta a partir de 30 e verde-água a partir de
 * 100. Apagada fica cinza; com gás guardado ganha um halo verde, como no app.
 */
final class ChamaNeon {

    /** Verde do gás (o mesmo halo do app). */
    static final int COR_DO_GAS = 0xFF34D399;

    private static Bitmap quente;
    private static Bitmap violeta;
    private static Bitmap agua;

    private ChamaNeon() {}

    /** A cor principal da faixa, para o brilho em volta e os dias acesos da semana. */
    static int cor(int dias) {
        if (dias >= 100) return 0xFF06B6D4;
        if (dias >= 30) return 0xFFA855F7;
        return 0xFFFF7A3D;
    }

    private static Bitmap arte(Context c, int dias) {
        if (dias >= 100) {
            if (agua == null) agua = BitmapFactory.decodeResource(c.getResources(), R.drawable.chama_neon_agua);
            return agua;
        }
        if (dias >= 30) {
            if (violeta == null) violeta = BitmapFactory.decodeResource(c.getResources(), R.drawable.chama_neon_violeta);
            return violeta;
        }
        if (quente == null) quente = BitmapFactory.decodeResource(c.getResources(), R.drawable.chama_neon_quente);
        return quente;
    }

    /** Desenha a chama centrada num quadrado de `tamanho` a partir de (x, y). */
    static void desenhar(Context c, Canvas tela, float x, float y, float tamanho, int dias, boolean acesa, boolean protegida) {
        Bitmap arte = arte(c, dias);
        if (arte == null) return;
        float proporcao = arte.getWidth() / (float) arte.getHeight();
        float altura = tamanho;
        float largura = altura * proporcao;
        RectF onde = new RectF(x + (tamanho - largura) / 2f, y, x + (tamanho + largura) / 2f, y + altura);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        if (acesa && protegida) {
            float raio = tamanho * 0.62f;
            p.setShader(new RadialGradient(onde.centerX(), onde.centerY(), raio,
                new int[] { (COR_DO_GAS & 0x00FFFFFF) | 0x66000000, 0x00000000 }, new float[] { 0.3f, 1f }, Shader.TileMode.CLAMP));
            tela.drawCircle(onde.centerX(), onde.centerY(), raio, p);
            p.setShader(null);
        }
        if (!acesa) {
            ColorMatrix cinza = new ColorMatrix();
            cinza.setSaturation(0);
            p.setColorFilter(new ColorMatrixColorFilter(cinza));
            p.setAlpha(115);
        }
        tela.drawBitmap(arte, null, onde, p);
    }
}
