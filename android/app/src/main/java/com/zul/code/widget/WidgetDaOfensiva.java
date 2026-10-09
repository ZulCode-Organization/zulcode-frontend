package com.zul.code.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;

import androidx.appcompat.content.res.AppCompatResources;

import com.zul.code.MainActivity;
import com.zul.code.R;

/**
 * O widget da ofensiva.
 *
 * O Android só aceita um punhado de componentes prontos dentro de um widget, e
 * nenhum deles desenha a chama de duas cores do ZulCode. Então o widget inteiro
 * é uma imagem que nós pintamos aqui e entregamos numa ImageView: assim ele
 * fica igual ao ícone da barra de cima, inclusive nas faixas de cor.
 *
 * Os números vêm do retrato gravado pelo app (DadosDaOfensiva). Tocar abre o
 * app.
 */
public class WidgetDaOfensiva extends AppWidgetProvider {

    /** As mesmas faixas do app: azul até 29 dias, ciano a partir de 30, dourada a partir de 100. */
    private static int[] coresDaChama(DadosDaOfensiva dados) {
        if (!dados.acesa) return new int[] { 0xFF475569, 0xFF64748B };
        // O gás vale acima da faixa: saber que a sequência não apaga amanhã
        // importa mais do que há quanto tempo ela existe.
        if (dados.protegida) return new int[] { 0xFF7C3AED, 0xFF34D399 };
        if (dados.dias >= 100) return new int[] { 0xFFFBBF24, 0xFFFDE68A };
        if (dados.dias >= 30) return new int[] { 0xFF06B6D4, 0xFFA5F3FC };
        return new int[] { 0xFF2563EB, 0xFF38BDF8 };
    }

    @Override
    public void onUpdate(Context contexto, AppWidgetManager gerente, int[] ids) {
        for (int id : ids) desenhar(contexto, gerente, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context contexto, AppWidgetManager gerente, int id, Bundle novasOpcoes) {
        // Redimensionar muda o tamanho do desenho, então ele é refeito.
        desenhar(contexto, gerente, id);
    }

    private void desenhar(Context contexto, AppWidgetManager gerente, int id) {
        float densidade = contexto.getResources().getDisplayMetrics().density;
        Bundle opcoes = gerente.getAppWidgetOptions(id);
        int larguraDp = opcoes.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int alturaDp = opcoes.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (larguraDp <= 0) larguraDp = 150;
        if (alturaDp <= 0) alturaDp = 150;

        // O teto existe por causa da memória: um widget muito esticado geraria
        // um bitmap grande demais para o RemoteViews carregar.
        int largura = (int) Math.min(620, Math.max(120, larguraDp * densidade));
        int altura = (int) Math.min(620, Math.max(120, alturaDp * densidade));

        DadosDaOfensiva dados = DadosDaOfensiva.ler(contexto);
        Bitmap imagem = pintar(contexto, largura, altura, dados);

        RemoteViews telinha = new RemoteViews(contexto.getPackageName(), R.layout.widget_ofensiva);
        telinha.setImageViewBitmap(R.id.widget_imagem, imagem);
        telinha.setContentDescription(R.id.widget_imagem, descricao(dados));

        Intent abrir = new Intent(contexto, MainActivity.class);
        abrir.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int bandeiras = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        telinha.setOnClickPendingIntent(R.id.widget_imagem,
            PendingIntent.getActivity(contexto, 0, abrir, bandeiras));

        gerente.updateAppWidget(id, telinha);
    }

    private static String descricao(DadosDaOfensiva dados) {
        if (!dados.temDados) return "ZulCode: entre na sua conta";
        if (!dados.acesa) return "Ofensiva de " + dados.dias + " dias. Estude hoje para manter.";
        return "Ofensiva de " + dados.dias + (dados.dias == 1 ? " dia" : " dias");
    }

    /** Sem modificador para o teste de instrumentação poder pedir o desenho. */
    Bitmap pintar(Context contexto, int largura, int altura, DadosDaOfensiva dados) {
        Bitmap imagem = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(imagem);
        Paint pincel = new Paint(Paint.ANTI_ALIAS_FLAG);
        int[] cores = coresDaChama(dados);
        float menor = Math.min(largura, altura);

        // Fundo: o mesmo tom escuro do app, com um leve degradê para o widget
        // não virar um retângulo chapado em cima do papel de parede.
        float raio = menor * 0.16f;
        pincel.setShader(new LinearGradient(0, 0, 0, altura, 0xFF161B26, 0xFF0A0D14, Shader.TileMode.CLAMP));
        tela.drawRoundRect(new RectF(0, 0, largura, altura), raio, raio, pincel);
        pincel.setShader(null);

        float chama = menor * (altura > largura * 1.3f ? 0.46f : 0.42f);
        float centroX = largura / 2f;
        float topoChama = altura * 0.13f;
        float centroChama = topoChama + chama / 2f;

        // O brilho ao redor, só com a chama acesa: é o que dá a sensação de
        // calor sem precisar de mais nenhum elemento.
        if (dados.acesa && dados.temDados) {
            pincel.setShader(new RadialGradient(centroX, centroChama, chama * 1.15f,
                new int[] { (cores[0] & 0x00FFFFFF) | 0x55000000, 0x00000000 },
                new float[] { 0f, 1f }, Shader.TileMode.CLAMP));
            tela.drawCircle(centroX, centroChama, chama * 1.15f, pincel);
            pincel.setShader(null);
        }

        desenharChama(contexto, tela, centroX - chama / 2f, topoChama, chama, cores);

        float baseTexto = topoChama + chama + altura * 0.10f;
        pincel.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        pincel.setTextAlign(Paint.Align.CENTER);

        if (!dados.temDados) {
            pincel.setColor(0xFFE2E8F0);
            pincel.setTextSize(menor * 0.13f);
            tela.drawText("ZulCode", centroX, baseTexto, pincel);
            pincel.setColor(0xFF94A3B8);
            pincel.setTextSize(menor * 0.095f);
            tela.drawText("Toque para entrar", centroX, baseTexto + menor * 0.16f, pincel);
            return imagem;
        }

        pincel.setColor(dados.acesa ? Color.WHITE : 0xFF94A3B8);
        pincel.setTextSize(menor * 0.3f);
        tela.drawText(String.valueOf(dados.dias), centroX, baseTexto + menor * 0.1f, pincel);

        pincel.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        pincel.setColor(0xFF94A3B8);
        pincel.setTextSize(menor * 0.093f);
        String rotulo = dados.acesa
            ? (dados.dias == 1 ? "dia seguido" : "dias seguidos")
            : "estude hoje";
        tela.drawText(rotulo, centroX, baseTexto + menor * 0.24f, pincel);

        return imagem;
    }

    /** O corpo e o contorno, um por cima do outro, como no ícone do app. */
    private void desenharChama(Context contexto, Canvas tela, float x, float y, float tamanho, int[] cores) {
        Rect area = new Rect((int) x, (int) y, (int) (x + tamanho), (int) (y + tamanho));
        Drawable corpo = AppCompatResources.getDrawable(contexto, R.drawable.ic_chama);
        Drawable contorno = AppCompatResources.getDrawable(contexto, R.drawable.ic_chama_contorno);
        if (corpo != null) {
            corpo = corpo.mutate();
            corpo.setBounds(area);
            corpo.setColorFilter(new android.graphics.PorterDuffColorFilter(cores[0], android.graphics.PorterDuff.Mode.SRC_IN));
            corpo.draw(tela);
        }
        if (contorno != null) {
            contorno = contorno.mutate();
            contorno.setBounds(area);
            contorno.setColorFilter(new android.graphics.PorterDuffColorFilter(cores[1], android.graphics.PorterDuff.Mode.SRC_IN));
            contorno.draw(tela);
        }
    }
}
