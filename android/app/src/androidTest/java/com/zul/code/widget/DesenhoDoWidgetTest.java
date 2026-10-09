package com.zul.code.widget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.graphics.Bitmap;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Desenha o widget em cada estado e guarda as imagens, para conferir o
 * resultado sem precisar arrastá-lo para a tela inicial à mão.
 *
 * Também é o teste que garante o que mais importa no desenho: que a cor da
 * chama acompanha as faixas do app e que a sequência apagada não sai igual à
 * acesa.
 */
@RunWith(AndroidJUnit4.class)
public class DesenhoDoWidgetTest {

    private Bitmap desenhar(Context contexto, int dias, boolean acesa, boolean protegida, boolean temDados, String nome) throws Exception {
        if (temDados) DadosDaOfensiva.gravar(contexto, dias, acesa, protegida);
        else DadosDaOfensiva.limpar(contexto);

        Bitmap imagem = new WidgetDaOfensiva().pintar(contexto, 330, 330, DadosDaOfensiva.ler(contexto));
        File destino = new File(contexto.getExternalFilesDir(null), nome + ".png");
        try (FileOutputStream saida = new FileOutputStream(destino)) {
            imagem.compress(Bitmap.CompressFormat.PNG, 100, saida);
        }
        assertTrue(destino.length() > 0);
        return imagem;
    }

    /** O pixel do meio da chama, que é onde a faixa de cor aparece. */
    private int corDaChama(Bitmap imagem) {
        return imagem.getPixel(imagem.getWidth() / 2, (int) (imagem.getHeight() * 0.28));
    }

    @Test
    public void desenhaCadaEstado() throws Exception {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();

        Bitmap azul = desenhar(contexto, 7, true, false, true, "01-azul");
        Bitmap ciano = desenhar(contexto, 45, true, false, true, "02-ciano");
        Bitmap dourada = desenhar(contexto, 120, true, false, true, "03-dourada");
        Bitmap protegida = desenhar(contexto, 45, true, true, true, "04-protegida");
        Bitmap apagada = desenhar(contexto, 7, false, false, true, "05-apagada");
        Bitmap umDia = desenhar(contexto, 1, true, false, true, "06-um-dia");
        Bitmap semConta = desenhar(contexto, 0, false, false, false, "07-sem-conta");

        // Cada faixa tem a própria cor, e nenhuma se repete.
        assertNotEquals(corDaChama(azul), corDaChama(ciano));
        assertNotEquals(corDaChama(ciano), corDaChama(dourada));
        assertNotEquals(corDaChama(dourada), corDaChama(protegida));
        // A sequência apagada não pode sair igual à acesa.
        assertNotEquals(corDaChama(azul), corDaChama(apagada));
        assertEquals(330, umDia.getWidth());
        assertEquals(330, semConta.getHeight());
    }

    /** O retrato gravado pelo app é o mesmo que o widget lê depois. */
    @Test
    public void guardaOqueOAppEnvia() {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();
        DadosDaOfensiva.gravar(contexto, 42, true, true);

        DadosDaOfensiva lido = DadosDaOfensiva.ler(contexto);
        assertEquals(42, lido.dias);
        assertTrue(lido.acesa);
        assertTrue(lido.protegida);
        assertTrue(lido.temDados);

        DadosDaOfensiva.limpar(contexto);
        assertTrue(!DadosDaOfensiva.ler(contexto).temDados);
    }
}
