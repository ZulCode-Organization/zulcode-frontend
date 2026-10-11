package com.zul.code.avisos;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;

import com.zul.code.R;
import com.zul.code.arte.Chama;

/**
 * A imagem grande que aparece quando a pessoa abre a notificação: a chama da
 * ofensiva dela, o número de dias e o Zul espiando no canto.
 *
 * É pintada na hora, com o número de verdade, pelo mesmo motivo do widget: os
 * modelos prontos do Android só aceitam texto, e um aviso de ofensiva sem a
 * chama não parece do ZulCode.
 */
final class ArteDoAviso {

    private static final int LARGURA = 1024;
    private static final int ALTURA = 512;
    /** Onde o texto acaba e o Zul começa. */
    private static final int LIMITE_DO_TEXTO = 780;

    private ArteDoAviso() {}

    /** A cabeça do Zul colorida, para o ícone grande da notificação. */
    static Bitmap cabecaDoZul(Context contexto) {
        return BitmapFactory.decodeResource(contexto.getResources(), R.drawable.zul_cabeca);
    }

    static Bitmap ofensiva(Context contexto, int dias, String rotulo) {
        Bitmap imagem = Bitmap.createBitmap(LARGURA, ALTURA, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(imagem);
        Paint pincel = new Paint(Paint.ANTI_ALIAS_FLAG);
        int[] cores = Chama.cores(dias, true, false);

        // Fundo escuro do app, com a luz da chama vazando por trás dela.
        pincel.setShader(new LinearGradient(0, 0, LARGURA, ALTURA, 0xFF161B26, 0xFF0A0D14, Shader.TileMode.CLAMP));
        tela.drawRect(new RectF(0, 0, LARGURA, ALTURA), pincel);
        float cx = 250, cy = 250, raio = 260;
        pincel.setShader(new RadialGradient(cx, cy, raio,
            new int[] { (cores[0] & 0x00FFFFFF) | 0x66000000, 0x00000000 }, new float[] { 0f, 1f }, Shader.TileMode.CLAMP));
        tela.drawCircle(cx, cy, raio, pincel);
        pincel.setShader(null);

        Chama.desenhar(contexto, tela, 90, 90, 320, cores);

        // O número diminui com os dígitos para não encostar no Zul.
        String numero = String.valueOf(dias);
        float corpo = numero.length() >= 3 ? 150 : 190;
        pincel.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        pincel.setColor(0xFFFFFFFF);
        pincel.setTextSize(corpo);
        tela.drawText(numero, 440, 300, pincel);

        // O rótulo encolhe até caber antes do Zul (em inglês ele é curto; em
        // português, "dias de ofensiva" é comprido).
        pincel.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        pincel.setColor(0xFF94A3B8);
        float tamanhoDoRotulo = 46;
        pincel.setTextSize(tamanhoDoRotulo);
        while (pincel.measureText(rotulo) > LIMITE_DO_TEXTO - 446 && tamanhoDoRotulo > 28) {
            tamanhoDoRotulo -= 2;
            pincel.setTextSize(tamanhoDoRotulo);
        }
        tela.drawText(rotulo, 446, 370, pincel);

        Bitmap zul = cabecaDoZul(contexto);
        if (zul != null) tela.drawBitmap(zul, null, new Rect(LIMITE_DO_TEXTO + 24, 290, 1004, 490), pincel);
        return imagem;
    }
}
